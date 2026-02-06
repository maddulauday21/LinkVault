import React, { useState } from "react";
import axios from "axios";

function App() {
  const [text, setText] = useState("");
  const [expiry, setExpiry] = useState("");
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!text.trim()) {
      alert("Please enter some text");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("text", text);

      if (expiry) {
        // Convert local datetime to ISO format
        const isoExpiry = new Date(expiry).toISOString();
        formData.append("expiry", isoExpiry);
      }

      const res = await axios.post("/content/upload", formData);

      setLink(res.data.link);
      setText("");
      setExpiry("");
    } catch (error) {
      alert("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-lg">
        <h1 className="text-2xl font-bold text-center text-blue-600 mb-6">
          Secure Content Sharing
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            className="w-full border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
            rows="4"
            placeholder="Enter text to share..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          <input
            type="datetime-local"
            className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
          >
            {loading ? "Uploading..." : "Generate Secure Link"}
          </button>
        </form>

        {link && (
          <div className="mt-6 bg-gray-50 p-4 rounded-md border">
            <p className="text-sm font-medium mb-2">Generated Link:</p>
            <a
              href={link}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 break-all underline"
            >
              {link}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
