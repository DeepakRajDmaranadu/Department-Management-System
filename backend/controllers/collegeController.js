const College = require('../models/College');
const Course = require('../models/Course');
const User = require('../models/User');
const { z } = require('zod');

const collegeSchemaVal = z.object({
  collegeId: z.string().trim().min(1, 'College ID is required').toUpperCase(),
  collegeName: z.string().trim().min(1, 'College Name is required'),
});

/**
 * Admin creates a new college.
 */
const createCollege = async (req, res, next) => {
  try {
    const parseResult = collegeSchemaVal.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: parseResult.error.flatten().fieldErrors,
      });
    }

    const { collegeId, collegeName } = parseResult.data;

    // Check duplicate ID
    const existingId = await College.findOne({ collegeId });
    if (existingId) {
      return res.status(400).json({
        success: false,
        message: `College with ID '${collegeId}' already exists.`,
      });
    }

    // Check duplicate Name
    const existingName = await College.findOne({ collegeName });
    if (existingName) {
      return res.status(400).json({
        success: false,
        message: `College with Name '${collegeName}' already exists.`,
      });
    }

    const newCollege = new College({
      collegeId,
      collegeName,
    });

    await newCollege.save();

    return res.status(201).json({
      success: true,
      message: 'College created successfully.',
      college: newCollege,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Fetch all colleges.
 */
const getColleges = async (req, res, next) => {
  try {
    const colleges = await College.find({}).sort({ collegeName: 1 });
    return res.status(200).json({
      success: true,
      colleges,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin updates a college.
 */
const updateCollege = async (req, res, next) => {
  try {
    const { id } = req.params;
    const parseResult = collegeSchemaVal.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: parseResult.error.flatten().fieldErrors,
      });
    }

    const { collegeId, collegeName } = parseResult.data;

    const college = await College.findById(id);
    if (!college) {
      return res.status(404).json({
        success: false,
        message: 'College not found.',
      });
    }

    // Check duplicate ID
    if (collegeId !== college.collegeId) {
      const dupId = await College.findOne({ collegeId });
      if (dupId) {
        return res.status(400).json({
          success: false,
          message: `College with ID '${collegeId}' already exists.`,
        });
      }
    }

    // Check duplicate Name
    const oldName = college.collegeName;
    if (collegeName !== oldName) {
      const dupName = await College.findOne({ collegeName });
      if (dupName) {
        return res.status(400).json({
          success: false,
          message: `College with Name '${collegeName}' already exists.`,
        });
      }
    }

    college.collegeId = collegeId;
    college.collegeName = collegeName;
    await college.save();

    // Propagate changes to courses and users
    if (collegeName !== oldName) {
      await Course.updateMany({ college: oldName }, { college: collegeName });
      await User.updateMany({ college: oldName }, { college: collegeName });
    }

    return res.status(200).json({
      success: true,
      message: 'College updated successfully.',
      college,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin deletes a college.
 */
const deleteCollege = async (req, res, next) => {
  try {
    const { id } = req.params;
    const college = await College.findById(id);
    if (!college) {
      return res.status(404).json({
        success: false,
        message: 'College not found.',
      });
    }

    // Prevent deletion if courses exist
    const coursesCount = await Course.countDocuments({ college: college.collegeName });
    if (coursesCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete college '${college.collegeName}' as there are active courses registered under it.`,
      });
    }

    // Prevent deletion if users exist
    const usersCount = await User.countDocuments({ college: college.collegeName });
    if (usersCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete college '${college.collegeName}' as there are active users registered under it.`,
      });
    }

    await College.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'College deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCollege,
  getColleges,
  updateCollege,
  deleteCollege,
};
