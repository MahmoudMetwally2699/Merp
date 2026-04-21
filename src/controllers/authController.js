const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const prisma = require('../utils/db');

const generateToken = (user) => {
  return jwt.sign(
    { userId: user.id, tenantId: user.tenantId, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }

    const { tenantName, adminEmail, adminPassword } = req.body;

    const existingTenant = await prisma.tenant.findUnique({ where: { email: adminEmail } });
    if (existingTenant) {
      return res.status(400).json({ success: false, error: 'Tenant email already exists' });
    }

    const passwordHash = await bcrypt.hash(adminPassword, 10);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Tenant
      const tenant = await tx.tenant.create({
        data: {
          name: tenantName,
          email: adminEmail,
        },
      });

      // 2. Create User (ADMIN)
      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: adminEmail,
          passwordHash,
          role: 'ADMIN',
        },
      });

      // 3. Seed 4 default Chart of Accounts
      await tx.account.createMany({
        data: [
          { tenantId: tenant.id, code: '1000', name: 'Cash', type: 'ASSET' },
          { tenantId: tenant.id, code: '1200', name: 'Accounts Receivable', type: 'ASSET' },
          { tenantId: tenant.id, code: '2100', name: 'Deferred Revenue', type: 'LIABILITY' },
          { tenantId: tenant.id, code: '4000', name: 'Subscription Revenue', type: 'REVENUE' },
        ],
      });

      return { tenant, user };
    });

    const token = generateToken(result.user);

    res.status(201).json({
      success: true,
      data: {
        token,
        tenant: { id: result.tenant.id, name: result.tenant.name },
        user: { id: result.user.id, email: result.user.email, role: result.user.role },
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }

    const { email, password } = req.body;

    // Find user across all tenants
    const user = await prisma.user.findFirst({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      data: {
        token,
        user: { id: user.id, email: user.email, role: user.role, tenantId: user.tenantId },
      },
    });
  } catch (error) {
    next(error);
  }
};
