const { validationResult } = require('express-validator');
const prisma = require('../utils/db');

exports.getSubscriptions = async (req, res, next) => {
  try {
    const subscriptions = await prisma.subscription.findMany({
      where: { tenantId: req.user.tenantId },
      include: {
        customer: true,
        plan: true,
      },
    });
    res.status(200).json({ success: true, data: subscriptions });
  } catch (error) {
    next(error);
  }
};

exports.createSubscription = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }

    const { customerId, planId, startDate } = req.body;

    // Verify customer belongs to tenant
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, tenantId: req.user.tenantId },
    });
    if (!customer) return res.status(404).json({ success: false, error: 'Customer not found' });

    // Verify plan belongs to tenant
    const plan = await prisma.subscriptionPlan.findFirst({
      where: { id: planId, tenantId: req.user.tenantId, isActive: true },
    });
    if (!plan) return res.status(404).json({ success: false, error: 'Active plan not found' });

    const start = new Date(startDate);
    const nextBillingDate = new Date(start);
    nextBillingDate.setDate(nextBillingDate.getDate() + plan.intervalDays);

    const subscription = await prisma.subscription.create({
      data: {
        tenantId: req.user.tenantId,
        customerId,
        planId,
        status: 'ACTIVE',
        startDate: start,
        nextBillingDate,
      },
    });

    res.status(201).json({ success: true, data: subscription });
  } catch (error) {
    next(error);
  }
};

exports.cancelSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingSub = await prisma.subscription.findFirst({
      where: { id, tenantId: req.user.tenantId },
    });

    if (!existingSub) {
      return res.status(404).json({ success: false, error: 'Subscription not found' });
    }

    const subscription = await prisma.subscription.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    res.status(200).json({ success: true, data: subscription });
  } catch (error) {
    next(error);
  }
};
