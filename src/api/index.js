const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection (connect only once)
let isConnected = false;

async function connectMongo() {
  if (isConnected) return;
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  isConnected = true;
  console.log("✅ MongoDB Connected");
}

app.get("/", async (req, res) => {
  await connectMongo(); // Connect before handling request
  res.send("🎁 Gift Recommendation API is Live on Vercel!");
});

// Export the app for serverless
module.exports = app;
