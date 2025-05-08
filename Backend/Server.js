const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const db = require("./db/middleware/db");
const advocacy = require("./routes/advocacy");
const auth = require("./routes/auth");
const authenticateToken = require("./db/middleware/authmiddleware");

const app = express();
const port = process.env.PORT || 2473;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
db().then(() => {
  // Start server only after successful DB connection
  app.listen(port, (err) => {
    if (err) {
      console.error(` Failed to start server: ${err.message}`);
      
    }
    console.log(`🎤 VoiceUp Server is up and running on http://localhost:${port}`);
  });
}).catch((err) => {
  console.error(` Database connection failed: ${err.message}`);
  
});

// Routes
app.use("/auth", auth);
app.use("/advocacy", authenticateToken, advocacy);

app.get("/", (req, res) => {
  res.send("🚀 VoiceUp API is live! Amplifying voices for change.");
});