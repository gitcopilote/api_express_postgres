const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const { Client } = require("pg");
const app = express();

const storage = multer.memoryStorage();
const upload = multer({ storage });

const dbClient = new Client({
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "password",
  database: "images"
});

dbClient.connect();

app.post("/image", upload.single("image"), async (req, res) => {
  if (req.file.length > (1024 * 1024)) {
    return res.status(400).json({ error: "Image size too large" });
  }

  try {
    const image = await sharp(req.file.buffer);
    const metadata = await image.metadata();
    if (metadata.format !== "jpeg" && metadata.format !== "png") {
      return res
        .status(400)
        .json({ error: "Invalid image format, only JPEG and PNG are allowed" });
    }

    const fileName = `${Date.now()}.${metadata.format}`;
    await image.toFile(path.join(__dirname, "images", fileName));

    const query =
      "INSERT INTO images (name, format, size, created_at) VALUES ($1, $2, $3, $4)";
    const values = [fileName, metadata.format, req.file.length, new Date()];
    await dbClient.query(query, values);

    res.json({ message: "Image uploaded successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error while saving the image" });
  }
});

app.listen(3000, () => {
  console.log("API listening on port 3000");
});
