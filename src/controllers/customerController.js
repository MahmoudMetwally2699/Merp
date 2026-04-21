const { validationResult } = require('express-validator');
const prisma = require('../utils/db');

exports.getCustomers = async (req, res, next) => {
  try {
    const customers = await prisma.customer.findMany({
      where: { tenantId: req.user.tenantId },
    });
    res.status(200).json({ success: true, data: customers });
  } catch (error) {
    next(error);
  }
};

exports.createCustomer = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }

    const { name, email } = req.body;

    // Check unique email per tenant
    const existing = await prisma.customer.findFirst({
      where: { tenantId: req.user.tenantId, email },
    });

    if (existing) {
      return res.status(400).json({ success: false, error: 'Customer email already exists in this tenant' });
    }

    const customer = await prisma.customer.create({
      data: {
        tenantId: req.user.tenantId,
        name,
        email,
      },
    });

    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
};

exports.updateCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email } = req.body;

    const existingCustomer = await prisma.customer.findFirst({
      where: { id, tenantId: req.user.tenantId },
    });

    if (!existingCustomer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: { name, email },
    });

    res.status(200).json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
};

exports.deleteCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingCustomer = await prisma.customer.findFirst({
      where: { id, tenantId: req.user.tenantId },
    });

    if (!existingCustomer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    await prisma.customer.delete({
      where: { id },
    });

    res.status(200).json({ success: true, message: 'Customer deleted successfully' });
  } catch (error) {
    next(error);
  }
};
