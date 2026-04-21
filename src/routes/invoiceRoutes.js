const express = require('express');
const { getInvoices } = require('../controllers/invoiceController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', getInvoices);

module.exports = router;
