import "dotenv/config";
import mongoose from "mongoose";
import { Property } from "../models/Property.js";
import { connectDB } from "../src/config/db.js";

const checkProperties = async () => {
    try {
        await connectDB();
        
        console.log("--- Property Count Summary ---");
        
        const total = await Property.countDocuments();
        console.log(`Total Properties: ${total}`);
        
        const byListingType = await Property.aggregate([
            { $group: { _id: "$listingType", count: { $sum: 1 } } }
        ]);
        console.log("By Listing Type:", byListingType);
        
        const byStatus = await Property.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);
        console.log("By Status:", byStatus);

        const isDeletedCount = await Property.countDocuments({ isDeleted: true });
        console.log("Is Deleted:", isDeletedCount);

        const activeBuy = await Property.countDocuments({ 
            listingType: "buy", 
            status: "active", 
            isDeleted: { $ne: true } 
        });
        console.log("Active Buy Properties:", activeBuy);

        process.exit(0);
    } catch (error) {
        console.error("Error checking properties:", error);
        process.exit(1);
    }
};

checkProperties();
