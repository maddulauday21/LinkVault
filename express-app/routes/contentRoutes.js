const express = require("express");
const multer = require("multer");
const { uploadContent, getContent } = require("../controllers/contentController");

const router = express.Router();

// Storage config
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({ storage });
const { downloadFile } = require("../controllers/contentController");

router.get("/download/:id", downloadFile);


// IMPORTANT: multer handles multipart form-data
router.post("/upload", upload.single("file"), uploadContent);

router.get("/:id", getContent);

module.exports = router;
