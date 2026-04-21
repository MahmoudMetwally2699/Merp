const prisma = require('../utils/db');

exports.getInvoices = async (req, res, next) => {
  try {
    const invoices = await prisma.invoice.findMany({
      where: { tenantId: req.user.tenantId },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({ success: true, data: invoices });
  } catch (error) {
    next(error);
  }
};
