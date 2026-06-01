require("dotenv").config();
const mongoose = require("mongoose");

async function fix() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  // Find all users missing firstName/lastName/username
  const users = await db.collection("users").find({}).toArray();
  console.log("Fixing", users.length, "users...");

  for (const u of users) {
    const updates = {};
    
    // Fix missing firstName
    if (!u.firstName) {
      const name = u.name || u.email.split("@")[0];
      updates.firstName = name.split(" ")[0] || "User";
    }
    
    // Fix missing lastName  
    if (!u.lastName) {
      const name = u.name || "";
      updates.lastName = name.split(" ")[1] || "Echo";
    }
    
    // Fix missing username
    if (!u.username) {
      updates.username = u.email.split("@")[0].replace(/[^a-z0-9]/gi, "").toLowerCase() || "user" + Date.now();
    }

    // Fix role
    if (u.role === "general") updates.role = "user";

    if (Object.keys(updates).length > 0) {
      await db.collection("users").updateOne({ _id: u._id }, { $set: updates });
      console.log("Fixed:", u.email, "→", updates);
    }
  }

  console.log("\nAll users fixed! Now sign in normally.");
  await mongoose.disconnect();
}

fix().catch(console.error);