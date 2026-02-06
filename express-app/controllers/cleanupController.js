const Content = require("../models/Content");
const fs = require("fs");

const cleanupExpired = async () => {
    try {

        const expiredItems = await Content.find({
            expiryTime: { $lt: new Date() }
        });

        for (const item of expiredItems) {

            if (item.filePath && fs.existsSync(item.filePath)) {
                fs.unlinkSync(item.filePath);
            }
        }

        console.log("Expired content cleanup done");

    } catch (error) {
        console.error("Cleanup error:", error.message);
    }
};

module.exports = cleanupExpired;
