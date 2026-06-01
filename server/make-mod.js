require("dotenv").config();
const mongoose = require("mongoose");

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  // Show all communities
  const comms = await db.collection("communities").find({}, { projection: { name: 1 } }).toArray();
  console.log("Communities in your database:");
  comms.forEach((c, i) => console.log(`  ${i+1}. ${c.name}`));

  // Get user
  const user = await db.collection("users").findOne({ email: "mohanapriyachuppala@gmail.com" });
  if (!user) { console.log("User not found!"); await mongoose.disconnect(); return; }
  console.log("\nUser found:", user.email);

  // Make role moderator
  await db.collection("users").updateOne(
    { email: "mohanapriyachuppala@gmail.com" },
    { $set: { role: "moderator" } }
  );
  console.log("Role set to moderator");

  // Assign to FIRST community
  const firstComm = comms[0];
  await db.collection("communities").updateOne(
    { _id: firstComm._id },
    { $addToSet: { moderators: user._id } }
  );
  console.log("Assigned as moderator of c/" + firstComm.name);

  // Also assign to second community if exists
  if (comms[1]) {
    await db.collection("communities").updateOne(
      { _id: comms[1]._id },
      { $addToSet: { moderators: user._id } }
    );
    console.log("Assigned as moderator of c/" + comms[1].name);
  }

  console.log("\nDone! Sign in with mohanapriyachuppala@gmail.com to see Mod panel");
  await mongoose.disconnect();
}

run().catch(console.error);