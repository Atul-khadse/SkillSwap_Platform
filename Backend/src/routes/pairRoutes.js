// routes/pairRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getPair } = require('../controllers/pairController');

router.get('/:id', protect, getPair);

module.exports = router;