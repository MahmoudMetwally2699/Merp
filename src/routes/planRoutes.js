const express = require('express');
const { body } = require('express-validator');
const { getPlans, createPlan, updatePlan, deletePlan } = require('../controllers/planController');
const authMiddleware = require('../middlewares/authMiddleware');
const requireAdmin = require('../middlewares/requireAdmin');

const router = express.Router();

router.use(authMiddleware);
router.use(requireAdmin);

router.get('/', getPlans);

router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('price').isFloat({ min: 0 }).withMessage('Valid price is required'),
  ],
  createPlan
);

router.put('/:id', updatePlan);
router.delete('/:id', deletePlan);

module.exports = router;
