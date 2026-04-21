const express = require('express');
const { getIncomeStatement, getBalanceSheet } = require('../controllers/reportController');
const authMiddleware = require('../middlewares/authMiddleware');
const requireAdmin = require('../middlewares/requireAdmin');

const router = express.Router();

router.use(authMiddleware);
router.use(requireAdmin);

router.get('/income-statement', getIncomeStatement);
router.get('/balance-sheet', getBalanceSheet);

module.exports = router;
