const express = require('express');
const { body } = require('express-validator');
const { processPayment } = require('../controllers/paymentController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.post(
  '/',
  [
    body('invoiceId').isUUID().withMessage('Valid Invoice ID is required'),
    body('amount').isFloat({ min: 0 }).withMessage('Valid amount is required'),
  ],
  processPayment
);

module.exports = router;
