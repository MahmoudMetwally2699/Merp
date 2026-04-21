const prisma = require('../utils/db');

exports.getIncomeStatement = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, error: 'startDate and endDate are required' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const subRevAccount = await prisma.account.findUnique({
      where: { tenantId_code: { tenantId: req.user.tenantId, code: '4000' } },
    });

    if (!subRevAccount) {
      return res.status(500).json({ success: false, error: 'Account 4000 not found' });
    }

    const lines = await prisma.journalLine.aggregate({
      _sum: {
        credit: true,
      },
      where: {
        accountId: subRevAccount.id,
        journalEntry: {
          tenantId: req.user.tenantId,
          createdAt: {
            gte: start,
            lte: end,
          },
        },
      },
    });

    const total = lines._sum.credit || 0;

    res.status(200).json({
      success: true,
      data: {
        period: { startDate, endDate },
        subscriptionRevenue: total,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getBalanceSheet = async (req, res, next) => {
  try {
    const accounts = await prisma.account.findMany({
      where: {
        tenantId: req.user.tenantId,
        code: { in: ['1000', '1200', '2100', '4000'] },
      },
      include: {
        journalLines: {
          select: {
            debit: true,
            credit: true,
          },
        },
      },
    });

    const balances = {
      assets: { cash: 0, accountsReceivable: 0 },
      liabilities: { deferredRevenue: 0 },
      revenue: { subscriptionRevenue: 0 },
    };

    accounts.forEach((acc) => {
      const sumDebits = acc.journalLines.reduce((sum, line) => sum + Number(line.debit), 0);
      const sumCredits = acc.journalLines.reduce((sum, line) => sum + Number(line.credit), 0);

      let balance = 0;
      if (acc.type === 'ASSET') {
        balance = sumDebits - sumCredits;
      } else {
        balance = sumCredits - sumDebits;
      }

      if (acc.code === '1000') balances.assets.cash = balance;
      if (acc.code === '1200') balances.assets.accountsReceivable = balance;
      if (acc.code === '2100') balances.liabilities.deferredRevenue = balance;
      if (acc.code === '4000') balances.revenue.subscriptionRevenue = balance;
    });

    res.status(200).json({ success: true, data: balances });
  } catch (error) {
    next(error);
  }
};
