const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const Content = require("../models/Content");
const requireAdmin = require("../middleware/auth");

const router = express.Router();

const uploadDirectory = path.join(__dirname, "../../uploads");

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, {
    recursive: true
  });
}


/*
|--------------------------------------------------------------------------
| MULTER STORAGE
|--------------------------------------------------------------------------
*/
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDirectory);
  },

  filename: function (req, file, cb) {
    const extension = path.extname(file.originalname);

    const safeName = path
      .basename(file.originalname, extension)
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .toLowerCase();

    const uniqueName =
      `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeName}${extension}`;

    cb(null, uniqueName);
  }
});


const upload = multer({
  storage,

  limits: {
    fileSize: 100 * 1024 * 1024
  },

  fileFilter: function (req, file, cb) {

    const allowedTypes = [
      ".pdf",
      ".doc",
      ".docx",
      ".ppt",
      ".pptx",
      ".xls",
      ".xlsx",
      ".jpg",
      ".jpeg",
      ".png",
      ".webp",
      ".mp4",
      ".webm",
      ".mov"
    ];

    const extension = path
      .extname(file.originalname)
      .toLowerCase();

    if (!allowedTypes.includes(extension)) {
      return cb(
        new Error("This file type is not allowed.")
      );
    }

    cb(null, true);
  }
});


/*
|--------------------------------------------------------------------------
| PUBLIC: GET PUBLISHED CONTENT
|--------------------------------------------------------------------------
*/
router.get("/published", async (req, res) => {
  try {

    const filter = {
      status: "Published"
    };

    if (req.query.type) {
      filter.type = req.query.type;
    }

    if (req.query.category) {
      filter.category = req.query.category;
    }

    const content = await Content.find(filter)
      .sort({
        featured: -1,
        createdAt: -1
      })
      .select("-createdBy");

    res.json({
      success: true,
      count: content.length,
      content
    });

  } catch (error) {

    console.error("Published content error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to load Academy content."
    });
  }
});


/*
|--------------------------------------------------------------------------
| ADMIN: GET ALL CONTENT
|--------------------------------------------------------------------------
*/
router.get("/", requireAdmin, async (req, res) => {
  try {

    const content = await Content.find()
      .sort({
        createdAt: -1
      })
      .populate("createdBy", "name email");

    res.json({
      success: true,
      count: content.length,
      content
    });

  } catch (error) {

    console.error("Admin content error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to load content."
    });
  }
});


/*
|--------------------------------------------------------------------------
| ADMIN: CREATE CONTENT
|--------------------------------------------------------------------------
*/
router.post("/", requireAdmin, async (req, res) => {
  try {

    const {
      title,
      description,
      type,
      category,
      fileUrl,
      thumbnailUrl,
      content,
      status,
      featured
    } = req.body;

    if (!title || !type || !category) {
      return res.status(400).json({
        success: false,
        message: "Title, type and category are required."
      });
    }

    const newContent = await Content.create({
      title,
      description,
      type,
      category,
      fileUrl,
      thumbnailUrl,
      content,
      status: status || "Draft",
      featured: featured === true,
      createdBy: req.admin.adminId
    });

    res.status(201).json({
      success: true,
      message: "Content created successfully.",
      content: newContent
    });

  } catch (error) {

    console.error("Create content error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to create content."
    });
  }
});


/*
|--------------------------------------------------------------------------
| ADMIN: UPDATE CONTENT
|--------------------------------------------------------------------------
*/
router.put("/:id", requireAdmin, async (req, res) => {
  try {

    const updated = await Content.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Content not found."
      });
    }

    res.json({
      success: true,
      message: "Content updated successfully.",
      content: updated
    });

  } catch (error) {

    console.error("Update content error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to update content."
    });
  }
});


/*
|--------------------------------------------------------------------------
| ADMIN: DELETE CONTENT
|--------------------------------------------------------------------------
*/
router.delete("/:id", requireAdmin, async (req, res) => {
  try {

    const content = await Content.findById(
      req.params.id
    );

    if (!content) {
      return res.status(404).json({
        success: false,
        message: "Content not found."
      });
    }

    await content.deleteOne();

    res.json({
      success: true,
      message: "Content deleted successfully."
    });

  } catch (error) {

    console.error("Delete content error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to delete content."
    });
  }
});


/*
|--------------------------------------------------------------------------
| ADMIN: PUBLISH / UNPUBLISH
|--------------------------------------------------------------------------
*/
router.patch("/:id/status", requireAdmin, async (req, res) => {
  try {

    const { status } = req.body;

    if (!["Draft", "Published"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be Draft or Published."
      });
    }

    const content = await Content.findByIdAndUpdate(
      req.params.id,
      {
        status
      },
      {
        new: true
      }
    );

    if (!content) {
      return res.status(404).json({
        success: false,
        message: "Content not found."
      });
    }

    res.json({
      success: true,
      message: `Content ${status.toLowerCase()} successfully.`,
      content
    });

  } catch (error) {

    console.error("Status update error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to update content status."
    });
  }
});


/*
|--------------------------------------------------------------------------
| ADMIN: UPLOAD FILE
|--------------------------------------------------------------------------
*/
router.post(
  "/upload",
  requireAdmin,
  upload.single("file"),
  async (req, res) => {

    try {

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file was uploaded."
        });
      }

      const fileUrl =
        `/uploads/${req.file.filename}`;

      res.status(201).json({
        success: true,
        message: "File uploaded successfully.",
        file: {
          originalName: req.file.originalname,
          filename: req.file.filename,
          mimetype: req.file.mimetype,
          size: req.file.size,
          url: fileUrl
        }
      });

    } catch (error) {

      console.error("Upload error:", error);

      res.status(500).json({
        success: false,
        message: "Unable to upload file."
      });
    }
  }
);


/*
|--------------------------------------------------------------------------
| MULTER ERROR HANDLER
|--------------------------------------------------------------------------
*/
router.use((error, req, res, next) => {

  if (error instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: `Upload error: ${error.message}`
    });
  }

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  next();
});


module.exports = router;
