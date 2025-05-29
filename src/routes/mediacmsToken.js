// src/routes/mediacmsToken.js
const express = require('express');
const router = express.Router();
const axios = require('axios');

// Replace with your MediaCMS admin credentials
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
    res.json({ token: response.data.access_token });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get MediaCMS token' });
  }
});

module.exports = router;
