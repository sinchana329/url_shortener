const express = require("express");
const mongoose = require("mongoose");
const shortid = require("shortid");
const path = require("path");
const Url = require("./models/Url");

const app = express();

/* ---------- Middleware ---------- */
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/* ---------- MongoDB Connection (Render ENV) ---------- */
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB error:", err));

/* ---------- API : Create Short URL ---------- */
app.post("/shorten", async (req, res) => {
  try {
    console.log("Request received:", req.body);

    const { originalUrl } = req.body;
    const shortCode = shortid.generate();

    console.log("Generated short code:", shortCode);

    const newUrl = new Url({ originalUrl, shortCode });
    await newUrl.save();

    console.log("Saved to DB");

    const baseUrl = req.protocol + "://" + req.get("host");

    res.json({
      shortUrl: `${baseUrl}/${shortCode}`,
    });
  } catch (err) {
    console.log("ERROR in /shorten:", err);
    res.status(500).json({ error: "Server error" });
  }
});


/* ---------- Redirect Short URL ---------- */
app.get("/:code", async (req, res) => {
  try {
    const url = await Url.findOne({ shortCode: req.params.code });
    if (!url) return res.status(404).send("URL not found");

    url.clicks++;
    await url.save();

    res.redirect(url.originalUrl);
  } catch (err) {
    res.status(500).send("Error");
  }
});

/* ---------- Render Port ---------- */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
