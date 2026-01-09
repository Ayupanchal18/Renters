import { Router } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { connectDB } from "../src/config/db.js";
import { logAuthEvent } from "../src/utils/auditUtils.js";

const router = Router();

/* ---------------------- SECURITY CONFIGURATION ---------------------- */
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";
const jwtSecret = process.env.JWT_SECRET;

/* ---------------------- HELPERS ---------------------- */
const safeUser = (u) => ({
    id: u._id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    address: u.address,
    userType: u.userType,
    role: u.role,
    avatar: u.avatar,
    emailVerified: u.emailVerified,
    phoneVerified: u.phoneVerified,
    authProvider: u.authProvider,
    createdAt: u.createdAt,
});

const generateTokens = (user) => {
    const accessToken = jwt.sign(
        { sub: user._id, role: user.role, type: 'access' },
        jwtSecret,
        { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    const refreshToken = jwt.sign(
        { sub: user._id, type: 'refresh' },
        jwtSecret,
        { expiresIn: REFRESH_TOKEN_EXPIRY }
    );

    return { accessToken, refreshToken };
};

const setRefreshTokenCookie = (res, refreshToken) => {
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
};

/* ---------------------- GOOGLE OAUTH ---------------------- */
/**
 * Exchange Google authorization code for tokens and user info
 * Uses OAuth2 authorization code flow (more reliable than FedCM)
 */
async function exchangeGoogleCode(code) {
    try {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
            throw new Error('Google OAuth is not configured');
        }

        // Exchange authorization code for tokens
        // For popup flow, redirect_uri must be 'postmessage'
        const tokenParams = new URLSearchParams({
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: 'postmessage',
            grant_type: 'authorization_code',
        });

        console.log('Exchanging Google auth code...');

        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: tokenParams,
        });

        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok) {
            console.error('Google token exchange failed:', {
                status: tokenResponse.status,
                error: tokenData.error,
                description: tokenData.error_description,
            });
            throw new Error(tokenData.error_description || 'Failed to exchange authorization code');
        }

        const tokens = tokenData;

        // Get user info using the access token
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        });

        if (!userInfoResponse.ok) {
            throw new Error('Failed to fetch user info from Google');
        }

        const userInfo = await userInfoResponse.json();

        console.log('Google user info received:', {
            id: userInfo.id,
            email: userInfo.email,
            hasPicture: !!userInfo.picture
        });

        return {
            id: userInfo.id,
            email: userInfo.email,
            name: userInfo.name,
            picture: userInfo.picture || null,
            emailVerified: userInfo.verified_email,
        };
    } catch (error) {
        console.error('Google code exchange failed:', error.message);
        throw new Error('Failed to authenticate with Google');
    }
}

/**
 * Verify Google ID token (legacy support for credential flow)
 */
async function verifyGoogleToken(credential) {
    try {
        const response = await fetch(
            `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`
        );

        if (!response.ok) {
            throw new Error('Invalid Google token');
        }

        const payload = await response.json();

        const expectedClientId = process.env.GOOGLE_CLIENT_ID;
        if (expectedClientId && payload.aud !== expectedClientId) {
            throw new Error('Token was not issued for this application');
        }

        return {
            id: payload.sub,
            email: payload.email,
            name: payload.name,
            picture: payload.picture,
            emailVerified: payload.email_verified === 'true',
        };
    } catch (error) {
        console.error('Google token verification failed:', error.message);
        throw new Error('Failed to verify Google token');
    }
}

