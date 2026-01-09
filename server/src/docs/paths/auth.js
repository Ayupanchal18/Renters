/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     description: |
 *       Creates a new user account with the provided information.
 *       Requires acceptance of Terms of Service and Privacy Policy for GDPR compliance.
 *       Returns JWT access token and sets refresh token as httpOnly cookie.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - acceptTerms
 *               - acceptPrivacyPolicy
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 description: User's full name
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address (will be normalized to lowercase)
 *                 example: john.doe@example.com
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: |
 *                   Password must contain:
 *                   - At least 8 characters
 *                   - At least one lowercase letter
 *                   - At least one uppercase letter
 *                   - At least one number
 *                 example: SecurePass123
 *               phone:
 *                 type: string
 *                 description: User's phone number (optional)
 *                 example: "+1234567890"
 *               address:
 *                 type: string
 *                 maxLength: 500
 *                 description: User's address (optional)
 *               userType:
 *                 type: string
 *                 enum: [buyer, seller, agent]
 *                 description: Type of user account
 *                 example: buyer
 *               acceptTerms:
 *                 type: boolean
 *                 description: Must be true to accept Terms of Service
 *                 example: true
 *               acceptPrivacyPolicy:
 *                 type: boolean
 *                 description: Must be true to accept Privacy Policy
 *                 example: true
 *     responses:
 *       201:
 *         description: User registered successfully
 *         headers:
 *           Set-Cookie:
 *             description: httpOnly refresh token cookie
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *                   description: JWT access token (15 minute expiry)
 *             example:
 *               success: true
 *               user:
 *                 id: "507f1f77bcf86cd799439011"
 *                 name: "John Doe"
 *                 email: "john.doe@example.com"
 *                 userType: "buyer"
 *                 role: "user"
 *                 emailVerified: false
 *                 phoneVerified: false
 *                 createdAt: "2026-01-09T10:30:00.000Z"
 *               token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         description: Email already registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "Email already registered"
 *       503:
 *         description: Database connection failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login to existing account
 *     description: |
 *       Authenticates a user with email/phone and password.
 *       Returns JWT access token and sets refresh token as httpOnly cookie.
 *       
 *       **Rate Limited**: 10 attempts per 15 minutes per identifier.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address (provide email OR phone)
 *                 example: john.doe@example.com
 *               phone:
 *                 type: string
 *                 description: User's phone number (provide email OR phone)
 *                 example: "+1234567890"
 *               password:
 *                 type: string
 *                 description: User's password
 *                 example: SecurePass123
 *     responses:
 *       200:
 *         description: Login successful
 *         headers:
 *           Set-Cookie:
 *             description: httpOnly refresh token cookie
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *                   description: JWT access token (15 minute expiry)
 *                 mustChangePassword:
 *                   type: boolean
 *                   description: Whether user must change password
 *             example:
 *               success: true
 *               user:
 *                 id: "507f1f77bcf86cd799439011"
 *                 name: "John Doe"
 *                 email: "john.doe@example.com"
 *                 userType: "buyer"
 *                 role: "user"
 *               token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *               mustChangePassword: false
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "Invalid credentials"
 *       403:
 *         description: Account suspended or inactive
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "Account suspended"
 *               message: "Your account has been suspended. Please contact support."
 *       429:
 *         description: Too many login attempts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Too many login attempts"
 *                 message:
 *                   type: string
 *                   example: "Please try again in 300 seconds"
 *                 retryAfter:
 *                   type: integer
 *                   description: Seconds until retry is allowed
 *                   example: 300
 */

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     description: |
 *       Exchanges a valid refresh token for a new access token.
 *       Refresh token can be provided via httpOnly cookie or request body.
 *     tags: [Authentication]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh token (optional if sent via cookie)
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         headers:
 *           Set-Cookie:
 *             description: New httpOnly refresh token cookie
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                   description: New JWT access token
 *       401:
 *         description: Invalid or expired refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missing:
 *                 summary: Missing token
 *                 value:
 *                   success: false
 *                   error: "Refresh token required"
 *               expired:
 *                 summary: Expired token
 *                 value:
 *                   success: false
 *                   error: "Refresh token expired"
 *                   message: "Please login again"
 *               invalid:
 *                 summary: Invalid token
 *                 value:
 *                   success: false
 *                   error: "Invalid refresh token"
 */

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user
 *     description: |
 *       Logs out the current user by clearing the refresh token cookie.
 *       The access token should be discarded by the client.
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Logout successful
 *         headers:
 *           Set-Cookie:
 *             description: Cleared refresh token cookie
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Logged out successfully"
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */


/**
 * @swagger
 * /auth/google:
 *   post:
 *     summary: Login/Register with Google
 *     description: |
 *       Authenticates a user using Google OAuth.
 *       Creates a new account if the user doesn't exist.
 *       Returns JWT access token and sets refresh token as httpOnly cookie.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - credential
 *             properties:
 *               credential:
 *                 type: string
 *                 description: Google ID token from Google Sign-In
 *     responses:
 *       200:
 *         description: Authentication successful
 *         headers:
 *           Set-Cookie:
 *             description: httpOnly refresh token cookie
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *                   description: JWT access token
 *                 isNewUser:
 *                   type: boolean
 *                   description: Whether this is a newly created account
 *       400:
 *         description: Invalid Google token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Account suspended
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /auth/facebook:
 *   post:
 *     summary: Login/Register with Facebook
 *     description: |
 *       Authenticates a user using Facebook OAuth.
 *       Creates a new account if the user doesn't exist.
 *       Returns JWT access token and sets refresh token as httpOnly cookie.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accessToken
 *               - userID
 *             properties:
 *               accessToken:
 *                 type: string
 *                 description: Facebook access token
 *               userID:
 *                 type: string
 *                 description: Facebook user ID
 *     responses:
 *       200:
 *         description: Authentication successful
 *         headers:
 *           Set-Cookie:
 *             description: httpOnly refresh token cookie
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *                   description: JWT access token
 *                 isNewUser:
 *                   type: boolean
 *                   description: Whether this is a newly created account
 *       400:
 *         description: Invalid Facebook token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Account suspended
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
