const Content = require("../models/Content");
const { v4: uuidv4 } = require("uuid");

exports.uploadContent = async (req, res) => {
    try {

        const { text, expiry } = req.body;

        if (!text && !req.file) {
            return res.status(400).json({ message: "Upload text or file" });
        }

        const uniqueId = uuidv4();

        const expiryTime = expiry
            ? new Date(expiry)
            : new Date(Date.now() + 1 * 60 * 1000); // default 10 min

        const newContent = new Content({
            uniqueId,
            type: text ? "text" : "file",
            textData: text || null,
            filePath: req.file ? req.file.path : null,
            originalFileName: req.file ? req.file.originalname : null,
            expiryTime
        });

        await newContent.save();

        res.json({
            link: `${process.env.BASE_URL}/content/${uniqueId}`
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getContent = async (req, res) => {
    try {

        const content = await Content.findOne({ uniqueId: req.params.id });

        if (!content)
            return res.status(403).json({ message: "Invalid Link" });

        if (new Date() > content.expiryTime)
            return res.status(410).json({ message: "Link Expired" });

        if (content.type === "text") {
            return res.json({
                type: "text",
                text: content.textData
            });
        }

        res.download(content.filePath, content.originalFileName);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
