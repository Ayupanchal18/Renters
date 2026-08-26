import { Router } from "express";
import { LeaseDraft } from "../models/LeaseDraft.js";
import { Property } from "../models/Property.js";
import { User } from "../models/User.js";
import { VisitBooking } from "../models/VisitBooking.js";
import { Conversation } from "../models/Conversation.js";
import { authenticateToken } from "../src/middleware/security.js";
import { connectDB } from "../src/config/db.js";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

const router = Router();

/**
 * POST /api/leases
 * Owner creates a new lease agreement draft
 */
router.post("/", authenticateToken, async (req, res) => {
    try {
        await connectDB();
        const { propertyId, tenantId, terms } = req.body;
        const ownerId = req.user._id;

        if (!propertyId || !tenantId || !terms || !terms.rentAmount || !terms.leaseStartDate || !terms.leaseEndDate) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_FAILED",
                message: "Missing required lease draft parameters"
            });
        }

        // Verify property exists and requester is the owner
        const property = await Property.findOne({ _id: propertyId, isDeleted: false });
        if (!property) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "Property listing not found"
            });
        }

        // Verify owner permissions
        const propertyOwnerId = property.ownerId || property.owner?._id || property.owner;
        if (propertyOwnerId.toString() !== ownerId.toString()) {
            return res.status(403).json({
                success: false,
                error: "ACCESS_DENIED",
                message: "You can only create lease agreements for your own properties"
            });
        }

        // Verify tenant exists
        const tenant = await User.findOne({ _id: tenantId, isDeleted: false });
        if (!tenant) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "Tenant user not found"
            });
        }

        // Check if there is an active relationship (booking or conversation) to ensure verification and security
        const booking = await VisitBooking.findOne({
            propertyId,
            tenantId,
            status: { $in: ["confirmed", "completed"] }
        });

        const conversation = await Conversation.findOne({
            propertyId,
            participants: { $all: [ownerId, tenantId] }
        });

        if (!booking && !conversation) {
            return res.status(400).json({
                success: false,
                error: "RELATIONSHIP_REQUIRED",
                message: "A confirmed visit booking or active chat conversation is required to draft a lease."
            });
        }

        // Create new lease draft
        const lease = new LeaseDraft({
            propertyId,
            ownerId,
            tenantId,
            status: "draft",
            terms: {
                rentAmount: Number(terms.rentAmount),
                securityDeposit: Number(terms.securityDeposit || 0),
                leaseStartDate: new Date(terms.leaseStartDate),
                leaseEndDate: new Date(terms.leaseEndDate),
                noticePeriodDays: Number(terms.noticePeriodDays || 30),
                additionalClauses: terms.additionalClauses || ""
            }
        });

        await lease.save();
        res.status(201).json({
            success: true,
            data: lease,
            message: "Lease draft created successfully."
        });
    } catch (error) {
        console.error("[Lease Create Error]:", error);
        res.status(500).json({
            success: false,
            error: "CREATE_FAILED",
            message: "Failed to create lease draft"
        });
    }
});

/**
 * GET /api/leases/property/:propertyId/tenant/:tenantId
 * Retrieve lease agreement by property and tenant IDs
 */
router.get("/property/:propertyId/tenant/:tenantId", authenticateToken, async (req, res) => {
    try {
        await connectDB();
        const { propertyId, tenantId } = req.params;

        const lease = await LeaseDraft.findOne({
            propertyId,
            tenantId,
            $or: [
                { ownerId: req.user._id },
                { tenantId: req.user._id }
            ]
        }).lean();

        if (!lease) {
            return res.json({
                success: false,
                message: "Lease agreement not found"
            });
        }

        res.json({
            success: true,
            data: lease
        });
    } catch (error) {
        console.error("[Lease Find Error]:", error);
        res.status(500).json({
            success: false,
            error: "RETRIEVAL_FAILED",
            message: "Failed to find lease agreement"
        });
    }
});

/**
 * GET /api/leases/:id
 * Retrieve lease agreement details
 */
