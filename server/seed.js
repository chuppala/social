require("dotenv").config();
const mongoose  = require("mongoose");
const Community = require("./models/Community");

const COMMUNITIES = [
  { name:"Technology",  description:"Discuss tech, programming, gadgets, and software.",        color:"#3b82f6" },
  { name:"Design",      description:"UI/UX design, graphic design, typography and more.",        color:"#8b5cf6" },
  { name:"Science",     description:"Discoveries, research papers, and scientific discussion.",   color:"#10b981" },
  { name:"Gaming",      description:"Video games, indie dev, reviews, and gaming culture.",       color:"#f59e0b" },
  { name:"Photography", description:"Share and discuss photography tips and your best shots.",    color:"#ef4444" },
  { name:"Startups",    description:"Entrepreneurship, funding, product launches, and growth.",   color:"#06b6d4" },
  { name:"Music",       description:"Genres, artists, instruments, production, and concerts.",    color:"#ec4899" },
  { name:"Career",      description:"Job hunting, interviews, salaries, and professional growth.", color:"#f97316" },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");
  for (const c of COMMUNITIES) {
    const exists = await Community.findOne({ name:c.name });
    if (!exists) { await Community.create({ ...c, members:[], rules:[] }); console.log("Created:", c.name); }
    else           console.log("Skipped:", c.name);
  }
  await mongoose.disconnect();
  console.log("Seeding done! Refresh http://localhost:3000");
}
seed().catch(e=>{ console.error(e); process.exit(1); });
