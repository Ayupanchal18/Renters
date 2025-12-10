import { Router } from "express";
import { Property } from "../models/Property.js";
const router = Router();
// Typeahead / Suggestions
router.get("/suggest", (async (req, res) => {
    const q = String(req.query.q || "");
    const city = String(req.query.city || "");
    if (!q && !city)
        return res.json([]);
    const query = { status: "active" };
    if (q)
        query.$or = [{ title: { $regex: q, $options: "i" } }, { description: { $regex: q, $options: "i" } }];
    if (city)
        query["address.city"] = new RegExp(city, "i");
    const results = await Property.find(query)
        .select("title address.city price type")
        .limit(10)
        .lean();
    res.json(results);
}));
export default router;
