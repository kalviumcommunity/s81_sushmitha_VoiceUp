const mongoose = require("mongoose");

const db = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("mongodb connected");
    } catch (e) {
        console.error("Database connection error:", e);
    }
};

module.exports = db;
