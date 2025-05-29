// src/routes/mediacmsToken.js
const express = require('express');
const router = express.Router();
const axios = require('axios');

const MCMS_USER = process.env.MCMS_USER || 'YOUR_MEDIACMS_USER';
const MCMS_PASS = process.env.MCMS_PASS || 'YOUR_MEDIACMS_PASSWORD';

router.post('/', async (req, res) => {
  try {
    const params = new URLSearchParams();
    params.append('username', MCMS_USER);
    params.append('password', MCMS_PASS);

    const response = await axios.post(
      'https://mediacms-cw-u46015.vm.elestio.app/api/v1/login',
      params,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    if (response.data && response.data.access_token) {
      // ✅ This is the key line
      return res.json({ token: response.data.access_token });
    } else {
      // Log and send details if the response is missing the token
      console.error('No access_token in MediaCMS response:', response.data);
      return res.status(500).json({ error: 'No access_token', details: response.data });
    }
  } catch (err) {
    // Log and send any axios error
    console.error('MediaCMS login failed:', err.response ? err.response.data : err.message);
    return res.status(500).json({ error: 'Failed to get MediaCMS token', details: err.response ? err.response.data : err.message });
  }
});

module.exports = router;
