
const mongoose = require("mongoose");
const dns = require("dns");

// Use Google and Cloudflare DNS
dns.setServers(["8.8.8.8", "1.1.1.1"]);

// ==========================================
// CONNECT DATABASE
// ==========================================

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error(
        "MONGO_URI is missing from environment variables."
      );
    }

    // Disable automatic index creation.
    // Existing database indexes are not dropped or recreated here.
    mongoose.set("autoIndex", false);

    const conn = await mongoose.connect(
      process.env.MONGO_URI,
      {
        autoIndex: false,
      }
    );

    console.log(
      `MongoDB connected: ${conn.connection.host}`
    );

    console.log(
      "Automatic index creation is disabled."
    );
  } catch (error) {
    console.error(
      "MongoDB connection failed:",
      error.message
    );

    process.exit(1);
  }
};

module.exports = connectDB;

