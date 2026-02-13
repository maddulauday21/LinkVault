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
    },
    oneTimeView: {
        type: Boolean,
        default: false
    },
    isConsumed: {
        type: Boolean,
        default: false
    },
    password: {
        type: String,
        default: null
    },
    maxViews: {
        type: Number,
        default: null
    },
    viewCount: {
        type: Number,
        default: 0
    },

    downloadCount: {
        type: Number,
        default: 0
    },

    maxViews: {
        type: Number,
        default: null
    },

    maxDownloads: {
        type: Number,
        default: null
    }



});

module.exports = mongoose.model("Content", ContentSchema);
