const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

const register = async ({ name, email, password, role }) => {
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) throw new Error('Email already registered');

  if (!['ORGANIZER', 'CUSTOMER'].includes(role))
    throw new Error('Role must be ORGANIZER or CUSTOMER');

  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.create({ data: { name, email, password: hashed, role } });
  return { message: 'Registered successfully' };
};

const login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('Invalid credentials');

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new Error('Invalid credentials');

  const token = jwt.sign(
    { id: user.id, role: user.role, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
  return { token };
};

module.exports = { register, login };