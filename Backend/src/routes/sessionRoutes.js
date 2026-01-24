const express = require('express');
const router = express.Router();
const {
  createSession,
  getSessionsByPair,
  updateSessionStatus,
  addSessionNote
} = require('../controllers/sessionController');
const { protect } = require('../middleware/auth');

router.post('/', protect, createSession);
router.get('/pair/:pairId', protect, getSessionsByPair);
router.put('/:id/status', protect, updateSessionStatus);
router.post('/:id/notes', protect, addSessionNote);

module.exports = router;