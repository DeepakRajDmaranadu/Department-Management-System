const Course = require('../models/Course');
const User = require('../models/User');
const College = require('../models/College');
const { z } = require('zod');

const courseCreateSchema = z.object({
  courseId: z.string().trim().min(1, 'Course ID is required').toUpperCase(),
  courseName: z.string().trim().min(1, 'Course Name is required'),
  college: z.string().trim().min(1, 'College is required'),
});

/**
 * Admin creates a new course.
 */
const createCourse = async (req, res, next) => {
  try {
    const parseResult = courseCreateSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: parseResult.error.flatten().fieldErrors,
      });
    }

    const { courseId, courseName, college } = parseResult.data;

    // Verify college exists
    const collegeExists = await College.findOne({ collegeName: college });
    if (!collegeExists) {
      return res.status(400).json({
        success: false,
        message: `Invalid College: '${college}' is not a registered college.`,
      });
    }

    // Check if courseId exists
    const existingId = await Course.findOne({ courseId });
    if (existingId) {
      return res.status(400).json({
        success: false,
        message: `Course with ID '${courseId}' already exists.`,
      });
    }

    // Check if courseName exists
    const existingName = await Course.findOne({ courseName });
    if (existingName) {
      return res.status(400).json({
        success: false,
        message: `Course with Name '${courseName}' already exists.`,
      });
    }

    const newCourse = new Course({
      courseId,
      courseName,
      college,
    });

    await newCourse.save();

    return res.status(201).json({
      success: true,
      message: 'Course created successfully.',
      course: newCourse,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Fetch all courses.
 */
const getCourses = async (req, res, next) => {
  try {
    const courses = await Course.find({}).sort({ courseName: 1 });
    return res.status(200).json({
      success: true,
      courses,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin updates a course.
 */
const updateCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const parseResult = courseCreateSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: parseResult.error.flatten().fieldErrors,
      });
    }

    const { courseId, courseName, college } = parseResult.data;

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found.',
      });
    }

    // Verify college exists
    const collegeExists = await College.findOne({ collegeName: college });
    if (!collegeExists) {
      return res.status(400).json({
        success: false,
        message: `Invalid College: '${college}' is not a registered college.`,
      });
    }

    // Check duplicate ID
    if (courseId !== course.courseId) {
      const dupId = await Course.findOne({ courseId });
      if (dupId) {
        return res.status(400).json({
          success: false,
          message: `Course with ID '${courseId}' already exists.`,
        });
      }
    }

    // Check duplicate Name
    const oldCourseName = course.courseName;
    if (courseName !== oldCourseName) {
      const dupName = await Course.findOne({ courseName });
      if (dupName) {
        return res.status(400).json({
          success: false,
          message: `Course with Name '${courseName}' already exists.`,
        });
      }
    }

    course.courseId = courseId;
    course.courseName = courseName;
    course.college = college;
    await course.save();

    // Propagate courseName change to users' department field
    if (courseName !== oldCourseName) {
      await User.updateMany(
        { department: oldCourseName },
        { department: courseName }
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Course updated successfully.',
      course,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin deletes a course.
 */
const deleteCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found.',
      });
    }

    // Check if users are assigned to this course
    const usersInCourse = await User.countDocuments({ department: course.courseName });
    if (usersInCourse > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete course '${course.courseName}' as there are registered users assigned to this department.`,
      });
    }

    await Course.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Course deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCourse,
  getCourses,
  updateCourse,
  deleteCourse,
};
