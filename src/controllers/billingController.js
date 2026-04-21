const { validationResult } = require('express-validator');
const prisma = require('../utils/db');

exports.generateInvoices = async (req, res, next) => {
  try {
    const today = new Date();

    const subscriptions = await prisma.subscription.findMany({
      where: {
        tenantId: req.user.tenantId,
        status: 'ACTIVE',
        nextBillingDate: { lte: today },
      },
      include: {
        plan: true,
      },
    });

    let invoicesCreated = 0;

    // Accounts
    const arAccount = await prisma.account.findUnique({
      where: { tenantId_code: { tenantId: req.user.tenantId, code: '1200' } },
    });
    const deferredRevAccount = await prisma.account.findUnique({
      where: { tenantId_code: { tenantId: req.user.tenantId, code: '2100' } },
    });

    if (!arAccount || !deferredRevAccount) {
      return res.status(500).json({ success: false, error: 'Chart of Accounts missing' });
    }

    for (const sub of subscriptions) {
      await prisma.$transaction(async (tx) => {
        // Create Invoice
        const invoice = await tx.invoice.create({
          data: {
            tenantId: req.user.tenantId,
            subscriptionId: sub.id,
            customerId: sub.customerId,
            amount: sub.plan.price,
            status: 'UNPAID',
            dueDate: today,
          },
        });

        // Update Subscription Next Billing Date
        const nextDate = new Date(sub.nextBillingDate);
        nextDate.setDate(nextDate.getDate() + sub.plan.intervalDays);

        await tx.subscription.update({
          where: { id: sub.id },
          data: { nextBillingDate: nextDate },
        });

        // Create Journal Entry
        await tx.journalEntry.create({
          data: {
            tenantId: req.user.tenantId,
            description: `Invoice generated for Subscription ${sub.id}`,
            lines: {
              create: [
                { accountId: arAccount.id, debit: sub.plan.price, credit: 0 },
                { accountId: deferredRevAccount.id, debit: 0, credit: sub.plan.price },
              ],
            },
          },
        });

        invoicesCreated++;
      });
    }

    res.status(200).json({ success: true, data: { invoicesCreated } });
  } catch (error) {
    next(error);
  }
};

exports.recognizeRevenue = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }

    const { month, year } = req.body;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const invoices = await prisma.invoice.findMany({
      where: {
        tenantId: req.user.tenantId,
        status: 'PAID',
        revenueRecognized: false,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    let recognizedCount = 0;

    const deferredRevAccount = await prisma.account.findUnique({
      where: { tenantId_code: { tenantId: req.user.tenantId, code: '2100' } },
    });
    const subRevAccount = await prisma.account.findUnique({
      where: { tenantId_code: { tenantId: req.user.tenantId, code: '4000' } },
    });

    if (!deferredRevAccount || !subRevAccount) {
      return res.status(500).json({ success: false, error: 'Chart of Accounts missing' });
    }

    for (const inv of invoices) {
      await prisma.$transaction(async (tx) => {
        // Mark Invoice Recognized
        await tx.invoice.update({
          where: { id: inv.id },
          data: { revenueRecognized: true },
        });

        // Create Journal Entry
        await tx.journalEntry.create({
          data: {
            tenantId: req.user.tenantId,
            description: `Revenue recognized for Invoice ${inv.id}`,
            lines: {
              create: [
                { accountId: deferredRevAccount.id, debit: inv.amount, credit: 0 },
                { accountId: subRevAccount.id, debit: 0, credit: inv.amount },
              ],
            },
          },
        });

        recognizedCount++;
      });
    }

    res.status(200).json({ success: true, data: { recognizedCount } });
  } catch (error) {
    next(error);
  }
};
