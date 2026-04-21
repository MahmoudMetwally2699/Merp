const express = require('express');
const { body } = require('express-validator');
const { getCustomers, createCustomer, updateCustomer, deleteCustomer } = require('../controllers/customerController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', getCustomers);

router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
  ],
  createCustomer
);

router.put('/:id', updateCustomer);
router.delete('/:id', deleteCustomer);

module.exports = router;
