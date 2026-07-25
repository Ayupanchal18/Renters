import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../server/src/config/db.js";
import { Property } from "../server/models/Property.js";
import { User } from "../server/models/User.js";

async function query() {
  await connectDB();
  console.log("=== Querying database for admin ===");

  // Find admin user
  const adminUser = await User.findOne({ email: "admin@renters.com" }).lean();
  if (adminUser) {
    console.log(`\nFound Admin User:`);
    console.log(`- _id: ${adminUser._id}`);
    console.log(`- Email: ${adminUser.email}`);
    console.log(`- Name: ${adminUser.name}`);
    console.log(`- Role: ${adminUser.role}`);

    // Find properties owned by this adminUser
    const properties = await Property.find({ ownerId: adminUser._id, isDeleted: false }).lean();
    console.log(`\nProperties owned by Admin in DB (${properties.length}):`);
    for (const prop of properties) {
      console.log(`- ID: ${prop._id}`);
      console.log(`  Title: ${prop.title}`);
      console.log(`  OwnerID: ${prop.ownerId}`);
      console.log(`  OwnerName: ${prop.ownerName}`);
      console.log(`  OwnerEmail: ${prop.ownerEmail}`);
      console.log(`  Status: ${prop.status}`);
      console.log(`  isDeleted: ${prop.isDeleted}`);
    }
  } else {
    console.log("Admin user admin@renters.com not found!");
  }

  await mongoose.disconnect();
}

query().catch(console.error);