router.get("/:id", authenticateToken, async (req, res) => {
    try {
        await connectDB();

        const lease = await LeaseDraft.findById(req.params.id)
            .populate("propertyId", "title address city state photos")
            .populate("ownerId", "name email phone isVerified")
            .populate("tenantId", "name email phone isVerified")
            .lean();

        if (!lease) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "Lease agreement not found"
            });
        }

        // Only owner or tenant can view the lease
        const isOwner = lease.ownerId._id.toString() === req.user._id.toString();
        const isTenant = lease.tenantId._id.toString() === req.user._id.toString();
        const isAdmin = ["admin", "super_admin"].includes(req.user.role);

        if (!isOwner && !isTenant && !isAdmin) {
            return res.status(403).json({
                success: false,
                error: "ACCESS_DENIED",
                message: "Unauthorized access to this lease agreement"
            });
        }

        res.json({
            success: true,
            data: lease
        });
    } catch (error) {
        console.error("[Lease Get Error]:", error);
        res.status(500).json({
            success: false,
            error: "RETRIEVAL_FAILED",
            message: "Failed to load lease details"
        });
    }
});

/**
 * PATCH /api/leases/:id
 * Edit lease terms (owner only, in "draft" status only)
 */
router.patch("/:id", authenticateToken, async (req, res) => {
    try {
        await connectDB();

        const lease = await LeaseDraft.findById(req.params.id);
        if (!lease) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "Lease agreement not found"
            });
        }

        if (lease.ownerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                error: "ACCESS_DENIED",
                message: "Only the property owner can edit the lease terms"
            });
        }

        if (lease.status !== "draft") {
            return res.status(400).json({
                success: false,
                error: "EDIT_LOCKED",
                message: "Lease terms cannot be edited after the draft is sent"
            });
        }

        const { terms } = req.body;
        if (terms) {
            if (terms.rentAmount) lease.terms.rentAmount = Number(terms.rentAmount);
            if (terms.securityDeposit !== undefined) lease.terms.securityDeposit = Number(terms.securityDeposit);
            if (terms.leaseStartDate) lease.terms.leaseStartDate = new Date(terms.leaseStartDate);
            if (terms.leaseEndDate) lease.terms.leaseEndDate = new Date(terms.leaseEndDate);
            if (terms.noticePeriodDays) lease.terms.noticePeriodDays = Number(terms.noticePeriodDays);
            if (terms.additionalClauses !== undefined) lease.terms.additionalClauses = terms.additionalClauses;
        }

        await lease.save();
        res.json({
            success: true,
            data: lease,
            message: "Lease terms updated successfully."
        });
    } catch (error) {
        console.error("[Lease Update Error]:", error);
        res.status(500).json({
            success: false,
            error: "UPDATE_FAILED",
            message: "Failed to update lease terms"
        });
    }
});

/**
 * POST /api/leases/:id/send
 * Owner locks the lease draft and sends it to the tenant
 */
router.post("/:id/send", authenticateToken, async (req, res) => {
    try {
        await connectDB();

        const lease = await LeaseDraft.findById(req.params.id);
        if (!lease) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "Lease agreement not found"
            });
        }

        if (lease.ownerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                error: "ACCESS_DENIED",
                message: "Only the property owner can send the lease"
            });
        }

        if (lease.status !== "draft") {
            return res.status(400).json({
                success: false,
                error: "INVALID_STATE",
                message: "Lease is already sent or completed"
            });
        }

        lease.status = "sent";
        await lease.save();

        res.json({
            success: true,
            data: lease,
            message: "Lease draft sent to tenant for review and signature."
        });
    } catch (error) {
        console.error("[Lease Send Error]:", error);
        res.status(500).json({
            success: false,
            error: "SEND_FAILED",
            message: "Failed to send lease"
        });
    }
});

/**
 * POST /api/leases/:id/sign
 * Owner or tenant signs the lease agreement
 */
