// src/routes/mediacmsToken.js
const express = require('express');
const router = express.Router();
const axios = require('axios');

const MCMS_USER = process.env.MCMS_USER || 'admin';
const MCMS_PASS = process.env.MCMS_PASS || 'Latif1990?';

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
    // FIX: Check both 'access_token' and 'token'
    const token = response.data.access_token || response.data.token;
    if (token) {
      return res.json({ token });
    } else {
      console.error('No access_token or token in response:', response.data);
      return res.status(500).json({ error: 'No access_token or token', details: response.data });
    }
  } catch (err) {
    console.error('MediaCMS login failed:', err.response ? err.response.data : err.message);
    return res.status(500).json({ error: 'Failed to get MediaCMS token', details: err.response ? err.response.data : err.message });
  }
});

module.exports = router;
