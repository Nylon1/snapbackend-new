const express = require("express");
const multer = require("multer");
const axios = require("axios");
const cors = require("cors");
const fs = require("fs");

const MCMS_USER = process.env.MCMS_USER || "admin";
const MCMS_PASS = process.env.MCMS_PASS || "Latif1990?";
const MCMS_LOGIN = "https://mediacms-cw-u46015.vm.elestio.app/api/v1/login";
const MCMS_UPLOAD = "https://mediacms-cw-u46015.vm.elestio.app/api/v1/media/";

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(cors()); // Adjust for production if needed

let cachedToken = null;

// Helper: Get (or refresh) MediaCMS token
async function getMediaCMSToken() {
  if (cachedToken) return cachedToken;
  // Get new token
  const params = new URLSearchParams();
  params.append("username", MCMS_USER);
  params.append("password", MCMS_PASS);

  const response = await axios.post(
    MCMS_LOGIN,
    params,
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );
  cachedToken = response.data.token;
  return cachedToken;
}

// Upload route
app.post("/upload", upload.single("video"), async (req, res) => {
  let token = await getMediaCMSToken();
  try {
    const FormData = require("form-data");
    const form = new FormData();

    form.append("media_file", fs.createReadStream(req.file.path));
    form.append("title", req.body.title);
    form.append("description", req.body.description);
    form.append("category", req.body.category);

    let mcmsRes;
    try {
      mcmsRes = await axios.post(
        MCMS_UPLOAD,
        form,
        {
          headers: {
            ...form.getHeaders(),
            Authorization: `Token ${token}`,
            Origin: "https://snapshnap.com",
          }
        }
      );
    } catch (err) {
      // If token expired/invalid, refresh and try again once
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        cachedToken = null; // Invalidate
        token = await getMediaCMSToken();
        mcmsRes = await axios.post(
          MCMS_UPLOAD,
          form,
          {
            headers: {
              ...form.getHeaders(),
              Authorization: `Token ${token}`,
              Origin: "https://snapshnap.com",
            }
          }
        );
      } else {
        throw err;
      }
    }

    fs.unlink(req.file.path, () => {});
    res.status(200).json(mcmsRes.data);

  } catch (error) {
    if (req.file) fs.unlink(req.file.path, () => {});
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

app.listen(3001, () => {
  console.log("Upload proxy server running on http://localhost:3001");
});
module.exports = getMediaCMSToken;
