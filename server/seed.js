require("dotenv").config();
const mongoose  = require("mongoose");
const Community = require("./models/Community");

const COMMUNITIES = [
  {
    name: "Sports",
    description: "A community for sports fans to discuss the latest news, events, and teams. From football to basketball, this community has all the action you need to stay up-to-date on your favorite sports!",
    color: "#3b82f6"
  },
  {
    name: "Business and Entrepreneurship",
    description: "A community for business-minded individuals to discuss the latest news, strategies, and entrepreneurship. From startups to established companies, this community has all the insights you need to succeed in the business world!",
    color: "#06b6d4"
  },
  {
    name: "Fashion",
    description: "A community for fashionistas to share their tips, trends, and styles. From haute couture to streetwear, this community has all the fashion-forward ideas you need to stay on top of your game!",
    color: "#ec4899"
  },
  {
    name: "Education",
    description: "A community for educators and students to share educational resources, tips, and advice. From K-12 to higher education, this community has all the knowledge you need to excel in your studies!",
    color: "#10b981"
  },
  {
    name: "Art and Design",
    description: "A community for artists and designers to share their work, tips, and inspiration. From painting to graphic design, this community has all the creativity you need to fuel your passion!",
    color: "#8b5cf6"
  },
  {
    name: "Programming",
    description: "A community for programmers to discuss programming languages, frameworks, and software development. From web development to mobile apps, this community has all the code you need to build your next project!",
    color: "#f97316"
  },
  {
    name: "Food and Cooking",
    description: "A community for foodies and home cooks to share recipes, cooking tips, and food-related news and events. From gourmet cuisine to comfort food, this community has all the ingredients for a delicious conversation!",
    color: "#f59e0b"
  },
  {
    name: "Travel",
    description: "A community for travel junkies to share their experiences, tips, and recommendations for destinations around the world. From backpacking to luxury travel, this community has all the inspiration you need to plan your next adventure!",
    color: "#14b8a6"
  },
  {
    name: "Health and Fitness",
    description: "A community for fitness fanatics and health gurus to share tips and advice on healthy living, exercise, and nutrition. Whether you're a seasoned athlete or just starting out, this community has something for everyone!",
    color: "#ef4444"
  }
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
