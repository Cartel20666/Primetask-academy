require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/auth");
const contentRoutes = require("./routes/content");

const app = express();

const PORT = process.env.PORT || 5001;

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*"
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(
  "/uploads",
  express.static(
    path.join(__dirname, "../uploads")
  )
);

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    service: "PrimeTask Academy API",
    status: "online",
    time: new Date().toISOString()
  });
});

app.use("/api/admin/auth", authRoutes);

app.use("/api/content", contentRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Academy API endpoint not found."
  });
});

async function startServer() {

  try {

    await mongoose.connect(
      process.env.MONGODB_URI
    );

    console.log("MongoDB connected");

    app.listen(PORT, () => {

      console.log(
        `PrimeTask Academy API running on port ${PORT}`
      );

    });

  } catch (error) {

    console.error(
      "Database connection failed:",
      error.message
    );

    process.exit(1);

  }

}

startServer();
