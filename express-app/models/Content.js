const mongoose = require("mongoose");

const ContentSchema = new mongoose.Schema({
    uniqueId: {
        type: String,
        required: true,
        unique: true
    },
    type: {
        type: String,
        enum: ["text", "file"],
        required: true
    },
    textData: String,
    filePath: String,
    originalFileName: String,
    expiryTime: {
        type: Date,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Content", ContentSchema);
