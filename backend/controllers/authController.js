const User = require('../models/User');
const Course = require('../models/Course');
const College = require('../models/College');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateToken } = require('../utils/jwt');
const { createUserSchema, loginSchema, changePasswordSchema } = require('../validators/userValidator');

/**
 * Log in a user.
 */
const login = async (req, res, next) => {
  try {
    // Validate request body
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: parseResult.error.flatten().fieldErrors,
      });
    }

    const { employeeId, password } = parseResult.data;

    // Find user
    const user = await User.findOne({ employeeId });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Employee ID or Password.',
      });
    }

    // Check account status
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Contact Admin.',
      });
    }

    // Verify password
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Employee ID or Password.',
      });
    }

    // Update lastLogin
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT
    const token = generateToken(user);

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    // Return user details and token
    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        employeeId: user.employeeId,
        email: user.email,
        college: user.college || '',
        department: user.department || '',
        role: user.role,
        status: user.status,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Log out a user.
 */
const logout = async (req, res, next) => {
  try {
    res.clearCookie('token');
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get profile of current logged-in user.
 */
const getProfile = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        fullName: req.user.fullName,
        employeeId: req.user.employeeId,
        email: req.user.email,
        college: req.user.college || '',
        department: req.user.department || '',
        role: req.user.role,
        status: req.user.status,
        lastLogin: req.user.lastLogin,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Change user password.
 */
const changePassword = async (req, res, next) => {
  try {
    // Validate request body
    const parseResult = changePasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: parseResult.error.flatten().fieldErrors,
      });
    }

    const { oldPassword, newPassword } = parseResult.data;

    // Get user from database with password
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Verify current password
    const isMatch = await comparePassword(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect current password.',
      });
    }

    // Hash and update new password
    user.password = await hashPassword(newPassword);
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin creates a new user.
 */