router.post("/google", async (req, res) => {
    try {
        await connectDB();

        const { code, credential } = req.body;

        if (!code && !credential) {
            return res.status(400).json({
                success: false,
                error: "Google authorization code or credential is required"
            });
        }

        // Get Google user info - support both auth code and credential flows
        let googleUser;
        if (code) {
            // New OAuth2 popup flow (authorization code)
            googleUser = await exchangeGoogleCode(code);
        } else {
            // Legacy FedCM/One Tap flow (ID token credential)
            googleUser = await verifyGoogleToken(credential);
        }

        if (!googleUser.email) {
            return res.status(400).json({
                success: false,
                error: "Could not retrieve email from Google account"
            });
        }

        // Check if user exists with this email
        let user = await User.findOne({
            email: googleUser.email.toLowerCase(),
            isDeleted: { $ne: true }
        });

        if (user) {
            // Existing user - check if they need to be linked to Google
            if (user.authProvider === 'local') {
                // Link the existing local account to Google
                user.authProvider = 'google';
                user.authProviderId = googleUser.id;
                user.authProviderData = {
                    picture: googleUser.picture,
                    linkedAt: new Date()
                };
                // Set avatar from Google if user doesn't have one
                if (!user.avatar && googleUser.picture) {
                    user.avatar = googleUser.picture;
                }
            } else if (user.authProvider === 'google') {
                // Returning Google user - update picture if changed or missing
                if (googleUser.picture) {
                    user.authProviderData = {
                        ...user.authProviderData,
                        picture: googleUser.picture
                    };
                    // Update avatar if user doesn't have one or if it's still the old Google picture
                    if (!user.avatar) {
                        user.avatar = googleUser.picture;
                    }
                }
            }

            // Update last login
            user.lastLoginAt = new Date();
            user.lastActivityAt = new Date();

            // Mark email as verified (Google already verified it)
            if (!user.emailVerified) {
                user.emailVerified = true;
                user.emailVerifiedAt = new Date();
            }

            // Update avatar from Google if user still doesn't have one
            if (!user.avatar && googleUser.picture) {
                user.avatar = googleUser.picture;
            }

            await user.save();

            if (typeof logAuthEvent === 'function') {
                await logAuthEvent(user._id, 'social_login_google', true, { method: 'google' }, req);
            }
        } else {
            // Create new user with Google auth
            user = new User({
                name: googleUser.name || googleUser.email.split('@')[0],
                email: googleUser.email.toLowerCase(),
                authProvider: 'google',
                authProviderId: googleUser.id,
                authProviderData: {
                    picture: googleUser.picture
                },
                avatar: googleUser.picture || null,
                emailVerified: true,
                emailVerifiedAt: new Date(),
                userType: 'buyer',
                // GDPR compliance - implied consent via social login
                termsAcceptedAt: new Date(),
                termsVersion: "1.0",
                privacyPolicyAcceptedAt: new Date(),
                privacyPolicyVersion: "1.0",
                consentGivenAt: new Date(),
            });

            console.log('New Google user created with avatar:', user.avatar ? 'yes' : 'no');
            await user.save();

            if (typeof logAuthEvent === 'function') {
                await logAuthEvent(user._id, 'social_register_google', true, { method: 'google' }, req);
            }
        }

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user);
        setRefreshTokenCookie(res, refreshToken);

        const userResponse = safeUser(user);
        console.log('Google auth response - user avatar:', userResponse.avatar ? 'present' : 'missing');

        res.json({
            success: true,
            user: userResponse,
            token: accessToken,
        });

    } catch (error) {
        console.error("GOOGLE AUTH ERROR ->", error.message);
        res.status(401).json({
            success: false,
            error: error.message || "Google authentication failed"
        });
    }
});

/* ---------------------- FACEBOOK OAUTH ---------------------- */
/**
 * Verify Facebook access token and return user info
 * Uses Facebook's Graph API
 */
async function verifyFacebookToken(accessToken) {
    try {
        // First, verify the token is valid
        const appId = process.env.FACEBOOK_APP_ID;
        const appSecret = process.env.FACEBOOK_APP_SECRET;

        if (!appId || !appSecret) {
            throw new Error('Facebook OAuth is not configured');
        }

        // Debug token to verify it's valid
        const debugResponse = await fetch(
            `https://graph.facebook.com/debug_token?input_token=${accessToken}&access_token=${appId}|${appSecret}`
        );

        const debugData = await debugResponse.json();

        if (!debugData.data?.is_valid) {
            throw new Error('Invalid Facebook token');
        }

        // Verify the app_id matches
        if (debugData.data.app_id !== appId) {
            throw new Error('Token was not issued for this application');
        }

        // Get user info from Facebook
        const userResponse = await fetch(
            `https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${accessToken}`
        );

        if (!userResponse.ok) {
            throw new Error('Failed to fetch Facebook user info');
        }

        const userData = await userResponse.json();

        return {
            id: userData.id,
            email: userData.email,
            name: userData.name,
            picture: userData.picture?.data?.url,
        };
    } catch (error) {
        console.error('Facebook token verification failed:', error.message);
        throw new Error('Failed to verify Facebook token');
    }
}

