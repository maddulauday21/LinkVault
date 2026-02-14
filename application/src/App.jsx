import React, { useState, useRef } from "react";

import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
// import { addMinutes, setHours, setMinutes } from "date-fns";



function App() {
  const [mode, setMode] = useState(null); // "text" or "file"
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [expiry, setExpiry] = useState(null);
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [oneTimeView, setOneTimeView] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [maxViews, setMaxViews] = useState("");
  const [maxDownloads, setMaxDownloads] = useState("");
  const [errorMessage, setErrorMessage] = useState("");





  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");


    if (mode === "text" && !text.trim()) {
      alert("Please enter text");
      return;
    }

    if (mode === "file" && !file) {
      alert("Please select a file");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();

      if (mode === "text" && maxViews) {
        formData.append("maxViews", maxViews);
      }

      if (mode === "file" && maxDownloads) {
        formData.append("maxDownloads", maxDownloads);
      }


      if (mode === "text") {
        formData.append("text", text);
      }

      if (mode === "file") {
        formData.append("file", file);
      }
      if (password) {
        formData.append("password", password);
      }

      if (expiry) {
        formData.append("expiry", expiry.toISOString());
      }


      formData.append("oneTimeView", oneTimeView);
      const res = await axios.post("http://localhost:5000/content/upload", formData)

      setText("");
      setFile(null);
      setExpiry(null);
      setMaxViews("");
      setMaxDownloads("");

      setLink(res.data.link);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }


      setLink(res.data.link);

      setPassword("");
    } catch (error) {
  if (error.response && error.response.data.message) {
    setErrorMessage(error.response.data.message);
  } else {
    setErrorMessage("Something went wrong. Please try again.");
  }
}
 finally {
      setLoading(false);
    }
  };
  const now = new Date();
  const fileInputRef = useRef(null);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-lg">

        <h1 className="text-2xl font-bold text-center text-blue-600 mb-6">
          LinkVault – Secure Sharing
        </h1>

        {/* Mode Selection */}
        {!mode && (
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => {
                setMode("text");
                setLink("");
              }}

              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Share Text
            </button>

            <button
              onClick={() => {
                setMode("file");
                setLink("");
              }}

              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Share File
            </button>
          </div>
        )}

        {/* Form Section */}
        {mode && (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">

            {mode === "text" && (
              <textarea
                className="w-full border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
                rows="4"
                placeholder="Enter text to share..."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />

            )}

            {mode === "file" && (
              <input
                type="file"
                className="w-full"
                ref={fileInputRef}
                onChange={(e) => setFile(e.target.files[0])}
              />
              


            )}
            {errorMessage && (
  <div className="bg-red-100 text-red-700 p-2 rounded text-sm">
    {errorMessage}
  </div>
)}
            <label className="block font-medium mt-3">
              Password (optional)
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border rounded-md p-3"
                placeholder="Enter password"
              />

              <span
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 cursor-pointer"
              >
                {showPassword ? "🙈" : "👁️"}
              </span>
            </div>
           {mode === "text" && (
  <div className="flex items-center gap-3 mt-3">
    <label className="font-medium whitespace-nowrap">
      Max Views (optional)
    </label>

    <input
      type="number"
      min="1"
      value={maxViews}
      onChange={(e) => {
        setMaxViews(e.target.value);
        if (e.target.value) setOneTimeView(false);
      }}
      className="w-24 border rounded-md p-2 text-center"
      placeholder="e.g. 3"
    />
  </div>
)}



            {mode === "file" && (
  <div className="flex items-center gap-3 mt-3">
    <label className="font-medium whitespace-nowrap">
      Max Downloads (optional)
    </label>

    <input
      type="number"
      min="1"
      value={maxDownloads}
      onChange={(e) => {
        setMaxDownloads(e.target.value);
        if (e.target.value) setOneTimeView(false);
      }}
      className="w-24 border rounded-md p-2 text-center"
      placeholder="e.g. 3"
    />
  </div>
)}





            <DatePicker
              selected={expiry}
              onChange={(date) => {
                const selected = new Date(date);
                const now = new Date();

                const isToday =
                  selected.getDate() === now.getDate() &&
                  selected.getMonth() === now.getMonth() &&
                  selected.getFullYear() === now.getFullYear();

                if (isToday && selected < now) {
                  alert("Cannot select past time");
                  return;
                }

                setExpiry(selected);
              }}

              showTimeSelect
              timeIntervals={1}
              dateFormat="dd-MM-yyyy HH:mm"
              minDate={now}
              minTime={
                expiry && expiry.toDateString() === now.toDateString()
                  ? now
                  : new Date(0, 0, 0, 0, 0)
              }
              maxTime={new Date(0, 0, 0, 23, 59)}
              placeholderText="Select expiry date & time"
              className="w-full p-3 border rounded"
            />



            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={oneTimeView}
                onChange={(e) => {
                  setOneTimeView(e.target.checked);

                  if (e.target.checked) {
                    setMaxViews("");
                    setMaxDownloads("");
                  }
                }}
              />

              <label>Enable One-Time View</label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
            >
              {loading ? "Uploading..." : "Generate Secure Link"}
            </button>

            <button
              type="button"
              onClick={() => {
                setMode(null);
                setLink("");
              }}
              className="w-full text-gray-500 underline"
            >
              ← Back
            </button>


          </form>
        )}

        {link && (
          <div className="mt-6 bg-gray-50 p-4 rounded-md border">
            <p className="text-sm font-medium mb-2">Generated Link:</p>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={link}
                readOnly
                className="flex-1 border p-2 rounded-md text-sm"
              />

              <button
                onClick={() => {
                  navigator.clipboard.writeText(link);

                  const btn = document.getElementById("copyLinkBtn");
                  btn.innerText = "Copied";
                  btn.classList.remove("bg-green-600");
                  btn.classList.add("bg-blue-600");

                  setTimeout(() => {
                    btn.innerText = "Copy";
                    btn.classList.remove("bg-blue-600");
                    btn.classList.add("bg-green-600");
                  }, 2000);
                }}
                id="copyLinkBtn"
                className="bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 transition"
              >
                Copy
              </button>

            </div>

            <a
              href={link}
              target="_blank"
              rel="noreferrer"
              className="block mt-2 text-blue-600 text-sm underline"
            >
              Open Link
            </a>
          </div>
        )}


      </div>
    </div>
  );
}

export default App;
