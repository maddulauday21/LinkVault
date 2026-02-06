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
      : new Date(Date.now() + 10 * 60 * 1000); // default 10 minutes

    // 🔥 Clean text properly
    let cleanedText = null;

    if (text) {
      cleanedText = text
        .split("\n")               // split into lines
        .map(line => line.trim())  // remove leading/trailing spaces
        .join("\n")                // join back with new lines
        .trim();                   // final trim
    }

    const newContent = new Content({
      uniqueId,
      type: text ? "text" : "file",
      textData: cleanedText,
      filePath: req.file ? req.file.path : null,
      originalFileName: req.file ? req.file.originalname : null,
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

exports.getContent = async (req, res) => {
    try {
        const content = await Content.findOne({ uniqueId: req.params.id });

        if (!content) {
            return res.send(renderPage("Invalid Link", `
        <h2 style="color:#ef4444;">Invalid Link</h2>
        <p>This link does not exist.</p>
      `));
        }

        if (new Date() > content.expiryTime) {
            return res.send(renderPage("Link Expired", `
        <h2 style="color:#ef4444;">Link Expired</h2>
        <p>This content is no longer available.</p>
      `));
        }

        // TEXT CONTENT
        if (content.type === "text") {
            return res.send(`
    <html>
    <head>
      <title>Shared Text</title>
    </head>
    <body style="font-family:sans-serif;background:#f3f4f6;
                 display:flex;align-items:center;justify-content:center;
                 height:100vh;margin:0;">
      <div style="background:white;padding:40px;border-radius:10px;
                  box-shadow:0 10px 25px rgba(0,0,0,0.1);
                  text-align:center;max-width:600px;width:100%;">
        
        <h1 style="color:#2563eb;">Shared Text</h1>

       <pre id="textBox"
             style="margin-top:20px;padding:20px;
             border:1px solid #ccc;
             border-radius:8px;
             background:#f9fafb;
             text-align:left;
             white-space:pre-wrap;
             word-wrap:break-word;
             font-family:inherit;">
${content.textData}
        </pre>


        <br>

        <button onclick="copyText(this)"
        style="padding:10px 20px;background:#2563eb;color:white;
        border:none;border-radius:5px;cursor:pointer;">
  Copy to Clipboard
</button>

<script>
  function copyText(button) {
    const text = document.getElementById("textBox").innerText;

    navigator.clipboard.writeText(text).then(() => {
      button.innerText = "Copied";
      button.style.background = "#16a34a";

      setTimeout(() => {
        button.innerText = "Copy to Clipboard";
        button.style.background = "#2563eb";
      }, 2000);
    });
  }
</script>

      </div>
    </body>
    </html>
  `);
        }


        // FILE CONTENT
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



exports.downloadFile = async (req, res) => {
    try {
        const content = await Content.findOne({ uniqueId: req.params.id });

        if (!content) {
            return res.status(404).send("File not found");
        }

        if (new Date() > content.expiryTime) {
            return res.send("Link Expired");
        }

        console.log("File path:", content.filePath); // debug

        res.download(content.filePath, content.originalFileName);

    } catch (err) {
        console.error("Download error:", err);
        res.status(500).send("Download error");
    }
};

function renderPage(title, bodyContent) {
    return `
  <!DOCTYPE html>
  <html>
  <head>
    <title>${title}</title>
    <style>
      body {
        margin: 0;
        font-family: Arial, sans-serif;
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
        max-width: 500px;
        width: 100%;
      }

      .content-box {
        margin: 20px 0;
        padding: 20px;
        border: 1px solid #ddd;
        border-radius: 6px;
        background: #fafafa;
        word-wrap: break-word;
      }

      .btn {
        padding: 10px 20px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        margin-top: 10px;
      }

      .btn-blue {
        background: #2563eb;
        color: white;
      }

      .btn-blue:hover {
        background: #1d4ed8;
      }

      .btn-green {
        background: #16a34a;
        color: white;
      }

      .btn-green:hover {
        background: #15803d;
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
