const express = require('express');
const router = express.Router();
const {
  sendExchangeRequest,
  getExchangeRequests,
  acceptExchangeRequest,
  rejectExchangeRequest
} = require('../controllers/exchangeController');
const { protect } = require('../middleware/auth');

router.post('/request', protect, sendExchangeRequest);
router.get('/requests', protect, getExchangeRequests);
router.put('/requests/:id/accept', protect, acceptExchangeRequest);
router.put('/requests/:id/reject', protect, rejectExchangeRequest);

module.exports = router;