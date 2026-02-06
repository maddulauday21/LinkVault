const Content = require("../models/Content");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");


// ============================
// Upload Content
// ============================

exports.uploadContent = async (req, res) => {
  try {
    const { text, expiry, oneTimeView } = req.body;

    if (!text && !req.file) {
      return res.status(400).json({ message: "Upload text or file" });
    }

    const uniqueId = uuidv4();

    const expiryTime = expiry
      ? new Date(expiry)
      : new Date(Date.now() + 10 * 60 * 1000);

    let cleanedText = null;

    if (text) {
      cleanedText = text
        .split("\n")
        .map(line => line.trim())
        .join("\n")
        .trim();
    }

    const newContent = new Content({
      uniqueId,
      type: text ? "text" : "file",
      textData: cleanedText,
      filePath: req.file ? req.file.path : null,
      originalFileName: req.file ? req.file.originalname : null,
      oneTimeView: oneTimeView === "true",
      expiryTime
    });

    await newContent.save();

    res.json({
      link: `${process.env.BASE_URL}/content/${uniqueId}`
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};


// ============================
// Get Content (Link Access)
// ============================

exports.getContent = async (req, res) => {
  try {
    const content = await Content.findOne({ uniqueId: req.params.id });

    if (!content) {
      return res.status(403).send(renderPage(
        "Invalid Link",
        `<h2 style="color:red;">403 - Invalid Link</h2>
         <p>This link does not exist.</p>`
      ));
    }

    if (new Date() > content.expiryTime) {
      return res.status(403).send(renderPage(
        "Link Expired",
        `<h2 style="color:red;">403 - Link Expired</h2>
         <p>This content is no longer available.</p>`
      ));
    }

    // ============================
    // TEXT CONTENT
    // ============================

    if (content.type === "text") {

      const safeText = content.textData
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

      // One-time: consume immediately on view
      if (content.oneTimeView) {
        await Content.deleteOne({ _id: content._id });
      }

      return res.send(renderPage("Shared Text", `
        <h2 style="color:#2563eb;">Shared Text</h2>

        <pre id="textBox"
          style="margin-top:20px;padding:20px;
          border:1px solid #ccc;
          border-radius:8px;
          background:#f9fafb;
          text-align:left;
          white-space:pre-wrap;
          font-family:inherit;
          word-wrap:break-word;">
${safeText}
        </pre>

        <button onclick="copyText(this)" class="btn btn-blue">
          Copy to Clipboard
        </button>

        <script>
          function copyText(button) {
            const text = document.getElementById("textBox").innerText;
            navigator.clipboard.writeText(text).then(() => {
              button.innerText = "Copied";
              button.className = "btn btn-green";
              setTimeout(() => {
                button.innerText = "Copy to Clipboard";
                button.className = "btn btn-blue";
              }, 2000);
            });
          }
        </script>
      `));
    }

    // ============================
    // FILE CONTENT
    // ============================

    if (content.type === "file") {

      return res.send(renderPage("File Download", `
        <h2 style="color:#16a34a;">File Ready for Download</h2>
        <p>Your file is available below.</p>

        <a href="/content/download/${content.uniqueId}">
          <button class="btn btn-green">
            Download File
          </button>
        </a>
      `));
    }

  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};


// ============================
// Download File
// ============================

exports.downloadFile = async (req, res) => {
  try {
    const content = await Content.findOne({ uniqueId: req.params.id });

    if (!content) {
      return res.status(403).send("403 - Invalid Link");
    }

    if (new Date() > content.expiryTime) {
      return res.status(403).send("403 - Link Expired");
    }

    const filePath = content.filePath;

    if (!fs.existsSync(filePath)) {
      return res.status(404).send("File not found");
    }

    // One-time: consume when download happens
    if (content.oneTimeView) {

      await Content.deleteOne({ _id: content._id });

      return res.download(filePath, content.originalFileName, (err) => {
        if (!err && fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }

    // Normal download
    res.download(filePath, content.originalFileName);

  } catch (err) {
    console.error("Download error:", err);
    res.status(500).send("Download error");
  }
};


// ============================
// HTML Wrapper
// ============================

function renderPage(title, bodyContent) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <title>${title}</title>
    <style>
      body {
        margin: 0;
        font-family: system-ui, -apple-system, BlinkMacSystemFont,
                     "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell,
                     "Open Sans", "Helvetica Neue", sans-serif;
        background: #f3f4f6;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
      }

      .card {
        background: white;
        padding: 40px;
        border-radius: 10px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        text-align: center;
        max-width: 600px;
        width: 100%;
      }

      .btn {
        padding: 10px 20px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        margin-top: 15px;
      }

      .btn-blue {
        background: #2563eb;
        color: white;
      }

      .btn-green {
        background: #16a34a;
        color: white;
      }
    </style>
  </head>

  <body>
    <div class="card">
      ${bodyContent}
    </div>
  </body>
  </html>
  `;
}
