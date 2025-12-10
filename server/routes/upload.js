import { Router } from "express";
import { z } from "zod";
const router = Router();
const signSchema = z.object({ filename: z.string(), contentType: z.string() });

router.post("/sign", (async (req, res) => {
    const userId = req.headers["x-user-id"];
    if (!userId)
        return res.status(401).json({ error: "Unauthorized" });
    const data = signSchema.parse(req.body);
    // Mock signed URL (in production, use S3/GCS)
    const mockUrl = `https://storage.example.com/signed?file=${data.filename}&token=mock-token-${Date.now()}`;
    res.json({ signedUrl: mockUrl, publicUrl: mockUrl.replace("?token=mock-token", "") });
}));
/**
 * Direct upload endpoint (fallback, for demo)
 * In production, use S3 presigned URLs instead
 */
router.post("/", (async (req, res) => {
    const userId = req.headers["x-user-id"];
    if (!userId)
        return res.status(401).json({ error: "Unauthorized" });
    // For demo: accept image URLs from request body
    const { url } = req.body;
    if (!url)
        return res.status(400).json({ error: "Missing url" });
    res.json({ url, uploadedAt: new Date() });
}));
export default router;
