const express = require('express');
const { body } = require('express-validator');
const { generateInvoices, recognizeRevenue } = require('../controllers/billingController');
const authMiddleware = require('../middlewares/authMiddleware');
const requireAdmin = require('../middlewares/requireAdmin');

const router = express.Router();

router.use(authMiddleware);
router.use(requireAdmin);

router.post('/generate-invoices', generateInvoices);

router.post(
  '/recognize-revenue',
  [
    body('month').isInt({ min: 1, max: 12 }).withMessage('Valid month is required (1-12)'),
    body('year').isInt({ min: 2000 }).withMessage('Valid year is required'),
  ],
  recognizeRevenue
);

module.exports = router;
