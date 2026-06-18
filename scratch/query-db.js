import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../server/src/config/db.js";
import { Property } from "../server/models/Property.js";
import { User } from "../server/models/User.js";
import { Conversation } from "../server/models/Conversation.js";

async function query() {
  await connectDB();
  console.log("=== Querying database ===");

  // 1. Find properties
  const properties = await Property.find({ title: /Premium PG/i });
  console.log(`\nFound ${properties.length} properties matching "Premium PG":`);
  for (const prop of properties) {
    console.log(`- Property ID: ${prop._id}`);
    console.log(`  Title: ${prop.title}`);
    console.log(`  Owner ID (on property): ${prop.ownerId}`);
    console.log(`  Owner Name (on property): ${prop.ownerName}`);
    console.log(`  Owner Phone (on property): ${prop.ownerPhone}`);

    // Check if owner user exists
    const ownerUser = await User.findById(prop.ownerId);
    if (ownerUser) {
      console.log(`  Real Owner in DB: ID=${ownerUser._id}, Name=${ownerUser.name}, Email=${ownerUser.email}`);
    } else {
      console.log(`  ⚠️ Real Owner NOT FOUND in User collection for ID: ${prop.ownerId}`);
    }

    // Find conversations for this property
    const conversations = await Conversation.find({ property: prop._id });
    console.log(`  Conversations count: ${conversations.length}`);
    for (const conv of conversations) {
      console.log(`  * Conversation ID: ${conv._id}`);
      console.log(`    Participants:`);
      for (const p of conv.participants) {
        const pUser = await User.findById(p);
        console.log(`      - ID=${pUser?._id || p}, Name=${pUser?.name || 'Unknown'}, Email=${pUser?.email || 'Unknown'}`);
      }
    }
  }

  // 2. Find Jane Buyer
  const jane = await User.findOne({ name: /Jane Buyer/i });
  if (jane) {
    console.log(`\nJane Buyer User Profile:`);
    console.log(`- ID: ${jane._id}`);
    console.log(`- Email: ${jane.email}`);
    console.log(`- UserType: ${jane.userType}`);
  } else {
    console.log(`\nJane Buyer user not found by name.`);
  }

  await mongoose.disconnect();
}

query().catch(console.error);
