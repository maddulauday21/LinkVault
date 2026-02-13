const Content = require("../models/Content");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const bcrypt = require("bcrypt");



// ============================
// Upload Content
// ============================

exports.uploadContent = async (req, res) => {
  try {
    const { text, expiry, oneTimeView, password } = req.body;


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
    let hashedPassword = null;

    if (password && password.trim() !== "") {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const newContent = new Content({
      uniqueId,
      type: text ? "text" : "file",
      textData: cleanedText,
      filePath: req.file ? req.file.path : null,
      originalFileName: req.file ? req.file.originalname : null,
      oneTimeView: oneTimeView === "true",
      password: hashedPassword,
      isConsumed: false,  // NEW FIELD
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
// Get Content (Link Open)
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
    // If password protected and not verified
    if (content.password && req.query.auth !== "true") {
      return res.send(renderPasswordPage(content.uniqueId));
    }

    // If one-time and already consumed
    if (content.oneTimeView && content.isConsumed) {
      return res.status(403).send(renderPage(
        "Link Expired",
        `<h2 style="color:red;">403 - Link Expired</h2>
         <p>This link has already been used.</p>`
      ));
    }

    // ================= TEXT =================

    if (content.type === "text") {

      if (content.oneTimeView) {
        await Content.deleteOne({ _id: content._id });
      }

      const safeText = content.textData
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

      return res.send(renderPage("Shared Text", `
        <h2 style="color:#2563eb;">Shared Text</h2>

        <pre style="
          margin-top:20px;
          padding:20px;
          border:1px solid #ccc;
          border-radius:8px;
          background:#f9fafb;
          white-space:pre-wrap;
          text-align:left;
          font-family:inherit;
        ">
${safeText}
        </pre>
      `));
    }

    // ================= FILE =================

    if (content.type === "file") {

      if (content.oneTimeView) {
        // Mark link as consumed immediately
        content.isConsumed = true;
        await content.save();
      }

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

    if (content.oneTimeView) {

      res.download(filePath, content.originalFileName, async (err) => {
        if (!err) {
          await Content.deleteOne({ _id: content._id });

          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
      });

    } else {
      res.download(filePath, content.originalFileName);
    }

  } catch (err) {
    console.error("Download error:", err);
    res.status(500).send("Download error");
  }
};


exports.verifyPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const content = await Content.findOne({ uniqueId: req.params.id });

    // Invalid
    if (!content) {
      return res.status(403).send(renderPage(
        "Invalid Link",
        `<h2 style="color:red;">403 - Invalid Link</h2>
         <p>This link does not exist.</p>`
      ));
    }

    // Expired
    if (new Date() > content.expiryTime) {
      return res.status(403).send(renderPage(
        "Link Expired",
        `<h2 style="color:red;">403 - Link Expired</h2>
         <p>This content is no longer available.</p>`
      ));
    }

    // One-time already consumed
    if (content.oneTimeView && content.isConsumed) {
      return res.status(403).send(renderPage(
        "Link Expired",
        `<h2 style="color:red;">403 - Link Expired</h2>
         <p>This link has already been used.</p>`
      ));
    }

    const match = await bcrypt.compare(password, content.password);

    if (!match) {
      return res.send(renderPasswordPage(content.uniqueId, true));
    }

    // Correct password → unlock
    return res.redirect(`/content/${content.uniqueId}?auth=true`);

  } catch (err) {
    console.error(err);
    res.status(500).send(renderPage(
      "Server Error",
      `<h2 style="color:red;">500 - Server Error</h2>
       <p>Something went wrong.</p>`
    ));
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

function renderPasswordPage(id, wrong = false) {
  return `
  <html>
  <head>
    <title>Password Protected</title>
    <style>
      body {
        display:flex;
        justify-content:center;
        align-items:center;
        height:100vh;
        font-family:sans-serif;
        background:#f3f4f6;
      }
      .card {
        background:white;
        padding:40px;
        border-radius:10px;
        box-shadow:0 10px 25px rgba(0,0,0,0.1);
        text-align:center;
      }
      input {
        padding:10px;
        width:250px;
        margin-top:15px;
      }
      button {
        margin-top:15px;
        padding:10px 20px;
        background:#2563eb;
        color:white;
        border:none;
        border-radius:5px;
        cursor:pointer;
      }
      .error {
        color:red;
        margin-top:10px;
      }
    </style>
  </head>
  <body>
    <div class="card">
      <h2>Password Required</h2>
      ${wrong ? '<div class="error">Incorrect Password</div>' : ''}

      <form method="POST" action="/content/verify/${id}">
        <input type="password" name="password" placeholder="Enter password" required />
        <br/>
        <button type="submit">Unlock</button>
      </form>
    </div>
  </body>
  </html>
  `;
}

