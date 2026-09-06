const mongoose = require("mongoose");

const contentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      default: ""
    },

    type: {
      type: String,
      enum: [
        "Module",
        "Resource",
        "Video",
        "Image",
        "Document"
      ],
      required: true
    },

    category: {
      type: String,
      enum: [
        "Academic",
        "Referencing",
        "Transcription",
        "Research",
        "Professional"
      ],
      required: true
    },

    fileUrl: {
      type: String,
      default: ""
    },

    thumbnailUrl: {
      type: String,
      default: ""
    },

    content: {
      type: String,
      default: ""
    },

    status: {
      type: String,
      enum: ["Draft", "Published"],
      default: "Draft"
    },

    featured: {
      type: Boolean,
      default: false
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Content", contentSchema);
