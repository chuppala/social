require("dotenv").config();
const mongoose = require("mongoose");

async function fix() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");
  const db = mongoose.connection.db;

  // Fix all users - change role from "general" to "user" and verify emails
  const result = await db.collection("users").updateMany(
    { role: "general" },
    { $set: { role: "user", isEmailVerified: true } }
  );
  console.log("Fixed", result.modifiedCount, "users (general -> user)");

  // Make mohanasekhar0875@gmail.com an admin
  const r2 = await db.collection("users").updateOne(
    { email: "mohanasekhar0875@gmail.com" },
    { $set: { role: "admin", isEmailVerified: true,
              firstName: "Chuppala", lastName: "Mohanapriya", username: "mohana" } }
  );
  console.log("Made mohanasekhar0875@gmail.com admin:", r2.modifiedCount, "updated");

  // Also fix mohanapriyachuppala@gmail.com (already verified)
  const r3 = await db.collection("users").updateOne(
    { email: "mohanapriyachuppala@gmail.com" },
    { $set: { role: "user", isEmailVerified: true } }
  );
  console.log("Fixed mohanapriyachuppala:", r3.modifiedCount, "updated");

  // Show final state
  const users = await db.collection("users").find({}, 
    { projection: { email: 1, role: 1, isEmailVerified: 1, firstName: 1 } }
  ).toArray();
  console.log("\nFinal state:");
  users.forEach(u => console.log(` ${u.email} | role: ${u.role} | verified: ${u.isEmailVerified}`));

  await mongoose.disconnect();
  console.log("\nDone! Now sign in with mohanasekhar0875@gmail.com / Priya@123");
}

fix().catch(console.error);