router.post("/facebook", async (req, res) => {
    try {
        await connectDB();

        const { accessToken } = req.body;

        if (!accessToken) {
            return res.status(400).json({
                success: false,
                error: "Facebook access token is required"
            });
        }

        // Verify the Facebook token
        const facebookUser = await verifyFacebookToken(accessToken);

        if (!facebookUser.email) {
            return res.status(400).json({
                success: false,
                error: "Could not retrieve email from Facebook account. Please ensure email permission is granted."
            });
        }

        // Check if user exists with this email
        let user = await User.findOne({
            email: facebookUser.email.toLowerCase(),
            isDeleted: { $ne: true }
        });

        if (user) {
            // Existing user - check if they need to be linked to Facebook
            if (user.authProvider === 'local') {
                // Link the existing local account to Facebook
                user.authProvider = 'facebook';
                user.authProviderId = facebookUser.id;
                user.authProviderData = {
                    picture: facebookUser.picture,
                    linkedAt: new Date()
                };
                // Set avatar from Facebook if user doesn't have one
                if (!user.avatar && facebookUser.picture) {
                    user.avatar = facebookUser.picture;
                }
            } else if (user.authProvider === 'facebook') {
                // Returning Facebook user - update picture if changed or missing
                if (facebookUser.picture) {
                    user.authProviderData = {
                        ...user.authProviderData,
                        picture: facebookUser.picture
                    };
                    // Update avatar if user doesn't have one
                    if (!user.avatar) {
                        user.avatar = facebookUser.picture;
                    }
                }
            }

            // Update last login
            user.lastLoginAt = new Date();
            user.lastActivityAt = new Date();

            // Mark email as verified (Facebook verified it)
            if (!user.emailVerified) {
                user.emailVerified = true;
                user.emailVerifiedAt = new Date();
            }

            // Update avatar from Facebook if user still doesn't have one
            if (!user.avatar && facebookUser.picture) {
                user.avatar = facebookUser.picture;
            }

            await user.save();

            if (typeof logAuthEvent === 'function') {
                await logAuthEvent(user._id, 'social_login_facebook', true, { method: 'facebook' }, req);
            }
        } else {
            // Create new user with Facebook auth
            user = new User({
                name: facebookUser.name || facebookUser.email.split('@')[0],
                email: facebookUser.email.toLowerCase(),
                authProvider: 'facebook',
                authProviderId: facebookUser.id,
                authProviderData: {
                    picture: facebookUser.picture
                },
                avatar: facebookUser.picture,
                emailVerified: true,
                emailVerifiedAt: new Date(),
                userType: 'buyer',
                // GDPR compliance - implied consent via social login
                termsAcceptedAt: new Date(),
                termsVersion: "1.0",
                privacyPolicyAcceptedAt: new Date(),
                privacyPolicyVersion: "1.0",
                consentGivenAt: new Date(),
            });

            await user.save();

            if (typeof logAuthEvent === 'function') {
                await logAuthEvent(user._id, 'social_register_facebook', true, { method: 'facebook' }, req);
            }
        }

        // Generate tokens
        const { accessToken: jwtAccessToken, refreshToken } = generateTokens(user);
        setRefreshTokenCookie(res, refreshToken);

        res.json({
            success: true,
            user: safeUser(user),
            token: jwtAccessToken,
        });

    } catch (error) {
        console.error("FACEBOOK AUTH ERROR ->", error.message);
        res.status(401).json({
            success: false,
            error: error.message || "Facebook authentication failed"
        });
    }
});

export default router;
