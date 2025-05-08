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

app.use(cors());
app.use(express.json());

db(); 

// ROUTES
app.use("/auth", auth); 
app.use("/api/advocacy", authenticateToken, advocacy); // 

app.get("/", (req, res) => {
  res.send("🚀 VoiceUp API is live! Amplifying voices for change.");
});

app.listen(port, () => {
  console.log(`🎤 VoiceUp Server is up and running on http://localhost:${port}`);
});
