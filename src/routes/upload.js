const express = require("express");
const multer = require("multer");
const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");


const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/", upload.single("video"), async (req, res) => {
  let token = await getMediaCMSToken();
  try {
    const form = new FormData();
    form.append("media_file", fs.createReadStream(req.file.path));
    form.append("title", req.body.title);
    form.append("description", req.body.description);
    form.append("category", req.body.category);

    let mcmsRes;
    try {
      mcmsRes = await axios.post(
        "https://mediacms-cw-u46015.vm.elestio.app/api/v1/media/",
        form,
        {
          headers: {
            ...form.getHeaders(),
            Authorization: `Token ${token}`,
            Origin: "https://snapshnap.com",
          },
        }
      );
    } catch (err) {
      // If token expired/invalid, clear cache and try again
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        cachedToken = null; // clear old token
        token = await getMediaCMSToken();
        mcmsRes = await axios.post(
          "https://mediacms-cw-u46015.vm.elestio.app/api/v1/media/",
          form,
          {
            headers: {
              ...form.getHeaders(),
              Authorization: `Token ${token}`,
              Origin: "https://snapshnap.com",
            },
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

module.exports = router;

