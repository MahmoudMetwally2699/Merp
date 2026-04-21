const { validationResult } = require('express-validator');
const prisma = require('../utils/db');

exports.getPlans = async (req, res, next) => {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { tenantId: req.user.tenantId, isActive: true },
    });
    res.status(200).json({ success: true, data: plans });
  } catch (error) {
    next(error);
  }
};

exports.createPlan = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }

    const { name, price, intervalDays } = req.body;

    const plan = await prisma.subscriptionPlan.create({
      data: {
        tenantId: req.user.tenantId,
        name,
        price,
        intervalDays: intervalDays || 30,
      },
    });

    res.status(201).json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
};

exports.updatePlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, price, intervalDays } = req.body;

    // Verify ownership
    const existingPlan = await prisma.subscriptionPlan.findFirst({
      where: { id, tenantId: req.user.tenantId },
    });

    if (!existingPlan) {
      return res.status(404).json({ success: false, error: 'Plan not found' });
    }

    const plan = await prisma.subscriptionPlan.update({
      where: { id },
      data: { name, price, intervalDays },
    });

    res.status(200).json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
};

exports.deletePlan = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verify ownership
    const existingPlan = await prisma.subscriptionPlan.findFirst({
      where: { id, tenantId: req.user.tenantId },
    });

    if (!existingPlan) {
      return res.status(404).json({ success: false, error: 'Plan not found' });
    }

    // Soft delete
    const plan = await prisma.subscriptionPlan.update({
      where: { id },
      data: { isActive: false },
    });

    res.status(200).json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
};