const createUser = async (req, res, next) => {
  try {
    // Validate request body
    const parseResult = createUserSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: parseResult.error.flatten().fieldErrors,
      });
    }

    const { fullName, employeeId, email, password, department, college, role, status } = parseResult.data;

    // Enforce Admin can only create Principal, HOD, Office Assistant, or Faculty
    const allowedRoles = ['Principal', 'HOD', 'Office Assistant', 'Faculty'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Admin is only authorized to register Principal, HOD, Office Assistant, or Faculty users.',
      });
    }

    let targetDept = '';
    let targetCol = '';

    if (role === 'HOD') {
      // Validate department/course exists
      if (!department) {
        return res.status(400).json({
          success: false,
          message: 'Course / Department is required for HOD.',
        });
      }

      const courseExists = await Course.findOne({
        $or: [
          { courseName: department },
          { courseId: department.toUpperCase() }
        ]
      });

      if (!courseExists) {
        return res.status(400).json({
          success: false,
          message: `Invalid Course / Department: '${department}' is not a registered course.`,
        });
      }

      targetDept = courseExists.courseName;
      targetCol = courseExists.college; // Inferred from Course

      // Enforce only 1 active HOD per Course
      const existingHOD = await User.findOne({
        role: 'HOD',
        department: targetDept,
        status: 'active',
      });

      if (existingHOD) {
        return res.status(400).json({
          success: false,
          message: `Course '${targetDept}' already has an active HOD. Only one is allowed per course.`,
        });
      }
    } else {
      // Principal, Office Assistant, Faculty are registered under College
      if (!college) {
        return res.status(400).json({
          success: false,
          message: 'College is required.',
        });
      }

      const collegeExists = await College.findOne({
        $or: [
          { collegeName: college },
          { collegeId: college.toUpperCase() }
        ]
      });

      if (!collegeExists) {
        return res.status(400).json({
          success: false,
          message: `Invalid College: '${college}' is not a registered college.`,
        });
      }

      targetCol = collegeExists.collegeName;
      targetDept = ''; // Reset department

      // Enforce 1 active Principal per College
      if (role === 'Principal') {
        const existingPrincipal = await User.findOne({
          role: 'Principal',
          college: targetCol,
          status: 'active',
        });
        if (existingPrincipal) {
          return res.status(400).json({
            success: false,
            message: `College '${targetCol}' already has an active Principal. Only one Principal is allowed per college.`,
          });
        }
      }

      // Enforce 1 active Office Assistant per College
      if (role === 'Office Assistant') {
        const existingAssistant = await User.findOne({
          role: 'Office Assistant',
          college: targetCol,
          status: 'active',
        });
        if (existingAssistant) {
          return res.status(400).json({
            success: false,
            message: `College '${targetCol}' already has an active Office Assistant. Only one Office Assistant is allowed per college.`,
          });
        }
      }
    }

    // Check if user already exists (employeeId or email)
    const existingEmployee = await User.findOne({ employeeId });
    if (existingEmployee) {
      return res.status(400).json({
        success: false,
        message: `User with Employee ID '${employeeId}' already exists.`,
      });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: `User with Email '${email}' already exists.`,
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const newUser = new User({
      fullName,
      employeeId,
      email,
      password: hashedPassword,
      college: targetCol,
      department: targetDept,
      role,
      status: status || 'active',
    });

    await newUser.save();

    return res.status(201).json({
      success: true,
      message: 'User created successfully.',
      user: {
        id: newUser._id,
        fullName: newUser.fullName,
        employeeId: newUser.employeeId,
        email: newUser.email,
        college: newUser.college,
        department: newUser.department,
        role: newUser.role,
        status: newUser.status,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin retrieves all registered users.
 */
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin updates a user's details or deactivates them.
 */
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { fullName, email, department, college, role, status } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Prevent modifying Admin role or status
    if (user.role === 'Admin') {
      if (role && role !== 'Admin') {
        return res.status(400).json({
          success: false,
          message: 'System Administrator role cannot be changed.',
        });
      }
      if (status && status !== 'active') {
        return res.status(400).json({
          success: false,
          message: 'System Administrator account cannot be deactivated.',
        });
      }
      if (fullName) user.fullName = fullName;
      if (email) user.email = email;
      await user.save();

      return res.status(200).json({
        success: true,
        message: 'User updated successfully.',
        user: {
          id: user._id,
          fullName: user.fullName,
          employeeId: user.employeeId,
          email: user.email,
          college: user.college || '',
          department: user.department || 'Administration',
          role: user.role,
          status: user.status,
        },
      });
    }

    // Role restrictions validation
    let targetRole = user.role;
    if (role) {
      const allowedRoles = ['Principal', 'HOD', 'Office Assistant', 'Faculty'];
      if (!allowedRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Admin is only authorized to register Principal, HOD, Office Assistant, or Faculty users.',
        });
      }
      targetRole = role;
    }

    // Status validation
    let targetStatus = status !== undefined ? status : user.status;
    if (status !== undefined) {
      if (!['active', 'inactive'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Status must be active or inactive.',
        });
      }
    }

    let targetDept = '';
    let targetCol = '';

    if (targetRole === 'HOD') {
      const deptToCheck = department !== undefined ? department : user.department;
      if (!deptToCheck) {
        return res.status(400).json({
          success: false,
          message: 'Course / Department is required for HOD.',
        });
      }

      const courseExists = await Course.findOne({
        $or: [
          { courseName: deptToCheck },
          { courseId: deptToCheck.toUpperCase() }
        ]
      });

      if (!courseExists) {
        return res.status(400).json({
          success: false,
          message: `Invalid Course / Department: '${deptToCheck}' is not a registered course.`,
        });
      }

      targetDept = courseExists.courseName;
      targetCol = courseExists.college;

      // Validate single HOD per course constraint
      if (targetStatus === 'active') {
        const existingHOD = await User.findOne({
          role: 'HOD',
          department: targetDept,
          status: 'active',
          _id: { $ne: user._id }
        });

        if (existingHOD) {
          return res.status(400).json({
            success: false,
            message: `Course '${targetDept}' already has an active HOD.`,
          });
        }
      }
    } else {
      // Principal, Office Assistant, Faculty registered under College
      const colToCheck = college !== undefined ? college : user.college;
      if (!colToCheck) {
        return res.status(400).json({
          success: false,
          message: 'College is required.',
        });
      }

      const collegeExists = await College.findOne({
        $or: [
          { collegeName: colToCheck },
          { collegeId: colToCheck.toUpperCase() }
        ]
      });

      if (!collegeExists) {
        return res.status(400).json({
          success: false,
          message: `Invalid College: '${colToCheck}' is not a registered college.`,
        });
      }

      targetCol = collegeExists.collegeName;
      targetDept = '';

      // Enforce 1 active Principal per College
      if (targetRole === 'Principal' && targetStatus === 'active') {
        const existingPrincipal = await User.findOne({
          role: 'Principal',
          college: targetCol,
          status: 'active',
          _id: { $ne: user._id }
        });
        if (existingPrincipal) {
          return res.status(400).json({
            success: false,
            message: `College '${targetCol}' already has an active Principal.`,
          });
        }
      }

      // Enforce 1 active Office Assistant per College
      if (targetRole === 'Office Assistant' && targetStatus === 'active') {
        const existingAssistant = await User.findOne({
          role: 'Office Assistant',
          college: targetCol,
          status: 'active',
          _id: { $ne: user._id }
        });
        if (existingAssistant) {
          return res.status(400).json({
            success: false,
            message: `College '${targetCol}' already has an active Office Assistant.`,
          });
        }
      }
    }

    // Apply updates
    if (fullName) user.fullName = fullName;
    if (email) user.email = email;
    user.role = targetRole;
    user.college = targetCol;
    user.department = targetDept;
    user.status = targetStatus;

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'User updated successfully.',
      user: {
        id: user._id,
        fullName: user.fullName,
        employeeId: user.employeeId,
        email: user.email,
        college: user.college,
        department: user.department,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin deletes a user account.
 */
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Prevent Admin from deleting themselves
    if (req.user.id === user.id || req.user.employeeId === user.employeeId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account.',
      });
    }

    await User.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  logout,
  getProfile,
  changePassword,
  createUser,
  getUsers,
  updateUser,
  deleteUser,
};
