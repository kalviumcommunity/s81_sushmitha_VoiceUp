const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
const socketIo = require("socket.io");
require("dotenv").config();

const db = require("./db/middleware/db");
const campaigns = require("./routes/advocacy");
const petitions = require("./routes/petition");
const events = require("./routes/event");
const auth = require("./routes/auth");
const authenticateToken = require("./db/middleware/authmiddleware");
const { apiLimiter } = require("./db/middleware/rateLimitMiddleware");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const port = process.env.PORT || 2473;

// Middleware
app.use(cors());
app.use(express.json());

// Apply rate limiting to all routes
app.use(apiLimiter);

// Make io available to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Join campaign rooms for real-time updates
  socket.on('join-campaign', (campaignId) => {
    socket.join(`campaign-${campaignId}`);
    console.log(`User ${socket.id} joined campaign ${campaignId}`);
  });
  
  // Join petition rooms for real-time signature updates
  socket.on('join-petition', (petitionId) => {
    socket.join(`petition-${petitionId}`);
    console.log(`User ${socket.id} joined petition ${petitionId}`);
  });
  
  // Join event rooms for real-time updates
  socket.on('join-event', (eventId) => {
    socket.join(`event-${eventId}`);
    console.log(`User ${socket.id} joined event ${eventId}`);
  });
  
  // Handle user authentication for personalized updates
  socket.on('authenticate', (token) => {
    // TODO: Verify JWT token and associate socket with user
    console.log('User authenticated:', socket.id);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Database Connection
db().then(() => {
  // Start server only after successful DB connection
  server.listen(port, (err) => {
    if (err) {
      console.error(`❌ Failed to start server: ${err.message}`);
      process.exit(1);
    }
    console.log(`🎤 VoiceUp Server is up and running on http://localhost:${port}`);
    console.log(`🔌 WebSocket server ready for real-time connections`);
  });
}).catch((err) => {
  console.error(`❌ Database connection failed: ${err.message}`);
  process.exit(1);
});

// Routes
app.use("/auth", auth);
// app.use("/campaigns", campaigns); // Temporarily disabled
app.use("/petitions", petitions);
app.use("/events", events);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: "2.0.0"
  });
});

app.get("/", (req, res) => {
  res.json({
    message: "🚀 VoiceUp API v2.0 is live! Amplifying voices for change.",
    features: [
      "Enhanced Authentication with JWT refresh tokens",
      "Campaign Management with collaboration",
      "Petition System with real-time signature tracking",
      "Event Management with capacity and waitlists",
      "Real-time WebSocket updates",
      "Gamification and impact scoring",
      "Role-based access control"
    ],
    endpoints: {
      auth: "/auth",
      campaigns: "/campaigns",
      petitions: "/petitions",
      events: "/events",
      health: "/health"
    }
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: error.message })
  });
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

module.exports = { app, server, io };