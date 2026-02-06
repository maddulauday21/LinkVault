const cron = require("node-cron");
const cleanupExpired = require("./controllers/cleanupController");

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const contentRoutes = require("./routes/contentRoutes");

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.use("/content", contentRoutes);

cron.schedule("*/1 * * * *", () => {
    cleanupExpired();
});

app.listen(process.env.PORT, () =>
    console.log(`Server running on port ${process.env.PORT}`)
);
