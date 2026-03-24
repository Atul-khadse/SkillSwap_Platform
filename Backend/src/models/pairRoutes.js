const { protect } = require('../middleware/auth');
const { getPair, completePair } = require('../controllers/pairController');

router.get('/:id', protect, getPair);
router.put('/:id/complete', protect, completePair);   // New