const { z } = require('zod');

// Password security: Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const createUserSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required'),
  employeeId: z.string().trim().min(1, 'Employee ID is required').toUpperCase(),
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').regex(
    passwordRegex,
    'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character'
  ),
  department: z.string().trim().optional(),
  college: z.string().trim().optional(),
  role: z.enum(['Admin', 'Principal', 'HOD', 'Faculty', 'Office Assistant'], {
    errorMap: () => ({ message: 'Invalid role' }),
  }),
  status: z.enum(['active', 'inactive']).default('active').optional(),
});

const loginSchema = z.object({
  employeeId: z.string().trim().min(1, 'Employee ID is required').toUpperCase(),
  password: z.string().min(1, 'Password is required'),
});

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters').regex(
    passwordRegex,
    'New password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character'
  ),
});

module.exports = {
  createUserSchema,
  loginSchema,
  changePasswordSchema,
};
