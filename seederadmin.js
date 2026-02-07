import mongoose from "mongoose";
import connectDB from "./config/db.js";
import dotenv from "dotenv";

dotenv.config();

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: { type: String, enum: ["admin", "user"], default: "user" },
});

const User = mongoose.model("User", userSchema);

const seedAdmin = async () => {
  try {

    await connectDB();

    const existingAdmin = await User.findOne({ email: "admin@admin.com" });
    if (existingAdmin) {
      console.log("Admin already exists. Skipping seed...");
      process.exit(0);
    }

    await User.create({
      name: "Admin",
      email: "admin@admin.com",
      password: "admin@123", 
      role: "admin",
    });

    console.log("Admin seeded successfully...");
    process.exit(0);
  } catch (err) {
    console.error("Error seeding admin:", err);
    process.exit(1);
  }
};

seedAdmin();
