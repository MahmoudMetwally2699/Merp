const { validationResult } = require('express-validator');
const prisma = require('../utils/db');

exports.processPayment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }

    const { invoiceId, amount } = req.body;

    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId: req.user.tenantId },
    });

    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    if (invoice.status === 'PAID') {
      return res.status(400).json({ success: false, error: 'Invoice is already paid' });
    }

    if (Number(invoice.amount) !== Number(amount)) {
      return res.status(400).json({ success: false, error: 'Amount does not match invoice amount exactly' });
    }

    const cashAccount = await prisma.account.findUnique({
      where: { tenantId_code: { tenantId: req.user.tenantId, code: '1000' } },
    });
    const arAccount = await prisma.account.findUnique({
      where: { tenantId_code: { tenantId: req.user.tenantId, code: '1200' } },
    });

    if (!cashAccount || !arAccount) {
      return res.status(500).json({ success: false, error: 'Chart of Accounts missing' });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create Payment
      const payment = await tx.payment.create({
        data: {
          tenantId: req.user.tenantId,
          invoiceId: invoice.id,
          amount,
        },
      });

      // Update Invoice Status
      await tx.invoice.update({
        where: { id: invoice.id },
        data: { status: 'PAID' },
      });

      // Create Journal Entry
      await tx.journalEntry.create({
        data: {
          tenantId: req.user.tenantId,
          description: `Payment received for Invoice ${invoice.id}`,
          lines: {
            create: [
              { accountId: cashAccount.id, debit: amount, credit: 0 },
              { accountId: arAccount.id, debit: 0, credit: amount },
            ],
          },
        },
      });

      return payment;
    });

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
