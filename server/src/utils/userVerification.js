import { VaultDocument } from "../../models/VaultDocument.js";
import { User } from "../../models/User.js";

/**
 * Recalculate and update the verification status (isVerified field) for a user
 * @param {string} userId - The user ID
 * @returns {Promise<boolean>} - Resolves to the new isVerified state
 */
export async function updateUserVerificationStatus(userId) {
    try {
        // Query all verified vault documents for the user
        const verifiedDocs = await VaultDocument.find({
            userId,
            status: "verified"
        }).lean();

        const types = verifiedDocs.map(doc => doc.type);

        // Required: id_proof
        const hasIdProof = types.includes("id_proof");
        
        // Required: either address_proof or income_proof
        const hasAddressOrIncome = types.includes("address_proof") || types.includes("income_proof");

        const isVerified = hasIdProof && hasAddressOrIncome;

        // Save status in User document
        await User.findByIdAndUpdate(userId, { isVerified });

        return isVerified;
    } catch (err) {
        console.error(`[Verification] Error recalculating verification for user ${userId}:`, err);
        return false;
    }
}
