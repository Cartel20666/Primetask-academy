require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const Admin = require("./models/Admin");

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected.");

    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
      throw new Error(
        "ADMIN_EMAIL or ADMIN_PASSWORD is missing from .env"
      );
    }

    const existingAdmin = await Admin.findOne({
      email: email.toLowerCase().trim()
    });

    if (existingAdmin) {
      console.log("Admin already exists:");
      console.log(existingAdmin.email);

      await mongoose.disconnect();
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const admin = await Admin.create({
      name: "PrimeTask Academy Administrator",
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: "superadmin",
      active: true
    });

    console.log("");
    console.log("======================================");
    console.log(" PRIME TASK ACADEMY ADMIN CREATED");
    console.log("======================================");
    console.log(`Email: ${admin.email}`);
    console.log(`Role: ${admin.role}`);
    console.log("Password: stored securely as a hash");
    console.log("======================================");
    console.log("");

    await mongoose.disconnect();

  } catch (error) {

    console.error("Admin creation failed:");
    console.error(error.message);

    process.exit(1);
  }
}

createAdmin();