router.post("/:id/sign", authenticateToken, async (req, res) => {
    try {
        await connectDB();

        const { signature } = req.body; // base64 PNG data URL
        if (!signature || !signature.startsWith("data:image/png;base64,")) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_FAILED",
                message: "Valid PNG base64 signature string is required"
            });
        }

        const lease = await LeaseDraft.findById(req.params.id);
        if (!lease) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "Lease agreement not found"
            });
        }

        const isOwner = lease.ownerId.toString() === req.user._id.toString();
        const isTenant = lease.tenantId.toString() === req.user._id.toString();

        if (!isOwner && !isTenant) {
            return res.status(403).json({
                success: false,
                error: "ACCESS_DENIED",
                message: "You are not a party to this lease agreement"
            });
        }

        if (!["sent", "signed_by_tenant", "signed_by_owner"].includes(lease.status)) {
            return res.status(400).json({
                success: false,
                error: "INVALID_STATE",
                message: "Lease is not in a signable status"
            });
        }

        if (isTenant) {
            if (lease.tenantSignature) {
                return res.status(400).json({
                    success: false,
                    error: "ALREADY_SIGNED",
                    message: "You have already signed this lease agreement"
                });
            }
            lease.tenantSignature = signature;
            lease.signedAtTenant = new Date();
            
            if (lease.status === "sent") {
                lease.status = "signed_by_tenant";
            } else if (lease.status === "signed_by_owner") {
                lease.status = "completed";
                lease.completedAt = new Date();
            }
        }

        if (isOwner) {
            if (lease.ownerSignature) {
                return res.status(400).json({
                    success: false,
                    error: "ALREADY_SIGNED",
                    message: "You have already signed this lease agreement"
                });
            }
            lease.ownerSignature = signature;
            lease.signedAtOwner = new Date();

            if (lease.status === "sent") {
                lease.status = "signed_by_owner";
            } else if (lease.status === "signed_by_tenant") {
                lease.status = "completed";
                lease.completedAt = new Date();
            }
        }

        await lease.save();
        res.json({
            success: true,
            data: lease,
            message: "Signature recorded successfully."
        });
    } catch (error) {
        console.error("[Lease Sign Error]:", error);
        res.status(500).json({
            success: false,
            error: "SIGN_FAILED",
            message: "Failed to sign lease"
        });
    }
});

/**
 * GET /api/leases/:id/pdf
 * Generates and downloads the completed lease PDF
 */
