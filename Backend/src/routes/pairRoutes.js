// routes/pairRoutes.js
const express = require('express');
const router = express.Router();


const { protect } = require('../middleware/auth');
const { getPair, completeUserTeaching } = require('../controllers/pairController');

router.get('/:id', protect, getPair);
router.put('/:id/complete-user', protect, completeUserTeaching);

module.exports = router;