// routes/pairRoutes.js
const express = require('express');
const router = express.Router();


const { protect } = require('../middleware/auth');
const { getPair, completeUserTeaching, completePair } = require('../controllers/pairController');

router.get('/:id', protect, getPair);
router.put('/:id/complete-user', protect, completeUserTeaching);
router.put('/:id/complete', protect, completePair);

module.exports = router;