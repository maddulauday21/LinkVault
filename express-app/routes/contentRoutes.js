const express = require("express");
const multer = require("multer");
const path = require("path");

const {
  uploadContent,
  getContent,
  verifyPassword,
  downloadFile
} = require("../controllers/contentController");

const router = express.Router();

/* ===============================
   MULTER CONFIGURATION
================================= */

// Storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

// Allowed extensions
const allowedExtensions = [
  ".pdf",
  ".jpg",
  ".jpeg",
  ".png",
  ".docx"
];

// File filter
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Allowed: PDF, JPG, JPEG, PNG, DOCX"));
  }
};

// Multer setup with limits
const upload = multer({
  storage,
  limits: {
    fileSize: 15 *  1024 * 1024 // 15MB
  },
  fileFilter
});

/* ===============================
   ROUTES
================================= */

// Download route
router.get("/download/:id", downloadFile);

// Password verification
router.post(
  "/verify/:id",
  express.urlencoded({ extended: true }),
  verifyPassword
);

// Upload route with proper error handling
router.post("/upload", (req, res, next) => {
  upload.single("file")(req, res, function (err) {

    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          message: "File size exceeds 15MB limit."
        });
      }
    }

    if (err) {
      return res.status(400).json({
        message: err.message
      });
    }

    next();
  });
}, uploadContent);

// Get content
router.get("/:id", getContent);

module.exports = router;