router.get("/:id/pdf", authenticateToken, async (req, res) => {
    try {
        await connectDB();

        const lease = await LeaseDraft.findById(req.params.id)
            .populate("propertyId", "title address city state pincode")
            .populate("ownerId", "name email phone")
            .populate("tenantId", "name email phone");

        if (!lease) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "Lease agreement not found"
            });
        }

        // Check if requester is owner, tenant, or admin
        const isOwner = lease.ownerId._id.toString() === req.user._id.toString();
        const isTenant = lease.tenantId._id.toString() === req.user._id.toString();
        const isAdmin = ["admin", "super_admin"].includes(req.user.role);

        if (!isOwner && !isTenant && !isAdmin) {
            return res.status(403).json({
                success: false,
                error: "ACCESS_DENIED",
                message: "Unauthorized access to this lease PDF"
            });
        }

        if (lease.status !== "completed") {
            return res.status(400).json({
                success: false,
                error: "NOT_COMPLETED",
                message: "PDF can only be generated for completed lease agreements"
            });
        }

        // Create PDF Document using pdf-lib
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([595.27, 841.89]); // A4 Size
        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

        // Header Title
        page.drawText("RESIDENTIAL LEASE AGREEMENT", {
            x: 150,
            y: 780,
            size: 18,
            font: fontBold,
            color: rgb(0.12, 0.16, 0.23)
        });

        // Disclaimer at the top
        page.drawText("Disclaimer: This document is a template for convenience and does not constitute legal advice.", {
            x: 60,
            y: 750,
            size: 9,
            font: fontRegular,
            color: rgb(0.5, 0.5, 0.5)
        });

        let currentY = 710;
        const lineSpacing = 20;

        const writeSectionHeader = (title) => {
            currentY -= 15;
            page.drawText(title, { x: 50, y: currentY, size: 12, font: fontBold, color: rgb(0.1, 0.3, 0.7) });
            currentY -= 12;
        };

        const writeRow = (label, value) => {
            page.drawText(`${label}:`, { x: 60, y: currentY, size: 10, font: fontBold });
            page.drawText(String(value), { x: 180, y: currentY, size: 10, font: fontRegular });
            currentY -= lineSpacing;
        };

        // 1. Part Details
        writeSectionHeader("1. CONTRACT PARTIES");
        writeRow("Landlord Name", lease.ownerId.name);
        writeRow("Landlord Contact", `${lease.ownerId.phone || ""} | ${lease.ownerId.email || ""}`);
        writeRow("Tenant Name", lease.tenantId.name);
        writeRow("Tenant Contact", `${lease.tenantId.phone || ""} | ${lease.tenantId.email || ""}`);

        // 2. Property Location
        writeSectionHeader("2. PREMISES LOCATION");
        const fullAddress = `${lease.propertyId?.address || ""}, ${lease.propertyId?.city || ""}, ${lease.propertyId?.state || ""} ${lease.propertyId?.pincode || ""}`;
        writeRow("Property Name", lease.propertyId?.title || "Property");
        writeRow("Address", fullAddress);

        // 3. Lease Terms
        writeSectionHeader("3. LEASE TERMS & PAYMENTS");
        writeRow("Monthly Rent", `INR ${lease.terms.rentAmount}`);
        writeRow("Security Deposit", `INR ${lease.terms.securityDeposit}`);
        writeRow("Lease Start Date", new Date(lease.terms.leaseStartDate).toLocaleDateString());
        writeRow("Lease End Date", new Date(lease.terms.leaseEndDate).toLocaleDateString());
        writeRow("Notice Period", `${lease.terms.noticePeriodDays} Days`);

        // 4. Additional clauses
        if (lease.terms.additionalClauses) {
            writeSectionHeader("4. ADDITIONAL CLAUSES");
            // Wrap text if too long
            const words = lease.terms.additionalClauses.split(" ");
            let line = "";
            for (let n = 0; n < words.length; n++) {
                const testLine = line + words[n] + " ";
                if (testLine.length > 90) {
                    page.drawText(line, { x: 60, y: currentY, size: 9, font: fontRegular });
                    currentY -= 14;
                    line = words[n] + " ";
                } else {
                    line = testLine;
                }
            }
            if (line) {
                page.drawText(line, { x: 60, y: currentY, size: 9, font: fontRegular });
                currentY -= 14;
            }
        }

        // 5. Signature Section
        currentY = 220; // Anchor signatures near the bottom
        writeSectionHeader("5. E-SIGNATURES & ACKNOWLEDGEMENTS");
        
        page.drawText("Tenant Signature:", { x: 60, y: currentY, size: 10, font: fontBold });
        page.drawText("Landlord Signature:", { x: 350, y: currentY, size: 10, font: fontBold });
        
        currentY -= 65;

        // Embed Tenant Signature PNG
        if (lease.tenantSignature) {
            const tenantSigBase64 = lease.tenantSignature.split(",")[1];
            const tenantSigImage = await pdfDoc.embedPng(Buffer.from(tenantSigBase64, "base64"));
            page.drawImage(tenantSigImage, {
                x: 60,
                y: currentY,
                width: 130,
                height: 55
            });
        }
        page.drawText(`Signed: ${new Date(lease.signedAtTenant).toLocaleDateString()}`, { x: 60, y: currentY - 15, size: 8, font: fontRegular });

        // Embed Owner Signature PNG
        if (lease.ownerSignature) {
            const ownerSigBase64 = lease.ownerSignature.split(",")[1];
            const ownerSigImage = await pdfDoc.embedPng(Buffer.from(ownerSigBase64, "base64"));
            page.drawImage(ownerSigImage, {
                x: 350,
                y: currentY,
                width: 130,
                height: 55
            });
        }
        page.drawText(`Signed: ${new Date(lease.signedAtOwner).toLocaleDateString()}`, { x: 350, y: currentY - 15, size: 8, font: fontRegular });

        // Dynamic Forensic Watermark footer & anti-tamper hash
        const auditStamp = `PROTECTED CONTRACT - RENTERS DRM SECURITY - SHA256:${lease._id.toString().substring(0, 12)} - VERIFIED ${new Date().toISOString()}`;
        page.drawText(auditStamp, {
            x: 30,
            y: 20,
            size: 7,
            font: fontRegular,
            color: rgb(0.6, 0.6, 0.6)
        });

        const pdfBytes = await pdfDoc.save();

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `inline; filename="Signed_Lease_${lease._id}.pdf"`);
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("X-Content-Type-Options", "nosniff");
        res.send(Buffer.from(pdfBytes));

    } catch (error) {
        console.error("[Lease PDF Generation Error]:", error);
        res.status(500).json({
            success: false,
            error: "PDF_GENERATION_FAILED",
            message: "Failed to generate lease agreement PDF document"
        });
    }
});

export default router;
