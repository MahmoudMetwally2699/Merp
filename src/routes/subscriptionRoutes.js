const express = require('express');
const { body } = require('express-validator');
const { getSubscriptions, createSubscription, cancelSubscription } = require('../controllers/subscriptionController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', getSubscriptions);

router.post(
  '/',
  [
    body('customerId').isUUID().withMessage('Valid Customer ID is required'),
    body('planId').isUUID().withMessage('Valid Plan ID is required'),
    body('startDate').isISO8601().withMessage('Valid start date is required'),
  ],
  createSubscription
);

router.put('/:id/cancel', cancelSubscription);

module.exports = router;
