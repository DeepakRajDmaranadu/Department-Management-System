import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import api from "@/services/api";
import {
  Users,
  Activity,
  Server,
  FileSpreadsheet,
  PlusCircle,
  AlertCircle,
  CheckCircle,
  BookOpen,
  Edit,
  Trash2,
  Building2,
  Search,
  ChevronDown,
  ChevronUp,
  Lock,
  Clock,
  CalendarCheck,
} from "lucide-react";

const adminCreateUserSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required"),
  employeeId: z.string().trim().min(1, "Employee ID is required").toUpperCase(),
  email: z.string().trim().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      "Must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character"
    ),
  college: z.string().trim().optional(),
  department: z.string().trim().optional(),
  role: z.enum(["Principal", "HOD", "Office Assistant", "Faculty"]),
});

const adminCreateCourseSchema = z.object({
  courseId: z.string().trim().min(1, "Course ID is required").toUpperCase(),
  courseName: z.string().trim().min(1, "Course Name is required"),
  college: z.string().trim().min(1, "College is required"),
});

const adminCreateCollegeSchema = z.object({
  collegeId: z.string().trim().min(1, "College ID is required").toUpperCase(),
  collegeName: z.string().trim().min(1, "College Name is required"),
});

export const DashboardHome = () => {
  const { user } = useAuth();
  const location = useLocation();
  const toast = useToast();
  
  // State
  const [colleges, setColleges] = useState([]);
  const [courses, setCourses] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState("staff");
  const [formTab, setFormTab] = useState("register");
  
  const [staffSearchQuery, setStaffSearchQuery] = useState("");
  const [courseSearchQuery, setCourseSearchQuery] = useState("");
  const [collegeSearchQuery, setCollegeSearchQuery] = useState("");
  
  const successMsg = null;
  const setSuccessMsg = (msg) => { if (msg) toast.success(msg); };
  const errorMsg = null;
  const setErrorMsg = (msg) => { if (msg) toast.error(msg); };
  const [isSubmitting, setIsSubmitting] = useState(false);

  const courseSuccess = null;
  const setCourseSuccess = (msg) => { if (msg) toast.success(msg); };
  const courseError = null;
  const setCourseError = (msg) => { if (msg) toast.error(msg); };
  const [isCourseSubmitting, setIsCourseSubmitting] = useState(false);

  const collegeSuccess = null;
  const setCollegeSuccess = (msg) => { if (msg) toast.success(msg); };
  const collegeError = null;
  const setCollegeError = (msg) => { if (msg) toast.error(msg); };
  const [isCollegeSubmitting, setIsCollegeSubmitting] = useState(false);

  const [editingUser, setEditingUser] = useState(null);
  const [editingUserRole, setEditingUserRole] = useState("");
  const [editingUserCollege, setEditingUserCollege] = useState("");
  const [editingCourse, setEditingCourse] = useState(null);
  const [editingCollege, setEditingCollege] = useState(null);
  
  const [deletingUser, setDeletingUser] = useState(null);
  const [deletingCourse, setDeletingCourse] = useState(null);
  const [deletingCollege, setDeletingCollege] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // HOD Workspace State
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [students, setStudents] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [sections, setSections] = useState([]);
  const [allotments, setAllotments] = useState([]);
  
  // Subject Allocation workspace state
  const [subjects, setSubjects] = useState([]);
  const [subjectAllocations, setSubjectAllocations] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [newSubjectId, setNewSubjectId] = useState("");
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectType, setNewSubjectType] = useState("regular");
  const [selectedAllocSubjectId, setSelectedAllocSubjectId] = useState("");
  const [selectedAllocSectionId, setSelectedAllocSectionId] = useState("");
  const [selectedAllocFacultyId, setSelectedAllocFacultyId] = useState("");
  const allocSuccess = null;
  const setAllocSuccess = (msg) => { if (msg) toast.success(msg); };
  const allocError = null;
  const setAllocError = (msg) => { if (msg) toast.error(msg); };

  // HOD sub-tabs & form inputs
  const [batchTab, setBatchTab] = useState("students");
  const [newBatchId, setNewBatchId] = useState("");
  const [newBatchYears, setNewBatchYears] = useState("");
  const [newStudentId, setNewStudentId] = useState("");
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentEmail, setNewStudentEmail] = useState("");
  const [newStudentLanguage, setNewStudentLanguage] = useState("");
  const [batchLanguages, setBatchLanguages] = useState([]);
  const [isManualLanguage, setIsManualLanguage] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [csvPreview, setCsvPreview] = useState([]);
  const [newSemesterName, setNewSemesterName] = useState("");
  const [newSectionName, setNewSectionName] = useState("");
  const batchSuccess = null;
  const setBatchSuccess = (msg) => { if (msg) toast.success(msg); };
  const batchError = null;
  const setBatchError = (msg) => { if (msg) toast.error(msg); };
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [bulkSectionId, setBulkSectionId] = useState("");
  const [localAllotments, setLocalAllotments] = useState({});
  const [recentActivitiesOpen, setRecentActivitiesOpen] = useState(true);

  // Faculty Attendance states
  const [myAllocations, setMyAllocations] = useState([]);
  const [selectedFacultyCourse, setSelectedFacultyCourse] = useState("");
  const [selectedFacultySemesterId, setSelectedFacultySemesterId] = useState("");
  const [selectedFacultySectionId, setSelectedFacultySectionId] = useState("");
  const [selectedFacultySubjectId, setSelectedFacultySubjectId] = useState("");
  const [selectedFacultyAllocId, setSelectedFacultyAllocId] = useState("");
  const [selectedFacultyDate, setSelectedFacultyDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceStudents, setAttendanceStudents] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const attendanceSuccess = null;
  const setAttendanceSuccess = (msg) => { if (msg) toast.success(msg); };
  const attendanceError = null;
  const setAttendanceError = (msg) => { if (msg) toast.error(msg); };
  const [attendanceIsMarked, setAttendanceIsMarked] = useState(false);
  const [attendanceEditable, setAttendanceEditable] = useState(true);
  const [attendanceMinsRemaining, setAttendanceMinsRemaining] = useState(null);
  const [attendanceSubmitting, setAttendanceSubmitting] = useState(false);
  const [facultyTab, setFacultyTab] = useState("mark");
  const [consolidatedData, setConsolidatedData] = useState([]);
  const [consolidatedLoading, setConsolidatedLoading] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expandedHistoryLogId, setExpandedHistoryLogId] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [isCreateAssignmentOpen, setIsCreateAssignmentOpen] = useState(false);
  const [newAssignmentTitle, setNewAssignmentTitle] = useState("");
  const [newAssignmentDesc, setNewAssignmentDesc] = useState("");
  const [newAssignmentDueDate, setNewAssignmentDueDate] = useState("");
  const [isAssignmentSubmitting, setIsAssignmentSubmitting] = useState(false);
  const [facultyMarkSearch, setFacultyMarkSearch] = useState("");
  const [facultyConsolidatedSearch, setFacultyConsolidatedSearch] = useState("");
  const [facultyHistorySearch, setFacultyHistorySearch] = useState("");
  const [assignmentSearch, setAssignmentSearch] = useState("");
  const [assignmentSort, setAssignmentSort] = useState("dueDateAsc");
  const [assignmentFilter, setAssignmentFilter] = useState("all");
  const [submissionSearch, setSubmissionSearch] = useState("");
  const [submissionSort, setSubmissionSort] = useState("rollAsc");
  const [submissionFilterStatus, setSubmissionFilterStatus] = useState("all");
  const [submissionFilterLanguage, setSubmissionFilterLanguage] = useState("all");

  // HOD Consolidated Attendance states
  const [hodSelectedBatch, setHodSelectedBatch] = useState(null);
  const [hodSelectedSemester, setHodSelectedSemester] = useState(null);
  const [hodSelectedSection, setHodSelectedSection] = useState("");
  const [hodSelectedSubjectIds, setHodSelectedSubjectIds] = useState([]);
  const [hodConsolidatedData, setHodConsolidatedData] = useState(null);
  const [hodConsolidatedLoading, setHodConsolidatedLoading] = useState(false);
  const [hodSearchQuery, setHodSearchQuery] = useState("");
  const [hodSortCriteria, setHodSortCriteria] = useState("rollAsc");
  const [hodSemesters, setHodSemesters] = useState([]);
  const [hodSections, setHodSections] = useState([]);
  const [hodSubjects, setHodSubjects] = useState([]);
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);

  // Forms
  const {
    register: registerUser,
    handleSubmit: handleSubmitUser,
    reset: resetUser,
    watch: watchUser,
    formState: { errors: errorsUser },
  } = useForm({
    resolver: zodResolver(adminCreateUserSchema),
    defaultValues: {
      fullName: "",
      employeeId: "",
      email: "",
      password: "",
      college: "",
      department: "",
      role: "Principal",
    },
  });

  const watchedRole = watchUser("role");
  const watchedCollege = watchUser("college");

  const {
    register: registerCourse,
    handleSubmit: handleSubmitCourse,
    reset: resetCourse,
    formState: { errors: errorsCourse },
  } = useForm({
    resolver: zodResolver(adminCreateCourseSchema),
    defaultValues: {
      courseId: "",
      courseName: "",
      college: "",
    },
  });

  const {
    register: registerCollege,
    handleSubmit: handleSubmitCollege,
    reset: resetCollege,
    formState: { errors: errorsCollege },
  } = useForm({
    resolver: zodResolver(adminCreateCollegeSchema),
    defaultValues: {
      collegeId: "",
      collegeName: "",
    },
  });

  // Fetch Colleges
  const fetchColleges = async () => {
    try {
      const response = await api.get("/api/colleges");
      if (response.data.success) {
        setColleges(response.data.colleges);
      }
    } catch (err) {
      console.error("Failed to fetch colleges", err);
    }
  };

  // Fetch Courses
  const fetchCourses = async () => {
    try {
      const response = await api.get("/api/courses");
      if (response.data.success) {
        setCourses(response.data.courses);
      }
    } catch (err) {
      console.error("Failed to fetch courses", err);
    }
  };

  // Fetch Users (Admin Only)
  const fetchUsers = async () => {
    try {
      const response = await api.get("/api/users");
      if (response.data.success) {
        setUsers(response.data.users);
      }
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  };

  // HOD Workspace Fetch Functions
  const fetchBatches = async () => {
    try {
      const response = await api.get("/api/batches");
      if (response.data.success) {
        setBatches(response.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch batches", err);
    }
  };

  const fetchStudents = async (batchId) => {
    try {
      const response = await api.get(`/api/batches/${batchId}/students`);
      if (response.data.success) {
        setStudents(response.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch students", err);
    }
  };

  const fetchSemesters = async (batchId) => {
    try {
      const response = await api.get(`/api/batches/${batchId}/semesters`);
      if (response.data.success) {
        setSemesters(response.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch semesters", err);
    }
  };

  const fetchSections = async (semesterId) => {
    try {
      const response = await api.get(`/api/batches/semesters/${semesterId}/sections`);
      if (response.data.success) {
        setSections(response.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch sections", err);
    }
  };

  const fetchAllotments = async (semesterId) => {
    try {
      const response = await api.get(`/api/batches/semesters/${semesterId}/allotments`);
      if (response.data.success) {
        setAllotments(response.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch allotments", err);
    }
  };

  // Reactively populate local student section allotment state map
  useEffect(() => {
    const mapping = {};
    students.forEach((s) => {
      const allot = allotments.find((a) => a.student === s._id);
      mapping[s._id] = allot ? allot.section : "";
    });
    setLocalAllotments(mapping);
    setSelectedStudentIds([]);
  }, [students, allotments]);

  const fetchBatchLanguages = async (batchId) => {
    try {
      const response = await api.get(`/api/subjects/batches/${batchId}/language-subjects`);
      if (response.data.success) {
        setBatchLanguages(response.data.data);
        if (response.data.data.length > 0) {
          setNewStudentLanguage(response.data.data[0].subjectId);
          setIsManualLanguage(false);
        } else {
          setNewStudentLanguage("");
          setIsManualLanguage(true);
        }
      }
    } catch (err) {
      console.error("Failed to fetch batch language subjects:", err);
    }
  };

  // Reactively trigger updates when selecting a Batch or Semester
  useEffect(() => {
    if (selectedBatch) {
      fetchStudents(selectedBatch._id);
      fetchSemesters(selectedBatch._id);
      fetchBatchLanguages(selectedBatch._id);
      setSelectedSemester(null);
      setSections([]);
      setAllotments([]);
    }
  }, [selectedBatch]);

  const fetchSubjects = async (semesterId) => {
    try {
      const response = await api.get(`/api/subjects/semesters/${semesterId}`);
      if (response.data.success) {
        setSubjects(response.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch subjects", err);
    }
  };

  const fetchSubjectAllocations = async (semesterId) => {
    try {
      const response = await api.get(`/api/subjects/allocations/semesters/${semesterId}`);
      if (response.data.success) {
        setSubjectAllocations(response.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch subject allocations", err);
    }
  };

  const fetchFaculties = async () => {
    try {
      const response = await api.get("/api/subjects/faculty");
      if (response.data.success) {
        setFaculties(response.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch faculties", err);
    }
  };

  useEffect(() => {
    if (selectedSemester) {
      fetchSections(selectedSemester._id);
      fetchAllotments(selectedSemester._id);
      fetchSubjects(selectedSemester._id);
      fetchSubjectAllocations(selectedSemester._id);
      fetchFaculties();
      setSelectedAllocSubjectId("");
      setSelectedAllocSectionId("");
      setSelectedAllocFacultyId("");
    }
  }, [selectedSemester]);

  useEffect(() => {
    if (user) {
      // Clear active states on page navigation
      setSelectedBatch(null);
      setSelectedSemester(null);
      setStudents([]);
      setSemesters([]);
      setSections([]);
      setAllotments([]);
      setSubjects([]);
      setSubjectAllocations([]);
      setBatchLanguages([]);
      setBatchSuccess(null);
      setBatchError(null);
      setAllocSuccess(null);
      setAllocError(null);

      // Clear Faculty states
      setAttendanceStudents([]);
      setAttendanceLoading(false);
      setAttendanceSuccess(null);
      setAttendanceError(null);
      setAttendanceIsMarked(false);
      setAttendanceEditable(true);
      setAttendanceMinsRemaining(null);
      setSelectedFacultyCourse("");
      setSelectedFacultySemesterId("");
      setSelectedFacultySectionId("");
      setSelectedFacultySubjectId("");
      setSelectedFacultyAllocId("");
      setFacultyTab("mark");
      setConsolidatedData([]);
      setHistoryData([]);
      setExpandedHistoryLogId(null);
      setAssignments([]);
      setAssignmentsLoading(false);
      setSelectedAssignment(null);
      setIsCreateAssignmentOpen(false);
      setNewAssignmentTitle("");
      setNewAssignmentDesc("");
      setNewAssignmentDueDate("");
      setIsAssignmentSubmitting(false);
      setFacultyMarkSearch("");
      setFacultyConsolidatedSearch("");
      setFacultyHistorySearch("");
      setAssignmentSearch("");
      setAssignmentSort("dueDateAsc");
      setAssignmentFilter("all");
      setSubmissionSearch("");
      setSubmissionSort("rollAsc");
      setSubmissionFilterStatus("all");
      setSubmissionFilterLanguage("all");

      fetchColleges();
      fetchCourses();
      if (user.role === "Admin") {
        fetchUsers();
      }
      if (user.role === "HOD") {
        fetchBatches();
      }
      if (user.role === "Faculty") {
        fetchMyAllocations();
      }
    }
  }, [user, location.pathname]);

  if (!user) return null;

  // HOD Workspace UI Handlers
  const onCreateBatch = async (e) => {
    e.preventDefault();
    setBatchSuccess(null);
    setBatchError(null);
    if (!newBatchId.trim() || !newBatchYears.trim()) {
      setBatchError("Batch ID and Years are required");
      return;
    }
    try {
      const response = await api.post("/api/batches", {
        batchId: newBatchId,
        years: newBatchYears,
      });
      if (response.data.success) {
        setBatchSuccess("Batch created successfully");
        setNewBatchId("");
        setNewBatchYears("");
        fetchBatches();
      }
    } catch (err) {
      setBatchError(err.response?.data?.message || "Failed to create batch");
    }
  };

  const onDeleteBatch = async (id) => {
    if (!window.confirm("Are you sure you want to delete this batch? All students, semesters, sections, and allotments will be permanently deleted.")) {
      return;
    }
    setBatchSuccess(null);
    setBatchError(null);
    try {
      const response = await api.delete(`/api/batches/${id}`);
      if (response.data.success) {
        setBatchSuccess("Batch deleted successfully");
        if (selectedBatch?._id === id) {
          setSelectedBatch(null);
          setSelectedSemester(null);
        }
        fetchBatches();
      }
    } catch (err) {
      setBatchError(err.response?.data?.message || "Failed to delete batch");
    }
  };

  const onAddStudent = async (e) => {
    e.preventDefault();
    setBatchSuccess(null);
    setBatchError(null);
    if (!newStudentId.trim() || !newStudentName.trim() || !newStudentEmail.trim() || !newStudentLanguage.trim()) {
      setBatchError("All student fields are required including language Subject ID selection/entry");
      return;
    }
    try {
      const response = await api.post(`/api/batches/${selectedBatch._id}/students`, {
        studentId: newStudentId,
        fullName: newStudentName,
        email: newStudentEmail,
        language: newStudentLanguage,
      });
      if (response.data.success) {
        setBatchSuccess("Student registered successfully");
        setNewStudentId("");
        setNewStudentName("");
        setNewStudentEmail("");
        // Refresh language list and reset newStudentLanguage
        fetchBatchLanguages(selectedBatch._id);
        fetchStudents(selectedBatch._id);
      }
    } catch (err) {
      setBatchError(err.response?.data?.message || "Failed to add student");
    }
  };

  const parseAndSetCsv = (text) => {
    setBatchError(null);
    setBatchSuccess(null);
    if (!text || !text.trim()) {
      setBatchError("Please provide CSV data.");
      return;
    }
    const lines = text.split("\n");
    const parsed = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const parts = line.split(",").map(p => p.trim().replace(/^["']|["']$/g, ""));
      if (parts.length < 4) {
        setBatchError(`Row ${i + 1} has insufficient columns. Required format: ID, Name, Email, Language`);
        return;
      }
      
      const [studentId, fullName, email, language] = parts;
      if (!studentId || !fullName || !email || !language) {
        setBatchError(`Row ${i + 1} has empty values.`);
        return;
      }

      const cleanLang = language.toUpperCase().trim();
      
      // Skip header row if present
      if (i === 0 && (studentId.toLowerCase().includes("id") || fullName.toLowerCase().includes("name") || email.toLowerCase().includes("email") || language.toLowerCase().includes("lang"))) {
        continue;
      }

      // Enforce that language subject exists for this batch
      if (batchLanguages.length === 0) {
        setBatchError("Please register language subjects first under Subject Allocation before uploading student rosters.");
        return;
      }
      const validLangIds = batchLanguages.map(sub => sub.subjectId.toUpperCase());
      if (!validLangIds.includes(cleanLang)) {
        setBatchError(`Row ${i + 1} has invalid language Subject ID "${language}". It must match a registered language subject ID for this batch: ${validLangIds.join(", ")}`);
        return;
      }
      
      parsed.push({ studentId, fullName, email, language: cleanLang });
    }
    setCsvPreview(parsed);
    setBatchSuccess(`Parsed ${parsed.length} rows successfully. Please click upload bulk to save.`);
  };

  const handleParseCsv = () => {
    parseAndSetCsv(csvText);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      setCsvText(text);
      parseAndSetCsv(text);
    };
    reader.readAsText(file);
  };

  const downloadCsvTemplate = () => {
    const lang1 = batchLanguages.length > 0 ? batchLanguages[0].subjectId : "KAN101";
    const lang2 = batchLanguages.length > 1 ? batchLanguages[1].subjectId : "HIN101";
    const lang3 = batchLanguages.length > 2 ? batchLanguages[2].subjectId : "MAL101";
    const csvContent = `data:text/csv;charset=utf-8,studentId,fullName,email,language\nSTU202301,John Doe,john@example.com,${lang1}\nSTU202302,Jane Smith,jane@example.com,${lang2}\nSTU202303,David Miller,david@example.com,${lang3}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "student_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const onUploadBulkStudents = async () => {
    setBatchSuccess(null);
    setBatchError(null);
    if (csvPreview.length === 0) {
      setBatchError("No parsed student data to upload.");
      return;
    }
    try {
      const response = await api.post(`/api/batches/${selectedBatch._id}/students/bulk`, {
        students: csvPreview,
      });
      if (response.data.success) {
        setBatchSuccess(response.data.message || "Bulk upload completed successfully");
        setCsvText("");
        setCsvPreview([]);
        fetchStudents(selectedBatch._id);
      }
    } catch (err) {
      setBatchError(err.response?.data?.message || "Bulk upload failed");
    }
  };

  const onCreateSemester = async (e) => {
    e.preventDefault();
    setBatchSuccess(null);
    setBatchError(null);
    if (!newSemesterName.trim()) {
      setBatchError("Semester name is required");
      return;
    }
    try {
      const response = await api.post(`/api/batches/${selectedBatch._id}/semesters`, {
        name: newSemesterName,
      });
      if (response.data.success) {
        setBatchSuccess("Semester created successfully");
        setNewSemesterName("");
        fetchSemesters(selectedBatch._id);
      }
    } catch (err) {
      setBatchError(err.response?.data?.message || "Failed to create semester");
    }
  };

  const onCreateSection = async (e) => {
    e.preventDefault();
    setBatchSuccess(null);
    setBatchError(null);
    if (!newSectionName.trim()) {
      setBatchError("Section name is required");
      return;
    }
    try {
      const response = await api.post(`/api/batches/semesters/${selectedSemester._id}/sections`, {
        name: newSectionName,
      });
      if (response.data.success) {
        setBatchSuccess("Section created successfully");
        setNewSectionName("");
        fetchSections(selectedSemester._id);
      }
    } catch (err) {
      setBatchError(err.response?.data?.message || "Failed to create section");
    }
  };

  const onCreateSubject = async (e) => {
    e.preventDefault();
    setAllocSuccess(null);
    setAllocError(null);
    if (!newSubjectId.trim() || !newSubjectName.trim()) {
      setAllocError("Subject ID and Name are required");
      return;
    }
    try {
      const response = await api.post("/api/subjects", {
        subjectId: newSubjectId,
        name: newSubjectName,
        semesterId: selectedSemester._id,
        subjectType: newSubjectType,
      });
      if (response.data.success) {
        setAllocSuccess("Subject created successfully");
        setNewSubjectId("");
        setNewSubjectName("");
        setNewSubjectType("regular");
        fetchSubjects(selectedSemester._id);
      }
    } catch (err) {
      setAllocError(err.response?.data?.message || "Failed to create subject");
    }
  };

  const onDeleteSubject = async (subjectId) => {
    setAllocSuccess(null);
    setAllocError(null);
    try {
      const response = await api.delete(`/api/subjects/${subjectId}`);
      if (response.data.success) {
        setAllocSuccess("Subject deleted successfully");
        fetchSubjects(selectedSemester._id);
        fetchSubjectAllocations(selectedSemester._id);
      }
    } catch (err) {
      setAllocError(err.response?.data?.message || "Failed to delete subject");
    }
  };

  const onCreateSubjectAllocation = async (e) => {
    e.preventDefault();
    setAllocSuccess(null);
    setAllocError(null);
    if (!selectedAllocSubjectId || !selectedAllocFacultyId) {
      setAllocError("Subject and Faculty selection are required");
      return;
    }
    try {
      const response = await api.post("/api/subjects/allocations", {
        subjectId: selectedAllocSubjectId,
        semesterId: selectedSemester._id,
        sectionId: selectedAllocSectionId || null,
        facultyId: selectedAllocFacultyId,
      });
      if (response.data.success) {
        setAllocSuccess("Subject allocated to faculty successfully");
        setSelectedAllocSubjectId("");
        setSelectedAllocSectionId("");
        setSelectedAllocFacultyId("");
        fetchSubjectAllocations(selectedSemester._id);
      }
    } catch (err) {
      setAllocError(err.response?.data?.message || "Failed to allocate subject");
    }
  };

  const onDeleteSubjectAllocation = async (allocationId) => {
    setAllocSuccess(null);
    setAllocError(null);
    try {
      const response = await api.delete(`/api/subjects/allocations/${allocationId}`);
      if (response.data.success) {
        setAllocSuccess("Allocation deleted successfully");
        fetchSubjectAllocations(selectedSemester._id);
      }
    } catch (err) {
      setAllocError(err.response?.data?.message || "Failed to delete allocation");
    }
  };

  const onSaveAllotments = async (updatedAllotments) => {
    setBatchSuccess(null);
    setBatchError(null);
    try {
      const response = await api.post(`/api/batches/semesters/${selectedSemester._id}/allotments`, {
        allotments: updatedAllotments,
      });
      if (response.data.success) {
        setBatchSuccess("Student allotments updated successfully");
        fetchAllotments(selectedSemester._id);
      }
    } catch (err) {
      setBatchError(err.response?.data?.message || "Failed to save student allotments");
    }
  };

  // Faculty Dashboard handlers
  const fetchMyAllocations = async () => {
    try {
      const response = await api.get("/api/attendance/my-allocations");
      if (response.data.success) {
        setMyAllocations(response.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch my allocations", err);
    }
  };

  const fetchAttendanceStudents = async (allocId, dateVal) => {
    if (!allocId || !dateVal) return;
    setAttendanceSuccess(null);
    setAttendanceError(null);
    setAttendanceLoading(true);
    try {
      const response = await api.get(`/api/attendance/students?allocationId=${allocId}&date=${dateVal}`);
      if (response.data.success) {
        setAttendanceStudents(response.data.data);
        setAttendanceIsMarked(response.data.isMarked);
        setAttendanceEditable(response.data.editable !== false);
        setAttendanceMinsRemaining(response.data.minsRemaining ?? null);
      }
    } catch (err) {
      console.error("Failed to fetch students for attendance", err);
      setAttendanceError(err.response?.data?.message || "Failed to load students roster");
    } finally {
      setAttendanceLoading(false);
    }
  };

  const onSubmitAttendance = async (e) => {
    e.preventDefault();
    if (!selectedFacultyAllocId || !selectedFacultyDate) {
      setAttendanceError("Subject allocation and date are required");
      return;
    }
    setAttendanceSuccess(null);
    setAttendanceError(null);
    setAttendanceSubmitting(true);
    try {
      const records = attendanceStudents.map(student => ({
        studentId: student._id,
        status: student.status,
      }));

      const response = await api.post("/api/attendance", {
        allocationId: selectedFacultyAllocId,
        date: selectedFacultyDate,
        records,
      });

      if (response.data.success) {
        setAttendanceSuccess(response.data.message || "Attendance recorded successfully!");
        setAttendanceIsMarked(true);
        fetchAttendanceStudents(selectedFacultyAllocId, selectedFacultyDate);
      }
    } catch (err) {
      console.error("Failed to submit attendance", err);
      setAttendanceError(err.response?.data?.message || "Failed to submit attendance");
    } finally {
      setAttendanceSubmitting(false);
    }
  };

  const fetchConsolidatedAttendance = async (allocId) => {
    if (!allocId) return;
    setConsolidatedLoading(true);
    setAttendanceError(null);
    try {
      const response = await api.get(`/api/attendance/consolidated?allocationId=${allocId}`);
      if (response.data.success) {
        setConsolidatedData(response.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch consolidated attendance", err);
      setAttendanceError(err.response?.data?.message || "Failed to load consolidated data");
    } finally {
      setConsolidatedLoading(false);
    }
  };

  const fetchAttendanceHistory = async (allocId) => {
    if (!allocId) return;
    setHistoryLoading(true);
    setAttendanceError(null);
    try {
      const response = await api.get(`/api/attendance/history?allocationId=${allocId}`);
      if (response.data.success) {
        setHistoryData(response.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch attendance history", err);
      setAttendanceError(err.response?.data?.message || "Failed to load history data");
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchAssignments = async (allocId) => {
    if (!allocId) return;
    setAssignmentsLoading(true);
    try {
      const response = await api.get(`/api/assignments?allocationId=${allocId}`);
      if (response.data.success) {
        setAssignments(response.data.data);
        if (selectedAssignment) {
          const freshCopy = response.data.data.find(a => a._id === selectedAssignment._id);
          if (freshCopy) {
            setSelectedAssignment(freshCopy);
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch assignments", err);
      toast.error(err.response?.data?.message || "Failed to load assignments");
    } finally {
      setAssignmentsLoading(false);
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!newAssignmentTitle || !newAssignmentDueDate || !selectedFacultyAllocId) {
      toast.error("Title, due date, and allocation are required");
      return;
    }
    setIsAssignmentSubmitting(true);
    try {
      const response = await api.post("/api/assignments", {
        title: newAssignmentTitle,
        description: newAssignmentDesc,
        dueDate: newAssignmentDueDate,
        allocationId: selectedFacultyAllocId,
      });
      if (response.data.success) {
        toast.success("Assignment created successfully");
        setNewAssignmentTitle("");
        setNewAssignmentDesc("");
        setNewAssignmentDueDate("");
        setIsCreateAssignmentOpen(false);
        fetchAssignments(selectedFacultyAllocId);
      }
    } catch (err) {
      console.error("Failed to create assignment", err);
      toast.error(err.response?.data?.message || "Failed to create assignment");
    } finally {
      setIsAssignmentSubmitting(false);
    }
  };

  const handleToggleSubmission = async (assignment, studentId, currentStatus) => {
    const updatedStatus = currentStatus === 'submitted' ? 'pending' : 'submitted';
    const updatedSubmissions = assignment.submissions.map(sub => {
      const sId = sub.student._id || sub.student;
      if (sId.toString() === studentId.toString()) {
        return { studentId, status: updatedStatus };
      }
      return { studentId: sId, status: sub.status };
    });

    try {
      const response = await api.put(`/api/assignments/${assignment._id}`, {
        submissions: updatedSubmissions,
      });
      if (response.data.success) {
        toast.success("Submission status updated");
        fetchAssignments(selectedFacultyAllocId);
      }
    } catch (err) {
      console.error("Failed to update submission status", err);
      toast.error(err.response?.data?.message || "Failed to update submission status");
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (!window.confirm("Are you sure you want to delete this assignment?")) return;
    try {
      const response = await api.delete(`/api/assignments/${assignmentId}`);
      if (response.data.success) {
        toast.success("Assignment deleted successfully");
        fetchAssignments(selectedFacultyAllocId);
      }
    } catch (err) {
      console.error("Failed to delete assignment", err);
      toast.error(err.response?.data?.message || "Failed to delete assignment");
    }
  };

  const downloadAssignmentExcel = (assignment) => {
    const allocation = myAllocations.find(a => a._id === selectedFacultyAllocId);
    const subjectCode = allocation?.subject?.subjectId || "Code";
    const subjectName = allocation?.subject?.name || "Subject";
    const semesterName = allocation?.semester?.name || "Semester";

    let html = `
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; }
    table { border-collapse: collapse; width: 100%; font-family: 'Segoe UI', Arial, sans-serif; }
    th, td { border: 1px solid #000; padding: 10px 14px; font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; text-align: left; }
    th { background-color: #f2f2f2; font-weight: bold; }
    .center { text-align: center; }
    .title { font-size: 18px; font-weight: bold; font-family: 'Segoe UI', Arial, sans-serif; margin-bottom: 5px; }
    .subtitle { font-size: 13px; font-family: 'Segoe UI', Arial, sans-serif; color: #555; margin-bottom: 15px; }
  </style>
</head>
<body>
  <div class="title">Assignment Submission Report: ${assignment.title}</div>
  <div class="subtitle">
    Subject: ${subjectName} (${subjectCode}) | Semester: ${semesterName} | Due Date: ${new Date(assignment.dueDate).toLocaleDateString()}
  </div>
  <table>
    <thead>
      <tr>
        <th>Roll Number</th>
        <th>Student Name</th>
        <th>Language</th>
        <th class="center">Submission Status</th>
      </tr>
    </thead>
    <tbody>`;

    assignment.submissions.forEach(sub => {
      const student = sub.student || {};
      html += `
      <tr>
        <td>${student.studentId || 'N/A'}</td>
        <td>${student.fullName || 'Unknown'}</td>
        <td style="text-transform: uppercase;">${student.language || 'N/A'}</td>
        <td class="center" style="font-weight: bold; color: ${sub.status === 'submitted' ? 'green' : 'red'};">
          ${sub.status === 'submitted' ? '1' : '0'}
        </td>
      </tr>`;
    });

    html += `
    </tbody>
  </table>
</body>
</html>`;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `assignment_submissions_${subjectCode}_${assignment.title.toLowerCase().replace(/\s+/g, '_')}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAllAssignmentsExcel = () => {
    if (assignments.length === 0) {
      toast.error("No assignments found to export");
      return;
    }

    const allocation = myAllocations.find(a => a._id === selectedFacultyAllocId);
    const subjectCode = allocation?.subject?.subjectId || "Code";
    const subjectName = allocation?.subject?.name || "Subject";
    const semesterName = allocation?.semester?.name || "Semester";

    const studentMap = {};
    assignments.forEach(assign => {
      assign.submissions.forEach(sub => {
        const student = sub.student || {};
        if (student._id && !studentMap[student._id]) {
          studentMap[student._id] = {
            _id: student._id,
            studentId: student.studentId || 'N/A',
            fullName: student.fullName || 'Unknown',
            language: student.language || 'N/A',
            submissions: {}
          };
        }
        if (student._id) {
          studentMap[student._id].submissions[assign._id] = sub.status === 'submitted' ? 1 : 0;
        }
      });
    });

    const studentsList = Object.values(studentMap).sort((a, b) => a.studentId.localeCompare(b.studentId));

    let html = `
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; }
    table { border-collapse: collapse; width: 100%; font-family: 'Segoe UI', Arial, sans-serif; }
    th, td { border: 1px solid #000; padding: 10px 14px; font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; text-align: left; }
    th { background-color: #f2f2f2; font-weight: bold; }
    .center { text-align: center; }
    .title { font-size: 18px; font-weight: bold; font-family: 'Segoe UI', Arial, sans-serif; margin-bottom: 5px; }
    .subtitle { font-size: 13px; font-family: 'Segoe UI', Arial, sans-serif; color: #555; margin-bottom: 15px; }
  </style>
</head>
<body>
  <div class="title">Consolidated Assignment Submission Report</div>
  <div class="subtitle">
    Subject: ${subjectName} (${subjectCode}) | Semester: ${semesterName} | Total Assignments: ${assignments.length}
  </div>
  <table>
    <thead>
      <tr>
        <th>Roll Number</th>
        <th>Student Name</th>
        <th>Language</th>`;

    const sortedAssignments = [...assignments].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    sortedAssignments.forEach(assign => {
      html += `<th class="center">${assign.title}</th>`;
    });

    html += `
      </tr>
    </thead>
    <tbody>`;

    studentsList.forEach(student => {
      html += `
      <tr>
        <td>${student.studentId}</td>
        <td>${student.fullName}</td>
        <td style="text-transform: uppercase;">${student.language}</td>`;

      sortedAssignments.forEach(assign => {
        const val = student.submissions[assign._id] !== undefined ? student.submissions[assign._id] : 0;
        html += `
        <td class="center" style="font-weight: bold; color: ${val === 1 ? 'green' : 'red'};">
          ${val}
        </td>`;
      });

      html += `
      </tr>`;
    });

    html += `
    </tbody>
  </table>
</body>
</html>`;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `consolidated_assignments_${subjectCode}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadDailyAttendanceExcel = async () => {
    setAttendanceSuccess(null);
    setAttendanceError(null);
    try {
      const allocation = myAllocations.find(a => a._id === selectedFacultyAllocId);
      const subjectName = allocation?.subject?.name || "Subject";
      const subjectCode = allocation?.subject?.subjectId || "Code";

      // 1. Fetch history logs to get all dates and student records
      const historyResponse = await api.get(`/api/attendance/history?allocationId=${selectedFacultyAllocId}`);
      if (!historyResponse.data.success) {
        throw new Error("Failed to load attendance history logs");
      }
      const historyList = historyResponse.data.data;

      // 2. Ensure students roster is loaded
      let studentsList = attendanceStudents;
      if (!studentsList || studentsList.length === 0) {
        const rosterResponse = await api.get(`/api/attendance/students?allocationId=${selectedFacultyAllocId}&date=${selectedFacultyDate}`);
        if (rosterResponse.data.success) {
          studentsList = rosterResponse.data.data;
        }
      }

      if (!studentsList || studentsList.length === 0) {
        setAttendanceError("No students enrolled in this batch to export.");
        return;
      }

      // 3. Extract all unique dates chronologically
      const dates = historyList
        .map(h => new Date(h.date).toISOString().split('T')[0])
        .sort((a, b) => new Date(a) - new Date(b));

      // 4. Build Excel HTML
      let html = `<html xmlns:o="urn:schemas-microsoft-excel:office:office" xmlns:x="urn:schemas-microsoft-excel:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; }
  table { border-collapse: collapse; width: 100%; font-family: 'Segoe UI', Arial, sans-serif; }
  th, td { border: 1px solid #000000; padding: 10px 14px; font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; text-align: left; }
  th { background-color: #f3f4f6; font-weight: bold; }
  .title { font-size: 18px; font-weight: bold; margin-bottom: 10px; font-family: 'Segoe UI', Arial, sans-serif; }
  .center { text-align: center; }
</style>
</head>
<body>
  <div class="title">DAILY ATTENDANCE REGISTER</div>
  <div class="title" style="font-size: 14px; font-weight: normal; color: #555;">Subject: ${subjectCode} - ${subjectName}</div>
  <br/>
  <table>
    <thead>
      <tr>
        <th>Roll Number</th>
        <th>Student Name</th>
        <th>Language Choice</th>`;

      dates.forEach(d => {
        html += `<th class="center">${d}</th>`;
      });

      html += `
      </tr>
    </thead>
    <tbody>`;

      studentsList.forEach(student => {
        html += `
      <tr>
        <td>${student.studentId}</td>
        <td>${student.fullName}</td>
        <td style="text-transform: uppercase;">${student.language || 'N/A'}</td>`;

        dates.forEach(d => {
          const dayRecord = historyList.find(h => new Date(h.date).toISOString().split('T')[0] === d);
          const studentRecord = dayRecord?.records?.find(r => r.studentId === student.studentId);
          const statusValue = studentRecord ? (studentRecord.status === 'present' ? 1 : 0) : 0;
          html += `<td class="center">${statusValue}</td>`;
        });

        html += `
      </tr>`;
      });

      html += `
    </tbody>
  </table>
</body>
</html>`;

      const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `daily_attendance_${subjectCode}_all_days.xls`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Failed to download daily register", err);
      setAttendanceError("Failed to generate Daily Register report.");
    }
  };

  const downloadConsolidatedAttendanceExcel = () => {
    if (!consolidatedData || consolidatedData.length === 0) return;
    const allocation = myAllocations.find(a => a._id === selectedFacultyAllocId);
    const subjectName = allocation?.subject?.name || "Subject";
    const subjectCode = allocation?.subject?.subjectId || "Code";

    let html = `<html xmlns:o="urn:schemas-microsoft-excel:office:office" xmlns:x="urn:schemas-microsoft-excel:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; }
  table { border-collapse: collapse; width: 100%; font-family: 'Segoe UI', Arial, sans-serif; }
  th, td { border: 1px solid #000000; padding: 10px 14px; font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; text-align: left; }
  th { background-color: #f3f4f6; font-weight: bold; }
  .title { font-size: 18px; font-weight: bold; margin-bottom: 10px; font-family: 'Segoe UI', Arial, sans-serif; }
  .center { text-align: center; }
  .right { text-align: right; }
</style>
</head>
<body>
  <div class="title">CONSOLIDATED ATTENDANCE REPORT</div>
  <div class="title" style="font-size: 14px; font-weight: normal; color: #555;">Subject: ${subjectCode} - ${subjectName}</div>
  <div class="title" style="font-size: 14px; font-weight: normal; color: #555;">Total Classes Conducted: ${consolidatedData[0]?.totalClasses || 0}</div>
  <br/>
  <table>
    <thead>
      <tr>
        <th>Roll Number</th>
        <th>Student Name</th>
        <th>Language Choice</th>
        <th class="center">Classes Attended</th>
        <th class="center">Total Classes</th>
        <th class="right">Attendance Percentage (%)</th>
      </tr>
    </thead>
    <tbody>`;

    consolidatedData.forEach(row => {
      html += `
      <tr>
        <td>${row.studentId}</td>
        <td>${row.fullName}</td>
        <td style="text-transform: uppercase;">${row.language || 'N/A'}</td>
        <td class="center">${row.presentCount}</td>
        <td class="center">${row.totalClasses}</td>
        <td class="right">${row.percentage}%</td>
      </tr>`;
    });

    html += `
    </tbody>
  </table>
</body>
</html>`;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `consolidated_attendance_${subjectCode}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    if (selectedFacultyAllocId) {
      if (window.location.pathname.endsWith("/assignments")) {
        fetchAssignments(selectedFacultyAllocId);
      } else {
        if (facultyTab === "mark") {
          fetchAttendanceStudents(selectedFacultyAllocId, selectedFacultyDate);
        } else if (facultyTab === "consolidated") {
          fetchConsolidatedAttendance(selectedFacultyAllocId);
        } else if (facultyTab === "history") {
          fetchAttendanceHistory(selectedFacultyAllocId);
        } else if (facultyTab === "assignments") {
          fetchAssignments(selectedFacultyAllocId);
        }
      }
    }
  }, [selectedFacultyAllocId, facultyTab, selectedFacultyDate, window.location.pathname]);

  const fetchHODSemesters = async (batchId) => {
    try {
      const response = await api.get(`/api/batches/${batchId}/semesters`);
      if (response.data.success) {
        setHodSemesters(response.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch HOD semesters", err);
    }
  };

  const fetchHODSections = async (semesterId) => {
    try {
      const response = await api.get(`/api/batches/semesters/${semesterId}/sections`);
      if (response.data.success) {
        setHodSections(response.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch HOD sections", err);
    }
  };

  const fetchHODSubjects = async (semesterId) => {
    try {
      const response = await api.get(`/api/subjects/semesters/${semesterId}`);
      if (response.data.success) {
        const fetched = response.data.data || [];
        setHodSubjects(fetched);
        
        // Default to checking all regular subjects + 'language' combined checkbox
        const regularIds = fetched.filter(s => s.subjectType !== 'language').map(s => s._id);
        setHodSelectedSubjectIds([...regularIds, "language"]);
      }
    } catch (err) {
      console.error("Failed to fetch HOD subjects", err);
    }
  };

  const fetchHODConsolidatedAttendance = async (semId, secId) => {
    if (!semId) return;
    setHodConsolidatedLoading(true);
    setHodConsolidatedData(null);
    try {
      const response = await api.get(`/api/attendance/hod/consolidated?semesterId=${semId}&sectionId=${secId || 'all'}&subjectId=all`);
      if (response.data.success) {
        setHodConsolidatedData(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch HOD consolidated attendance", err);
    } finally {
      setHodConsolidatedLoading(false);
    }
  };

  const getStudentOverallAttendance = (row) => {
    let sumPercentages = 0;
    let count = 0;

    const subjectsList = hodConsolidatedData?.subjects || [];
    
    subjectsList.forEach(sub => {
      const isSelected = sub.subjectType === 'language' 
        ? hodSelectedSubjectIds.includes("language")
        : hodSelectedSubjectIds.includes(sub._id);

      if (!isSelected) return;

      const subAtt = row.attendance[sub._id];
      if (subAtt && subAtt.isEnrolled && subAtt.totalClasses > 0 && typeof subAtt.percentage === 'number') {
        sumPercentages += subAtt.percentage;
        count++;
      }
    });

    if (count === 0) return 'N/A';
    return parseFloat((sumPercentages / count).toFixed(2));
  };

  const downloadHODConsolidatedExcel = () => {
    if (!hodConsolidatedData || !hodConsolidatedData.data || hodConsolidatedData.data.length === 0) return;

    const subjectsList = hodConsolidatedData.subjects || [];
    const regularSubjects = subjectsList.filter(s => s.subjectType !== 'language');
    const languageSubjects = subjectsList.filter(s => s.subjectType === 'language');

    const showLanguage = hodSelectedSubjectIds.includes("language") && languageSubjects.length > 0;
    const selectedRegularSubjects = regularSubjects.filter(s => hodSelectedSubjectIds.includes(s._id));

    let html = `<html xmlns:o="urn:schemas-microsoft-excel:office:office" xmlns:x="urn:schemas-microsoft-excel:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; }
  table { border-collapse: collapse; width: 100%; font-family: 'Segoe UI', Arial, sans-serif; }
  th, td { border: 1px solid #000000; padding: 10px 14px; font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; text-align: left; }
  th { background-color: #f3f4f6; font-weight: bold; }
  .title { font-size: 18px; font-weight: bold; margin-bottom: 10px; font-family: 'Segoe UI', Arial, sans-serif; }
  .center { text-align: center; }
  .right { text-align: right; }
</style>
</head>
<body>
  <div class="title">CONSOLIDATED ATTENDANCE REPORT</div>
  <br/>
  <table>
    <thead>
      <tr>
        <th rowspan="2" class="center">Sl. No.</th>
        <th rowspan="2">Register Number</th>
        <th rowspan="2">Student Name</th>
        <th rowspan="2" class="center">Language Choice</th>`;

    selectedRegularSubjects.forEach(sub => {
      html += `<th colspan="3" class="center">${sub.subjectId}</th>`;
    });

    if (showLanguage) {
      html += `<th colspan="3" class="center">Language</th>`;
    }

    html += `<th rowspan="2" class="right">Overall Attendance (%)</th>
      </tr>
      <tr>`;

    selectedRegularSubjects.forEach(() => {
      html += `<th class="center">CT</th><th class="center">AT</th><th class="center">%</th>`;
    });

    if (showLanguage) {
      html += `<th class="center">CT</th><th class="center">AT</th><th class="center">%</th>`;
    }

    html += `
      </tr>
    </thead>
    <tbody>`;

    getFilteredAndSortedHODData().forEach((row, idx) => {
      html += `
      <tr>
        <td class="center">${idx + 1}</td>
        <td>${row.studentId}</td>
        <td>${row.fullName}</td>
        <td class="center" style="text-transform: uppercase;">${row.language || 'N/A'}</td>`;

      selectedRegularSubjects.forEach(sub => {
        const subAtt = row.attendance[sub._id];
        if (!subAtt) {
          html += `<td class="center">-</td><td class="center">-</td><td class="center">-</td>`;
        } else if (subAtt.totalClasses === 0) {
          html += `<td class="center">0</td><td class="center">0</td><td class="center">-</td>`;
        } else {
          html += `<td class="center">${subAtt.totalClasses}</td><td class="center">${subAtt.presentCount}</td><td class="center">${subAtt.percentage}%</td>`;
        }
      });

      if (showLanguage) {
        const studentLangSub = languageSubjects.find(sub => {
          const subAtt = row.attendance[sub._id];
          return subAtt && subAtt.isEnrolled;
        });

        if (studentLangSub) {
          const subAtt = row.attendance[studentLangSub._id];
          if (!subAtt || subAtt.totalClasses === 0) {
            html += `<td class="center">0</td><td class="center">0</td><td class="center">-</td>`;
          } else {
            html += `<td class="center">${subAtt.totalClasses}</td><td class="center">${subAtt.presentCount}</td><td class="center">${subAtt.percentage}%</td>`;
          }
        } else {
          html += `<td class="center">N/A</td><td class="center">N/A</td><td class="center">N/A</td>`;
        }
      }

      const overallPct = getStudentOverallAttendance(row);
      const overallStr = overallPct === 'N/A' ? '-' : `${overallPct}%`;
      html += `<td class="right">${overallStr}</td>
      </tr>`;
    });

    html += `
    </tbody>
  </table>
</body>
</html>`;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `consolidated_attendance_report.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFilteredAndSortedHODData = () => {
    if (!hodConsolidatedData || !hodConsolidatedData.data) return [];
    let list = [...hodConsolidatedData.data];

    if (hodSearchQuery.trim()) {
      const q = hodSearchQuery.toLowerCase();
      list = list.filter(item => 
        item.fullName.toLowerCase().includes(q) || 
        item.studentId.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      if (hodSortCriteria === "rollAsc") {
        return a.studentId.localeCompare(b.studentId);
      } else if (hodSortCriteria === "rollDesc") {
        return b.studentId.localeCompare(a.studentId);
      } else if (hodSortCriteria === "nameAsc") {
        return a.fullName.localeCompare(b.fullName);
      } else if (hodSortCriteria === "pctAsc") {
        const valA = getStudentOverallAttendance(a);
        const valB = getStudentOverallAttendance(b);
        const numA = valA === 'N/A' ? -1 : valA;
        const numB = valB === 'N/A' ? -1 : valB;
        return numA - numB;
      } else if (hodSortCriteria === "pctDesc") {
        const valA = getStudentOverallAttendance(a);
        const valB = getStudentOverallAttendance(b);
        const numA = valA === 'N/A' ? -1 : valA;
        const numB = valB === 'N/A' ? -1 : valB;
        return numB - numA;
      }
      return 0;
    });

    return list;
  };

  useEffect(() => {
    if (hodSelectedBatch) {
      fetchHODSemesters(hodSelectedBatch._id);
      setHodSelectedSemester(null);
      setHodSelectedSection("");
      setHodSelectedSubjectIds([]);
      setHodConsolidatedData(null);
    }
  }, [hodSelectedBatch]);

  useEffect(() => {
    if (hodSelectedSemester) {
      fetchHODSections(hodSelectedSemester._id);
      fetchHODSubjects(hodSelectedSemester._id);
      setHodSelectedSection("");
      setHodSelectedSubjectIds([]);
      setHodConsolidatedData(null);
    }
  }, [hodSelectedSemester]);

  useEffect(() => {
    if (hodSelectedSemester) {
      fetchHODConsolidatedAttendance(
        hodSelectedSemester._id,
        hodSelectedSection
      );
    }
  }, [hodSelectedSemester, hodSelectedSection]);

  const getStats = () => {
    const activeUsersCount = users.length > 0 ? users.filter((u) => u.status === "active").length : 1;
    const usersCreatedTodayCount = users.filter((u) => {
      if (!u.createdAt) return false;
      const today = new Date();
      const createdDate = new Date(u.createdAt);
      return (
        createdDate.getDate() === today.getDate() &&
        createdDate.getMonth() === today.getMonth() &&
        createdDate.getFullYear() === today.getFullYear()
      );
    }).length;

    const defaultStats = [
      { title: "System Uptime", value: "99.98%", change: "+0.02%", icon: <Server className="h-4 w-4 text-zinc-500" /> },
      { 
        title: "Active Users", 
        value: `${activeUsersCount}`, 
        change: usersCreatedTodayCount > 0 ? `+${usersCreatedTodayCount} added today` : "No new accounts today", 
        icon: <Users className="h-4 w-4 text-zinc-500" /> 
      },
      { title: "Session Health", value: "Optimal", change: "Latency < 12ms", icon: <Activity className="h-4 w-4 text-zinc-500" /> },
    ];

    switch (user.role) {
      case "Admin":
        return [
          { title: "Total Colleges", value: `${colleges.length}`, change: "Registered organizations", icon: <Building2 className="h-4 w-4 text-zinc-400" /> },
          { title: "Total Courses", value: `${courses.length}`, change: "Registered course pathways", icon: <BookOpen className="h-4 w-4 text-zinc-400" /> },
          ...defaultStats.slice(0, 2),
        ];
      case "HOD":
        return [
          { title: "Faculty Members", value: "8", change: `${user.department}`, icon: <Users className="h-4 w-4 text-zinc-400" /> },
          { title: "Active Courses", value: "12 Modules", change: "Semester 1", icon: <FileSpreadsheet className="h-4 w-4 text-zinc-400" /> },
          ...defaultStats.slice(0, 2),
        ];
      case "Faculty":
        return [
          { title: "My Classes", value: "4 Groups", change: "Lecturer schedules", icon: <Users className="h-4 w-4 text-zinc-400" /> },
          { title: "Logged Hours", value: "32 Hours", change: "This week", icon: <Activity className="h-4 w-4 text-zinc-400" /> },
          ...defaultStats.slice(0, 2),
        ];
      default:
        return defaultStats;
    }
  };

  const stats = getStats();

  const getFilteredAndSortedAssignments = () => {
    let list = [...assignments];
    if (assignmentSearch.trim()) {
      const q = assignmentSearch.toLowerCase();
      list = list.filter(a => 
        a.title.toLowerCase().includes(q) || 
        (a.description && a.description.toLowerCase().includes(q))
      );
    }
    if (assignmentFilter === "completed") {
      list = list.filter(a => a.submissions.every(s => s.status === 'submitted'));
    } else if (assignmentFilter === "pending") {
      list = list.filter(a => a.submissions.some(s => s.status !== 'submitted'));
    }
    list.sort((a, b) => {
      if (assignmentSort === "dueDateAsc") {
        return new Date(a.dueDate) - new Date(b.dueDate);
      } else if (assignmentSort === "dueDateDesc") {
        return new Date(b.dueDate) - new Date(a.dueDate);
      } else if (assignmentSort === "titleAsc") {
        return a.title.localeCompare(b.title);
      } else if (assignmentSort === "createdAtDesc") {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      return 0;
    });
    return list;
  };

  const getFilteredAndSortedSubmissions = () => {
    if (!selectedAssignment) return [];
    let list = [...selectedAssignment.submissions];
    if (submissionSearch.trim()) {
      const q = submissionSearch.toLowerCase();
      list = list.filter(sub => {
        const student = sub.student || {};
        return (
          (student.fullName && student.fullName.toLowerCase().includes(q)) ||
          (student.studentId && student.studentId.toLowerCase().includes(q))
        );
      });
    }
    if (submissionFilterStatus === "submitted") {
      list = list.filter(sub => sub.status === "submitted");
    } else if (submissionFilterStatus === "pending") {
      list = list.filter(sub => sub.status === "pending");
    }
    if (submissionFilterLanguage !== "all") {
      list = list.filter(sub => {
        const student = sub.student || {};
        return (student.language || "").toLowerCase() === submissionFilterLanguage.toLowerCase();
      });
    }
    list.sort((a, b) => {
      const studentA = a.student || {};
      const studentB = b.student || {};
      if (submissionSort === "rollAsc") {
        return (studentA.studentId || "").localeCompare(studentB.studentId || "");
      } else if (submissionSort === "rollDesc") {
        return (studentB.studentId || "").localeCompare(studentA.studentId || "");
      } else if (submissionSort === "nameAsc") {
        return (studentA.fullName || "").localeCompare(studentB.fullName || "");
      } else if (submissionSort === "statusSubmitted") {
        const valA = a.status === "submitted" ? 1 : 0;
        const valB = b.status === "submitted" ? 1 : 0;
        return valB - valA || (studentA.studentId || "").localeCompare(studentB.studentId || "");
      } else if (submissionSort === "statusPending") {
        const valA = a.status === "pending" ? 1 : 0;
        const valB = b.status === "pending" ? 1 : 0;
        return valB - valA || (studentA.studentId || "").localeCompare(studentB.studentId || "");
      }
      return 0;
    });
    return list;
  };

  const getSubmissionsLanguages = () => {
    if (!selectedAssignment) return [];
    const langs = selectedAssignment.submissions
      .map(sub => sub.student?.language)
      .filter((lang, index, self) => lang && self.indexOf(lang) === index);
    return langs.sort();
  };

  const onRegisterUser = async (data) => {
    setSuccessMsg(null);
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const response = await api.post("/api/users", data);
      if (response.data.success) {
        setSuccessMsg(
          `Successfully registered ${data.fullName} as ${data.role}.`
        );
        resetUser();
        fetchUsers();
      }
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message || "Failed to create user. Please check credentials."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const onCreateCourse = async (data) => {
    setCourseSuccess(null);
    setCourseError(null);
    setIsCourseSubmitting(true);

    try {
      const response = await api.post("/api/courses", data);
      if (response.data.success) {
        setCourseSuccess(`Course '${data.courseName}' (${data.courseId}) created successfully.`);
        resetCourse();
        fetchCourses();
      }
    } catch (err) {
      setCourseError(
        err.response?.data?.message || "Failed to create course."
      );
    } finally {
      setIsCourseSubmitting(false);
    }
  };

  const onCreateCollege = async (data) => {
    setCollegeSuccess(null);
    setCollegeError(null);
    setIsCollegeSubmitting(true);

    try {
      const response = await api.post("/api/colleges", data);
      if (response.data.success) {
        setCollegeSuccess(`College '${data.collegeName}' (${data.collegeId}) created successfully.`);
        resetCollege();
        fetchColleges();
      }
    } catch (err) {
      setCollegeError(
        err.response?.data?.message || "Failed to create college."
      );
    } finally {
      setIsCollegeSubmitting(false);
    }
  };

  const onUpdateUser = async (userId, data) => {
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      const response = await api.put(`/api/users/${userId}`, data);
      if (response.data.success) {
        setSuccessMsg(`Account details updated successfully.`);
        setEditingUser(null);
        fetchUsers();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to update user.");
    }
  };

  const onDeleteUser = async (userId) => {
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      const response = await api.delete(`/api/users/${userId}`);
      if (response.data.success) {
        setSuccessMsg("Account deleted successfully.");
        setDeletingUser(null);
        setDeleteConfirmText("");
        fetchUsers();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to delete user.");
    }
  };

  const onUpdateCourse = async (courseId, data) => {
    setCourseSuccess(null);
    setCourseError(null);
    try {
      const response = await api.put(`/api/courses/${courseId}`, data);
      if (response.data.success) {
        setCourseSuccess(`Course details updated successfully.`);
        setEditingCourse(null);
        fetchCourses();
        fetchUsers(); // propagates changes
      }
    } catch (err) {
      setCourseError(err.response?.data?.message || "Failed to update course.");
    }
  };

  const onDeleteCourse = async (courseId) => {
    setCourseSuccess(null);
    setCourseError(null);
    try {
      const response = await api.delete(`/api/courses/${courseId}`);
      if (response.data.success) {
        setCourseSuccess("Course deleted successfully.");
        setDeletingCourse(null);
        setDeleteConfirmText("");
        fetchCourses();
      }
    } catch (err) {
      setCourseError(err.response?.data?.message || "Failed to delete course.");
    }
  };

  const onUpdateCollege = async (collegeId, data) => {
    setCollegeSuccess(null);
    setCollegeError(null);
    try {
      const response = await api.put(`/api/colleges/${collegeId}`, data);
      if (response.data.success) {
        setCollegeSuccess(`College details updated successfully.`);
        setEditingCollege(null);
        fetchColleges();
        fetchCourses();
        fetchUsers();
      }
    } catch (err) {
      setCollegeError(err.response?.data?.message || "Failed to update college.");
    }
  };

  const onDeleteCollege = async (collegeId) => {
    setCollegeSuccess(null);
    setCollegeError(null);
    try {
      const response = await api.delete(`/api/colleges/${collegeId}`);
      if (response.data.success) {
        setCollegeSuccess("College deleted successfully.");
        setDeletingCollege(null);
        setDeleteConfirmText("");
        fetchColleges();
      }
    } catch (err) {
      setCollegeError(err.response?.data?.message || "Failed to delete college.");
    }
  };

  const onToggleUserStatus = async (userObj) => {
    setSuccessMsg(null);
    setErrorMsg(null);
    const newStatus = userObj.status === "active" ? "inactive" : "active";
    try {
      const response = await api.put(`/api/users/${userObj.id || userObj._id}`, {
        status: newStatus,
      });
      if (response.data.success) {
        setSuccessMsg(`Status of ${userObj.fullName} toggled to ${newStatus}.`);
        fetchUsers();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to toggle user status.");
    }
  };


  const renderWorkspace = () => {
    if (user.role === "Admin") {
      return (
            <>              {/* Register Employee Card */}
              <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                <CardHeader>
                  <CardTitle className="text-zinc-900 dark:text-white flex items-center space-x-2 text-base">
                    <PlusCircle className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                    <span>Register Employee</span>
                  </CardTitle>
                  <CardDescription className="text-zinc-500 text-xs">
                    Create a new employee user account. HODs are assigned to Courses, while Principals and other faculties are assigned to Colleges.
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmitUser(onRegisterUser)}>
                  <CardContent className="space-y-4 text-xs">
                    {successMsg && (
                      <div className="flex items-start space-x-2 rounded-md border border-emerald-200 dark:border-emerald-900/30 bg-emerald-50 dark:bg-emerald-950/20 p-3 text-emerald-700 dark:text-emerald-400">
                        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <span>{successMsg}</span>
                      </div>
                    )}

                    {errorMsg && (
                      <div className="flex items-start space-x-2 rounded-md border border-red-200 dark:border-red-950/30 bg-red-50 dark:bg-red-950/20 p-3 text-red-650 dark:text-red-400">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{errorMsg}</span>
                      </div>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="fullName" className="text-zinc-700 dark:text-zinc-300">Full Name</Label>
                        <Input
                          id="fullName"
                          type="text"
                          placeholder="John Doe"
                          className="border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500"
                          {...registerUser("fullName")}
                          disabled={isSubmitting}
                        />
                        {errorsUser.fullName && (
                          <p className="text-[11px] text-red-500">{errorsUser.fullName.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="employeeId" className="text-zinc-700 dark:text-zinc-300">Employee ID</Label>
                        <Input
                          id="employeeId"
                          type="text"
                          placeholder="e.g. FAC092"
                          className="border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500"
                          {...registerUser("employeeId")}
                          disabled={isSubmitting}
                        />
                        {errorsUser.employeeId && (
                          <p className="text-[11px] text-red-500">{errorsUser.employeeId.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-zinc-700 dark:text-zinc-300">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="john.doe@college.edu"
                          className="border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500"
                          {...registerUser("email")}
                          disabled={isSubmitting}
                        />
                        {errorsUser.email && (
                          <p className="text-[11px] text-red-500">{errorsUser.email.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="role" className="text-zinc-700 dark:text-zinc-300">System Role</Label>
                        <select
                          id="role"
                          className="flex h-9 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-900 dark:text-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none"
                          {...registerUser("role")}
                          disabled={isSubmitting}
                        >
                          <option value="Principal">Principal</option>
                          <option value="HOD">HOD</option>
                          <option value="Office Assistant">Office Assistant</option>
                          <option value="Faculty">Faculty</option>
                        </select>
                        {errorsUser.role && (
                          <p className="text-[11px] text-red-500">{errorsUser.role.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-zinc-700 dark:text-zinc-300">Initial Password</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="••••••••"
                          className="border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500"
                          {...registerUser("password")}
                          disabled={isSubmitting}
                        />
                        {errorsUser.password && (
                          <p className="text-[11px] text-red-500">{errorsUser.password.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="college" className="text-zinc-700 dark:text-zinc-300">College</Label>
                        <select
                          id="college"
                          className="flex h-9 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-900 dark:text-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none"
                          {...registerUser("college")}
                          disabled={isSubmitting}
                        >
                          <option value="">-- Select College --</option>
                          {colleges.map((col) => (
                            <option key={col.collegeId} value={col.collegeName}>
                              {col.collegeName} ({col.collegeId})
                            </option>
                          ))}
                        </select>
                        {errorsUser.college && (
                          <p className="text-[11px] text-red-500">{errorsUser.college.message}</p>
                        )}
                      </div>
                    </div>

                    {watchedRole === "HOD" && (
                      <div className="space-y-2">
                        <Label htmlFor="department" className="text-zinc-700 dark:text-zinc-300">Course / Department</Label>
                        <select
                          id="department"
                          className="flex h-9 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-900 dark:text-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none"
                          {...registerUser("department")}
                          disabled={isSubmitting || !watchedCollege}
                        >
                          <option value="">-- Select Course --</option>
                          {courses
                            .filter((c) => c.college === watchedCollege)
                            .map((course) => (
                              <option key={course.courseId} value={course.courseName}>
                                {course.courseName} ({course.courseId})
                              </option>
                            ))}
                        </select>
                        {errorsUser.department && (
                          <p className="text-[11px] text-red-500">{errorsUser.department.message}</p>
                        )}
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 w-full mt-2"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Creating..." : "Register User"}
                    </Button>
                  </CardContent>
                </form>
              </Card>

              {/* Create Course Card */}
              <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                <CardHeader>
                  <CardTitle className="text-zinc-900 dark:text-white flex items-center space-x-2 text-base">
                    <BookOpen className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                    <span>Create Course / Department</span>
                  </CardTitle>
                  <CardDescription className="text-zinc-500 text-xs">
                    Define a new course or academic department. Courses are mapped under created colleges.
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmitCourse(onCreateCourse)}>
                  <CardContent className="space-y-4 text-xs">
                    {courseSuccess && (
                      <div className="flex items-start space-x-2 rounded-md border border-emerald-200 dark:border-emerald-900/30 bg-emerald-50 dark:bg-emerald-950/20 p-3 text-emerald-700 dark:text-emerald-400">
                        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <span>{courseSuccess}</span>
                      </div>
                    )}

                    {courseError && (
                      <div className="flex items-start space-x-2 rounded-md border border-red-200 dark:border-red-950/30 bg-red-50 dark:bg-red-950/20 p-3 text-red-600 dark:text-red-400">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{courseError}</span>
                      </div>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="courseId" className="text-zinc-700 dark:text-zinc-300">Course / Dept ID</Label>
                        <Input
                          id="courseId"
                          type="text"
                          placeholder="e.g. CSE"
                          className="border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500"
                          {...registerCourse("courseId")}
                          disabled={isCourseSubmitting}
                        />
                        {errorsCourse.courseId && (
                          <p className="text-[11px] text-red-500">{errorsCourse.courseId.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="courseName" className="text-zinc-700 dark:text-zinc-300">Course / Dept Name</Label>
                        <Input
                          id="courseName"
                          type="text"
                          placeholder="e.g. Computer Science & Engineering"
                          className="border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500"
                          {...registerCourse("courseName")}
                          disabled={isCourseSubmitting}
                        />
                        {errorsCourse.courseName && (
                          <p className="text-[11px] text-red-500">{errorsCourse.courseName.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="course-college" className="text-zinc-700 dark:text-zinc-300">College</Label>
                      <select
                        id="course-college"
                        className="flex h-9 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-900 dark:text-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none"
                        {...registerCourse("college")}
                        disabled={isCourseSubmitting}
                      >
                        <option value="">-- Select College --</option>
                        {colleges.map((col) => (
                          <option key={col.collegeId} value={col.collegeName}>
                            {col.collegeName} ({col.collegeId})
                          </option>
                        ))}
                      </select>
                      {errorsCourse.college && (
                        <p className="text-[11px] text-red-500">{errorsCourse.college.message}</p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 w-full"
                      disabled={isCourseSubmitting}
                    >
                      {isCourseSubmitting ? "Creating..." : "Create Course"}
                    </Button>
                  </CardContent>
                </form>
              </Card>

              {/* Create College Card */}
              <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                <CardHeader>
                  <CardTitle className="text-zinc-900 dark:text-white flex items-center space-x-2 text-base">
                    <Building2 className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                    <span>Create College / Organization</span>
                  </CardTitle>
                  <CardDescription className="text-zinc-500 text-xs">
                    Define a new college structure first. Courses and staff will map to colleges.
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmitCollege(onCreateCollege)}>
                  <CardContent className="space-y-4 text-xs">
                    {collegeSuccess && (
                      <div className="flex items-start space-x-2 rounded-md border border-emerald-200 dark:border-emerald-900/30 bg-emerald-50 dark:bg-emerald-950/20 p-3 text-emerald-700 dark:text-emerald-400">
                        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <span>{collegeSuccess}</span>
                      </div>
                    )}

                    {collegeError && (
                      <div className="flex items-start space-x-2 rounded-md border border-red-200 dark:border-red-950/30 bg-red-50 dark:bg-red-950/20 p-3 text-red-600 dark:text-red-400">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{collegeError}</span>
                      </div>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="collegeId" className="text-zinc-700 dark:text-zinc-300">College ID</Label>
                        <Input
                          id="collegeId"
                          type="text"
                          placeholder="e.g. COE"
                          className="border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500"
                          {...registerCollege("collegeId")}
                          disabled={isCollegeSubmitting}
                        />
                        {errorsCollege.collegeId && (
                          <p className="text-[11px] text-red-500">{errorsCollege.collegeId.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="collegeName" className="text-zinc-700 dark:text-zinc-300">College Name</Label>
                        <Input
                          id="collegeName"
                          type="text"
                          placeholder="e.g. College of Engineering"
                          className="border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500"
                          {...registerCollege("collegeName")}
                          disabled={isCollegeSubmitting}
                        />
                        {errorsCollege.collegeName && (
                          <p className="text-[11px] text-red-500">{errorsCollege.collegeName.message}</p>
                        )}
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 w-full"
                      disabled={isCollegeSubmitting}
                    >
                      {isCollegeSubmitting ? "Creating..." : "Create College"}
                    </Button>
                  </CardContent>
                </form>
              </Card>
            </>
      );
    } else if (user.role === "HOD") {
      if (window.location.pathname.endsWith("/subjects") || window.location.pathname.endsWith("/faculty")) {
        return (
              <div className="space-y-6">
                {/* Status Messages */}
                {allocError && (
                  <div className="p-3 text-xs text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-950/20 rounded">
                    {allocError}
                  </div>
                )}
                {allocSuccess && (
                  <div className="p-3 text-xs text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30 bg-emerald-50 dark:bg-emerald-950/20 rounded">
                    {allocSuccess}
                  </div>
                )}

                {/* Batch & Semester Selection */}
                <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                  <CardHeader>
                    <CardTitle className="text-zinc-900 dark:text-white text-base flex items-center space-x-2">
                      <BookOpen className="h-5 w-5 text-zinc-400" />
                      <span>Subject Allocation Hub</span>
                    </CardTitle>                    <CardDescription className="text-zinc-500 text-xs">
                      Select batch and semester to create subjects and map them to faculties per section.
                    </CardDescription>
                    <div className="bg-amber-500/10 border border-amber-500/20 p-2.5 rounded text-[11px] text-amber-700 dark:text-amber-400 mt-2">
                      ⚠️ <strong>Note:</strong> Language subjects (Kannada, Hindi, Malayalam) should be registered first before configuring regular subjects.
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-zinc-700 dark:text-zinc-300 text-xs">Select Batch</Label>
                      <select
                        className="flex h-8 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white px-3 py-1 text-xs shadow-sm focus-visible:outline-none"
                        value={selectedBatch?._id || ""}
                        onChange={(e) => {
                          const batch = batches.find(b => b._id === e.target.value);
                          setSelectedBatch(batch || null);
                        }}
                      >
                        <option value="">-- Choose Batch --</option>
                        {batches.map(b => (
                          <option key={b._id} value={b._id}>{b.batchId} ({b.years})</option>
                        ))}
                      </select>
                    </div>

                    {selectedBatch && (
                      <div className="space-y-1">
                        <Label className="text-zinc-700 dark:text-zinc-300 text-xs">Select Semester</Label>
                        <select
                          className="flex h-8 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white px-3 py-1 text-xs shadow-sm focus-visible:outline-none"
                          value={selectedSemester?._id || ""}
                          onChange={(e) => {
                            const sem = semesters.find(s => s._id === e.target.value);
                            setSelectedSemester(sem || null);
                          }}
                        >
                          <option value="">-- Choose Semester --</option>
                          {semesters.map(s => (
                            <option key={s._id} value={s._id}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {selectedSemester && (
                  <div className="grid gap-6 lg:grid-cols-12">
                    {/* Left Column: Subject Registry */}
                    <div className="lg:col-span-5 space-y-6">
                      <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                        <CardHeader>
                          <CardTitle className="text-zinc-900 dark:text-white text-xs font-semibold">Subject Registry</CardTitle>
                          <CardDescription className="text-[10px] text-zinc-500">Create academic subjects for {selectedSemester.name}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <form onSubmit={onCreateSubject} className="space-y-3">
                            <div className="space-y-1">
                              <Label htmlFor="subId" className="text-zinc-700 dark:text-zinc-300 text-xs">Subject ID / Code</Label>
                              <Input
                                id="subId"
                                type="text"
                                placeholder="e.g. CS101"
                                value={newSubjectId}
                                onChange={(e) => setNewSubjectId(e.target.value)}
                                className="h-8 text-xs border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500"
                              />
                            </div>                            <div className="space-y-1">
                              <Label htmlFor="subName" className="text-zinc-700 dark:text-zinc-300 text-xs">Subject Name</Label>
                              <Input
                                id="subName"
                                type="text"
                                placeholder="e.g. Database Management Systems"
                                value={newSubjectName}
                                onChange={(e) => setNewSubjectName(e.target.value)}
                                className="h-8 text-xs border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500"
                              />
                            </div>                            <div className="space-y-1">
                              <Label htmlFor="subType" className="text-zinc-700 dark:text-zinc-300 text-xs">Subject Type</Label>
                              <select
                                id="subType"
                                value={newSubjectType}
                                onChange={(e) => setNewSubjectType(e.target.value)}
                                className="flex h-8 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white px-3 py-1 text-xs shadow-sm focus:outline-none"
                              >
                                <option value="regular">Regular Subject</option>
                                <option value="language">Language Subject</option>
                              </select>
                            </div>
                            <Button type="submit" size="sm" className="bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 text-xs h-8 w-full">
                              Create Subject
                            </Button>
                          </form>
                        </CardContent>
                      </Card>

                      {/* Created Subjects Table */}
                      <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 bg-white dark:bg-zinc-950 space-y-3">
                        <h4 className="font-semibold text-zinc-900 dark:text-white text-xs">Created Subjects ({subjects.length})</h4>
                        <div className="overflow-x-auto border border-zinc-150 dark:border-zinc-850 rounded-lg">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="border-b border-zinc-200 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-900/20 text-zinc-505 dark:text-zinc-400 font-semibold">
                                <th className="py-2 px-3">Code</th>
                                <th className="py-2 px-3">Subject Name</th>
                                <th className="py-2 px-3">Type</th>
                                <th className="py-2 px-3 text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {subjects.length === 0 ? (
                                <tr>
                                  <td colSpan={4} className="py-4 text-center text-zinc-500 italic">No subjects created yet.</td>
                                </tr>
                              ) : (
                                subjects.map(sub => (
                                  <tr key={sub._id} className="border-b border-zinc-100 dark:border-zinc-900 text-zinc-700 dark:text-zinc-300">
                                    <td className="py-2 px-3 font-mono font-bold">{sub.subjectId}</td>
                                    <td className="py-2 px-3">{sub.name}</td>
                                    <td className="py-2 px-3 font-semibold uppercase text-[10px] text-zinc-500">
                                      {sub.subjectType === 'language' ? 'Language' : 'Regular'}
                                    </td>
                                    <td className="py-2 px-3 text-right">
                                      <button
                                        type="button"
                                        onClick={() => onDeleteSubject(sub._id)}
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 p-1 rounded"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Faculty Allocation */}
                    <div className="lg:col-span-7 space-y-6">
                      <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-955 bg-white dark:bg-zinc-950">
                        <CardHeader>
                          <CardTitle className="text-zinc-900 dark:text-white text-xs font-semibold">Map Faculty to Subject</CardTitle>
                          <CardDescription className="text-[10px] text-zinc-550 text-zinc-500">Allocate subjects to respective faculty members per section (session)</CardDescription>
                        </CardHeader>
                        <CardContent>                          <form 
                            onSubmit={onCreateSubjectAllocation} 
                            className={`grid gap-4 ${sections.length > 0 ? "sm:grid-cols-3" : "sm:grid-cols-2"} items-end`}
                          >
                            <div className="space-y-1">
                              <Label className="text-zinc-700 dark:text-zinc-300 text-xs">Choose Subject</Label>
                              <select
                                className="flex h-8 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white px-3 py-1 text-xs shadow-sm focus-visible:outline-none"
                                value={selectedAllocSubjectId}
                                onChange={(e) => setSelectedAllocSubjectId(e.target.value)}
                              >
                                <option value="">-- Choose Subject --</option>
                                {subjects.map(s => (
                                  <option key={s._id} value={s._id}>{s.subjectId} - {s.name}</option>
                                ))}
                              </select>
                            </div>
                            {sections.length > 0 && (
                              <div className="space-y-1">
                                <Label className="text-zinc-700 dark:text-zinc-300 text-xs">Choose Section (Optional)</Label>
                                <select
                                  className="flex h-8 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white px-3 py-1 text-xs shadow-sm focus-visible:outline-none"
                                  value={selectedAllocSectionId}
                                  onChange={(e) => setSelectedAllocSectionId(e.target.value)}
                                >
                                  <option value="">-- Semester-Wide (Default) --</option>
                                  {sections.map(sec => (
                                    <option key={sec._id} value={sec._id}>{sec.name}</option>
                                  ))}
                                </select>
                              </div>
                            )}
                            <div className="space-y-1">
                              <Label className="text-zinc-700 dark:text-zinc-300 text-xs">Choose Faculty</Label>
                              <select
                                  className="flex h-8 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white px-3 py-1 text-xs shadow-sm focus-visible:outline-none"
                                  value={selectedAllocFacultyId}
                                  onChange={(e) => setSelectedAllocFacultyId(e.target.value)}
                                >
                                  <option value="">-- Choose Faculty --</option>
                                  {faculties.map(fac => (
                                    <option key={fac._id} value={fac._id}>{fac.fullName} ({fac.employeeId || "No ID"})</option>
                                  ))}
                                </select>
                              </div>
                              <div className={`${sections.length > 0 ? "sm:col-span-3" : "sm:col-span-2"} pt-2`}>
                                <Button type="submit" size="sm" className="bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 text-xs h-8 w-full">
                                  Assign Faculty member
                                </Button>
                              </div>
                            </form>
                        </CardContent>
                      </Card>

                      {/* Active Allocations Registry */}
                      <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 bg-white dark:bg-zinc-950 space-y-3">
                        <h4 className="font-semibold text-zinc-900 dark:text-white text-xs">Active Faculty Allocations ({subjectAllocations.length})</h4>
                        <div className="overflow-x-auto border border-zinc-150 dark:border-zinc-850 rounded-lg">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="border-b border-zinc-200 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-900/20 text-zinc-505 dark:text-zinc-400 font-semibold">
                                <th className="py-2 px-3">Subject</th>
                                <th className="py-2 px-3">Section</th>
                                <th className="py-2 px-3">Faculty Member</th>
                                <th className="py-2 px-3 text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {subjectAllocations.length === 0 ? (
                                <tr>
                                  <td colSpan={4} className="py-4 text-center text-zinc-505 italic">No subjects mapped to faculty yet.</td>
                                </tr>
                              ) : (
                                subjectAllocations.map(alloc => (
                                  <tr key={alloc._id} className="border-b border-zinc-100 dark:border-zinc-900 text-zinc-700 dark:text-zinc-300">
                                    <td className="py-2 px-3">
                                      <span className="font-mono font-bold text-zinc-900 dark:text-white mr-2">{alloc.subject?.subjectId}</span>
                                      <span className="text-zinc-500">{alloc.subject?.name}</span>
                                    </td>
                                    <td className="py-2 px-3">
                                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-850 text-zinc-700 dark:text-zinc-300 font-semibold">
                                        {alloc.section?.name || "Semester-Wide"}
                                      </span>
                                    </td>
                                    <td className="py-2 px-3">
                                      <div className="font-medium text-zinc-900 dark:text-white">{alloc.faculty?.fullName}</div>
                                      <div className="text-[10px] text-zinc-450 dark:text-zinc-500">{alloc.faculty?.email}</div>
                                    </td>
                                    <td className="py-2 px-3 text-right">
                                      <button
                                        type="button"
                                        onClick={() => onDeleteSubjectAllocation(alloc._id)}
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 p-1 rounded"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
        );
      } else if (window.location.pathname.endsWith("/attendance")) {
        const filteredHODData = getFilteredAndSortedHODData();
        const hasRecords = hodConsolidatedData && hodConsolidatedData.data && hodConsolidatedData.data.length > 0;
        
        const subjectsList = hodConsolidatedData?.subjects || [];
        const regularSubjects = subjectsList.filter(s => s.subjectType !== 'language');
        const languageSubjects = subjectsList.filter(s => s.subjectType === 'language');

        const showLanguageColumn = hodSelectedSubjectIds.includes("language") && languageSubjects.length > 0;
        const selectedRegularSubjects = regularSubjects.filter(s => hodSelectedSubjectIds.includes(s._id));
        const totalColsCount = 4 + selectedRegularSubjects.length + (showLanguageColumn ? 1 : 0) + 1;

        return (
          <div className="space-y-6">
            <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 pb-4 border-b border-zinc-100 dark:border-zinc-900">
                <div>
                  <CardTitle className="text-zinc-900 dark:text-white text-base flex items-center space-x-2">
                    <CalendarCheck className="h-5 w-5 text-zinc-400" />
                    <span>Consolidated Attendance Ledger</span>
                  </CardTitle>
                  <CardDescription className="text-zinc-500 text-xs mt-1">
                    Select a class, section, and subjects to inspect attendance statistics.
                  </CardDescription>
                </div>
                {hasRecords && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={downloadHODConsolidatedExcel}
                    className="text-xs h-8 px-3 border-emerald-250 hover:border-emerald-350 hover:bg-emerald-50 dark:hover:bg-emerald-955/20 text-emerald-600 flex items-center space-x-1 font-semibold"
                  >
                <FileSpreadsheet className="h-4 w-4" />
                    <span>Export Excel Report</span>
                  </Button>
                )}
              </CardHeader>
              <CardContent className="pt-4">
                {/* Selectors Grid */}
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 text-xs pb-2">
                  <div className="space-y-1">
                    <Label className="text-zinc-700 dark:text-zinc-300">Choose Batch *</Label>
                    <select
                      className="flex h-8 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white px-2 py-1 text-xs shadow-sm focus:outline-none"
                      value={hodSelectedBatch?._id || ""}
                      onChange={(e) => {
                        const b = batches.find(x => x._id === e.target.value);
                        setHodSelectedBatch(b || null);
                      }}
                    >
                      <option value="">-- Select Batch --</option>
                      {batches.map(b => (
                        <option key={b._id} value={b._id}>{b.batchId} ({b.years})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-zinc-700 dark:text-zinc-300">Choose Semester *</Label>
                    <select
                      className="flex h-8 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white px-2 py-1 text-xs shadow-sm focus:outline-none"
                      disabled={!hodSelectedBatch}
                      value={hodSelectedSemester?._id || ""}
                      onChange={(e) => {
                        const s = (hodSemesters || []).find(x => x._id === e.target.value);
                        setHodSelectedSemester(s || null);
                      }}
                    >
                      <option value="">-- Select Semester --</option>
                      {(hodSemesters || []).map(s => (
                        <option key={s._id} value={s._id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-zinc-700 dark:text-zinc-300">Class / Section</Label>
                    <select
                      className="flex h-8 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white px-2 py-1 text-xs shadow-sm focus:outline-none"
                      disabled={!hodSelectedSemester}
                      value={hodSelectedSection}
                      onChange={(e) => setHodSelectedSection(e.target.value)}
                    >
                      <option value="all">Semester-Wide (All Sections)</option>
                      {(hodSections || []).map(sec => (
                        <option key={sec._id} value={sec._id}>{sec.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1 relative">
                    <Label className="text-zinc-700 dark:text-zinc-300">Course Subjects</Label>
                    <div className="relative">
                      <button
                        type="button"
                        disabled={!hodSelectedSemester}
                        onClick={() => setIsSubjectDropdownOpen(!isSubjectDropdownOpen)}
                        className="flex h-8 w-full items-center justify-between rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white px-3 py-1 text-xs shadow-sm focus:outline-none disabled:opacity-50 text-left"
                      >
                        <span className="truncate">
                          {hodSelectedSubjectIds.length === 0
                            ? "No subjects selected"
                            : hodSelectedSubjectIds.length === (hodSubjects.filter(s => s.subjectType !== 'language').length + (hodSubjects.some(s => s.subjectType === 'language') ? 1 : 0))
                            ? "All Subjects Selected"
                            : `${hodSelectedSubjectIds.length} Subjects Selected`}
                        </span>
                        <ChevronDown className="h-3 w-3 opacity-50 shrink-0 ml-1" />
                      </button>

                      {isSubjectDropdownOpen && (
                        <>
                          <div 
                            className="fixed inset-0 z-40" 
                            onClick={() => setIsSubjectDropdownOpen(false)}
                          />
                          <div className="absolute right-0 left-0 mt-1 z-50 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-955 bg-white dark:bg-zinc-950 p-2 shadow-md max-h-60 overflow-y-auto space-y-1 animate-in fade-in slide-in-from-top-1 duration-100">
                            <div className="flex items-center justify-between pb-1 mb-1 border-b border-zinc-100 dark:border-zinc-900 text-[10px] text-zinc-500">
                              <button
                                type="button"
                                onClick={() => {
                                  const regularIds = hodSubjects.filter(s => s.subjectType !== 'language').map(s => s._id);
                                  const hasLang = hodSubjects.some(s => s.subjectType === 'language');
                                  setHodSelectedSubjectIds(hasLang ? [...regularIds, "language"] : regularIds);
                                }}
                                className="hover:text-zinc-900 dark:hover:text-white underline font-semibold"
                              >
                                Select All
                              </button>
                              <button
                                type="button"
                                onClick={() => setHodSelectedSubjectIds([])}
                                className="hover:text-zinc-900 dark:hover:text-white underline font-semibold"
                              >
                                Deselect All
                              </button>
                            </div>
                            
                            {/* Combined Language Option */}
                            {hodSubjects.some(s => s.subjectType === 'language') && (
                              <label className="flex items-center space-x-2 p-1 rounded hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer select-none text-zinc-700 dark:text-zinc-300 font-semibold">
                                <input
                                  type="checkbox"
                                  checked={hodSelectedSubjectIds.includes("language")}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setHodSelectedSubjectIds(prev => [...prev, "language"]);
                                    } else {
                                      setHodSelectedSubjectIds(prev => prev.filter(x => x !== "language"));
                                    }
                                  }}
                                  className="h-3.5 w-3.5 rounded border-zinc-300 dark:border-zinc-700 text-primary focus:ring-primary"
                                />
                                <span>Language</span>
                              </label>
                            )}

                            {/* Regular Subjects */}
                            {hodSubjects.filter(s => s.subjectType !== 'language').map(sub => (
                              <label key={sub._id} className="flex items-center space-x-2 p-1 rounded hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer select-none text-zinc-700 dark:text-zinc-300">
                                <input
                                  type="checkbox"
                                  checked={hodSelectedSubjectIds.includes(sub._id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setHodSelectedSubjectIds(prev => [...prev, sub._id]);
                                    } else {
                                      setHodSelectedSubjectIds(prev => prev.filter(x => x !== sub._id));
                                    }
                                  }}
                                  className="h-3.5 w-3.5 rounded border-zinc-300 dark:border-zinc-700 text-primary focus:ring-primary"
                                />
                                <span>{sub.subjectId} - {sub.name}</span>
                              </label>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {!hodSelectedSemester ? (
              <div className="text-center p-12 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-955 bg-white dark:bg-zinc-950 text-zinc-505 italic text-xs">
                Please select Batch and Semester from dropdowns to display consolidated records.
              </div>
            ) : hodConsolidatedLoading ? (
              <div className="flex flex-col items-center justify-center p-24 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 space-y-4">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 dark:border-zinc-850 border-t-zinc-850 dark:border-t-zinc-200" />
                <span className="text-zinc-500 text-xs font-semibold animate-pulse">Fetching consolidated records...</span>
              </div>
            ) : !hasRecords ? (
              <div className="text-center p-12 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-zinc-550 italic text-xs">
                No attendance logs or student rosters found matching these criteria.
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* Search and Sort controls */}
                <div className="flex flex-col sm:flex-row gap-2 bg-zinc-50/50 dark:bg-zinc-900/10 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                    <Input
                      type="text"
                      placeholder="Search student name or register number..."
                      value={hodSearchQuery}
                      onChange={(e) => setHodSearchQuery(e.target.value)}
                      className="h-8 pl-8 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                    />
                  </div>
                  <div className="flex gap-2">
                    <select
                      className="h-8 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white px-2 py-1 text-xs shadow-sm focus:outline-none"
                      value={hodSortCriteria}
                      onChange={(e) => setHodSortCriteria(e.target.value)}
                    >
                      <option value="rollAsc">Register No (Asc)</option>
                      <option value="rollDesc">Register No (Desc)</option>
                      <option value="nameAsc">Name (A-Z)</option>
                      <option value="pctAsc">Overall Pct (Lowest)</option>
                      <option value="pctDesc">Overall Pct (Highest)</option>
                    </select>
                  </div>
                </div>

                {/* Table View */}
                <div className="overflow-x-auto border border-zinc-150 dark:border-zinc-850 rounded-lg bg-white dark:bg-zinc-955 bg-white dark:bg-zinc-950">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-900/20 text-zinc-505 dark:text-zinc-400 font-semibold">
                        <th rowSpan={2} className="py-2.5 px-3 text-center w-12 border-r border-zinc-200 dark:border-zinc-850">Sl. No.</th>
                        <th rowSpan={2} className="py-2.5 px-3 border-r border-zinc-200 dark:border-zinc-850">Register Number</th>
                        <th rowSpan={2} className="py-2.5 px-3 border-r border-zinc-200 dark:border-zinc-850">Student Name</th>
                        <th rowSpan={2} className="py-2.5 px-3 text-center border-r border-zinc-200 dark:border-zinc-850">Language Choice</th>
                        
                        {selectedRegularSubjects.map(sub => (
                              <th key={sub._id} colSpan={3} className="py-1 px-2 text-center font-mono border-b border-r border-zinc-200 dark:border-zinc-850">
                                <div className="truncate max-w-[120px] mx-auto">{sub.subjectId}</div>
                                <div className="text-[9px] text-zinc-500 dark:text-zinc-400 font-normal italic font-sans max-w-[120px] truncate mx-auto mt-0.5" title={sub.facultyName}>
                                  {sub.facultyName}
                                </div>
                              </th>
                            ))}
                            
                            {showLanguageColumn && (
                              <th colSpan={3} className="py-1 px-2 text-center border-b border-r border-zinc-200 dark:border-zinc-850">
                                <div className="truncate max-w-[120px] mx-auto font-semibold">Language</div>
                                <div className="text-[9px] text-zinc-550 dark:text-zinc-400 text-zinc-500 font-normal italic font-sans max-w-[120px] truncate mx-auto mt-0.5" title="Language Elective Faculty">
                                  Language Staff
                                </div>
                              </th>
                            )}
                        
                        <th rowSpan={2} className="py-2.5 px-3 text-right">Overall Attendance</th>
                      </tr>
                      <tr className="border-b border-zinc-200 dark:border-zinc-850 bg-zinc-50/20 dark:bg-zinc-900/10 text-zinc-505 dark:text-zinc-400 font-semibold text-[10px]">
                        {selectedRegularSubjects.map(sub => (
                          <React.Fragment key={sub._id}>
                            <th className="py-1 text-center border-r border-zinc-200 dark:border-zinc-850 w-10">CT</th>
                            <th className="py-1 text-center border-r border-zinc-200 dark:border-zinc-850 w-10">AT</th>
                            <th className="py-1 text-center border-r border-zinc-200 dark:border-zinc-850 w-12">%</th>
                          </React.Fragment>
                        ))}
                        {showLanguageColumn && (
                          <React.Fragment>
                            <th className="py-1 text-center border-r border-zinc-200 dark:border-zinc-850 w-10">CT</th>
                            <th className="py-1 text-center border-r border-zinc-200 dark:border-zinc-850 w-10">AT</th>
                            <th className="py-1 text-center border-r border-zinc-200 dark:border-zinc-850 w-12">%</th>
                          </React.Fragment>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHODData.length === 0 ? (
                        <tr>
                          <td colSpan={totalColsCount} className="py-8 text-center text-zinc-500 italic">
                            No students match your search query.
                          </td>
                        </tr>
                      ) : (
                        filteredHODData.map((row, idx) => {
                          const overallPct = getStudentOverallAttendance(row);
                          const overallLow = overallPct !== 'N/A' && overallPct < 75;

                          let languageCell = null;
                          if (showLanguageColumn) {
                            const studentLangSub = languageSubjects.find(sub => {
                              const subAtt = row.attendance[sub._id];
                              return subAtt && subAtt.isEnrolled;
                            });

                            if (!studentLangSub) {
                              languageCell = (
                                <React.Fragment>
                                  <td className="py-2.5 text-center text-zinc-400 border-r border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/10 font-bold uppercase text-[9px]">N/A</td>
                                  <td className="py-2.5 text-center text-zinc-400 border-r border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/10 font-bold uppercase text-[9px]">N/A</td>
                                  <td className="py-2.5 text-center text-zinc-400 border-r border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/10 font-bold uppercase text-[9px]">N/A</td>
                                </React.Fragment>
                              );
                              } else {
                                const subAtt = row.attendance[studentLangSub._id];
                                const facultyTooltip = `Faculty: ${studentLangSub.facultyName || 'Not Allocated'}`;
                                if (!subAtt || subAtt.totalClasses === 0) {
                                  languageCell = (
                                    <React.Fragment>
                                      <td className="py-2.5 text-center text-zinc-400 border-r border-zinc-100 dark:border-zinc-900" title={facultyTooltip}>0</td>
                                      <td className="py-2.5 text-center text-zinc-400 border-r border-zinc-100 dark:border-zinc-900" title={facultyTooltip}>0</td>
                                      <td className="py-2.5 text-center text-zinc-400 border-r border-zinc-100 dark:border-zinc-900 font-semibold" title={facultyTooltip}>-</td>
                                    </React.Fragment>
                                  );
                                } else {
                                  languageCell = (
                                    <React.Fragment>
                                      <td className="py-2.5 text-center border-r border-zinc-100 dark:border-zinc-900 font-mono text-zinc-500" title={facultyTooltip}>{subAtt.totalClasses}</td>
                                      <td className="py-2.5 text-center border-r border-zinc-100 dark:border-zinc-900 font-mono font-bold text-zinc-650" title={facultyTooltip}>{subAtt.presentCount}</td>
                                      <td className="py-2.5 text-center border-r border-zinc-100 dark:border-zinc-900 font-mono font-semibold" title={facultyTooltip}>
                                        <span className={subAtt.percentage < 75 ? 'text-red-500 dark:text-red-400' : 'text-zinc-700 dark:text-zinc-300'}>
                                          {subAtt.percentage}%
                                        </span>
                                      </td>
                                    </React.Fragment>
                                  );
                                }
                              }
                          }
                          
                          return (
                            <tr key={row._id} className="border-b border-zinc-100 dark:border-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900/10">
                              <td className="py-2.5 px-3 text-center font-semibold text-zinc-400 border-r border-zinc-100 dark:border-zinc-900">{idx + 1}</td>
                              <td className="py-2.5 px-3 font-mono font-bold text-zinc-900 dark:text-white border-r border-zinc-100 dark:border-zinc-900">{row.studentId}</td>
                              <td className="py-2.5 px-3 font-medium border-r border-zinc-100 dark:border-zinc-900">{row.fullName}</td>
                              <td className="py-2.5 px-3 text-center uppercase text-[10px] font-bold text-zinc-500 border-r border-zinc-100 dark:border-zinc-900">{row.language || 'N/A'}</td>
                              
                              {selectedRegularSubjects.map(sub => {
                                const subAtt = row.attendance[sub._id];
                                const facultyTooltip = `Faculty: ${sub.facultyName || 'Not Allocated'}`;
                                if (!subAtt) {
                                  return (
                                    <React.Fragment key={sub._id}>
                                      <td className="py-2.5 text-center text-zinc-400 border-r border-zinc-100 dark:border-zinc-900" title={facultyTooltip}>-</td>
                                      <td className="py-2.5 text-center text-zinc-400 border-r border-zinc-100 dark:border-zinc-900" title={facultyTooltip}>-</td>
                                      <td className="py-2.5 text-center text-zinc-400 border-r border-zinc-100 dark:border-zinc-900" title={facultyTooltip}>-</td>
                                    </React.Fragment>
                                  );
                                }
                                if (subAtt.totalClasses === 0) {
                                  return (
                                    <React.Fragment key={sub._id}>
                                      <td className="py-2.5 text-center text-zinc-400 border-r border-zinc-100 dark:border-zinc-900" title={facultyTooltip}>0</td>
                                      <td className="py-2.5 text-center text-zinc-400 border-r border-zinc-100 dark:border-zinc-900" title={facultyTooltip}>0</td>
                                      <td className="py-2.5 text-center text-zinc-400 border-r border-zinc-100 dark:border-zinc-900 font-semibold" title={facultyTooltip}>-</td>
                                    </React.Fragment>
                                  );
                                }
                                
                                return (
                                  <React.Fragment key={sub._id}>
                                    <td className="py-2.5 text-center border-r border-zinc-100 dark:border-zinc-900 font-mono text-zinc-500" title={facultyTooltip}>{subAtt.totalClasses}</td>
                                    <td className="py-2.5 text-center border-r border-zinc-100 dark:border-zinc-900 font-mono font-bold text-zinc-650" title={facultyTooltip}>{subAtt.presentCount}</td>
                                    <td className="py-2.5 text-center border-r border-zinc-100 dark:border-zinc-900 font-mono font-semibold" title={facultyTooltip}>
                                      <span className={subAtt.percentage < 75 ? 'text-red-500 dark:text-red-400' : 'text-zinc-700 dark:text-zinc-300'}>
                                        {subAtt.percentage}%
                                      </span>
                                    </td>
                                  </React.Fragment>
                                );
                              })}
                              
                              {showLanguageColumn && languageCell}

                              <td className="py-2.5 px-3 text-right">
                                <span className={`px-2.5 py-0.5 rounded font-bold text-[11px] ${
                                  overallLow
                                    ? 'bg-red-500/20 border border-red-500/30 text-red-650 dark:text-red-400 animate-pulse-subtle'
                                    : overallPct === 'N/A'
                                    ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-400'
                                    : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-650 dark:text-emerald-400'
                                }`}>
                                  {overallPct === 'N/A' ? '-' : `${overallPct}%`}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      } else if (window.location.pathname.endsWith("/courses")) {
        return (
              <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                <CardHeader>
                  <CardTitle className="text-zinc-900 dark:text-white text-base flex items-center space-x-2">
                    <BookOpen className="h-5 w-5 text-zinc-400" />
                    <span>Academic Course Registry</span>
                  </CardTitle>
                  <CardDescription className="text-zinc-500 text-xs">
                    View active course configurations and department divisions.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="overflow-x-auto border border-zinc-150 dark:border-zinc-850 rounded-lg">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-zinc-200 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-900/20 text-zinc-550 dark:text-zinc-400 font-semibold">
                          <th className="py-2.5 px-3">Course / Dept ID</th>
                          <th className="py-2.5 px-3">Course Name</th>
                          <th className="py-2.5 px-3 text-right">Associated College</th>
                        </tr>
                      </thead>
                      <tbody>
                        {courses.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="py-4 text-center text-zinc-500 italic">No courses registered yet.</td>
                          </tr>
                        ) : (
                          courses.map(c => (
                            <tr key={c._id} className="border-b border-zinc-100 dark:border-zinc-900 text-zinc-700 dark:text-zinc-300">
                              <td className="py-2.5 px-3 font-mono font-bold">{c.courseId}</td>
                              <td className="py-2.5 px-3 font-semibold">{c.name}</td>
                              <td className="py-2.5 px-3 text-right uppercase text-[10px] text-zinc-500 font-bold">{c.college || "N/A"}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
        );
      } else {
        return (
              <div className="space-y-6">
                {/* Batch Selector & Management */}
              <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 pb-4">
                  <div>
                    <CardTitle className="text-zinc-900 dark:text-white text-base flex items-center space-x-2">
                      <BookOpen className="h-5 w-5 text-zinc-400" />
                      <span>Department Batches</span>
                    </CardTitle>
                    <CardDescription className="text-zinc-500 text-xs">
                      Manage batches, student rosters, semesters, and section allotments.
                    </CardDescription>
                  </div>
                  <div>
                    {selectedBatch && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedBatch(null)}
                        className="text-xs h-8"
                      >
                        Back to List
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 text-xs">
                  {batchSuccess && (
                    <div className="flex items-start space-x-2 rounded-md border border-emerald-200 dark:border-emerald-900/30 bg-emerald-50 dark:bg-emerald-950/20 p-3 text-emerald-700 dark:text-emerald-400">
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <span>{batchSuccess}</span>
                    </div>
                  )}

                  {batchError && (
                    <div className="flex items-start space-x-2 rounded-md border border-red-200 dark:border-red-955/30 bg-red-50 dark:bg-red-950/20 p-3 text-red-600 dark:text-red-400">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{batchError}</span>
                    </div>
                  )}

                  {!selectedBatch ? (
                    <div className="space-y-6">
                      {/* Create Batch Form */}
                      <form onSubmit={onCreateBatch} className="border border-zinc-150 dark:border-zinc-850 p-4 rounded-lg bg-zinc-50/50 dark:bg-zinc-900/10 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-zinc-900 dark:text-white text-sm">Create New Student Batch</h4>
                          <span className="text-[10px] bg-zinc-150 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-350 px-2 py-0.5 rounded font-medium">
                            Dept: {user.department}
                          </span>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-1">
                            <Label htmlFor="batchId" className="text-zinc-700 dark:text-zinc-300">Batch ID</Label>                            <Input
                              id="batchId"
                              type="text"
                              placeholder="e.g. B2023"
                              value={newBatchId}
                              onChange={(e) => setNewBatchId(e.target.value)}
                              className="h-8 text-xs border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="batchYears" className="text-zinc-700 dark:text-zinc-300">Year Range</Label>                            <Input
                              id="batchYears"
                              type="text"
                              placeholder="e.g. 2023-2026"
                              value={newBatchYears}
                              onChange={(e) => setNewBatchYears(e.target.value)}
                              className="h-8 text-xs border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500"
                            />
                          </div>
                        </div>
                        <Button type="submit" size="sm" className="bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200">
                          Create Batch
                        </Button>
                      </form>

                      {/* Batches Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-zinc-200 dark:border-zinc-850 text-zinc-500 dark:text-zinc-400 font-semibold">
                              <th className="py-2 pr-4">Batch ID</th>
                              <th className="py-2 px-4">Years</th>
                              <th className="py-2 pl-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {batches.length === 0 ? (
                              <tr>
                                <td colSpan={3} className="py-4 text-center text-zinc-500">
                                  No batches created yet.
                                </td>
                              </tr>
                            ) : (
                              batches.map((b) => (
                                <tr key={b._id} className="border-b border-zinc-100 dark:border-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900/10">
                                  <td className="py-2 pr-4 font-mono font-semibold text-zinc-900 dark:text-white">{b.batchId}</td>
                                  <td className="py-2 px-4">{b.years}</td>
                                  <td className="py-2 pl-4 text-right space-x-2">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setSelectedBatch(b)}
                                      className="text-xs h-7 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
                                    >
                                      Manage
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => onDeleteBatch(b._id)}
                                      className="h-7 w-7 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-955/20"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>            </div>
          ) : (
                    <div className="space-y-6">
                      {/* Active Batch Banner */}
                      <div className="bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 p-3 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                          <p className="text-zinc-500 text-[10px] uppercase tracking-wider font-semibold">Active Batch Workspace</p>
                          <p className="text-zinc-900 dark:text-white text-sm font-bold">{selectedBatch.batchId} ({selectedBatch.years})</p>
                        </div>
                        <div className="flex border-b border-zinc-200 dark:border-zinc-800 space-x-4 text-xs">
                          <button
                            type="button"
                            onClick={() => setBatchTab("students")}
                            className={`pb-1 font-medium transition-colors relative ${
                              batchTab === "students"
                                ? "text-zinc-950 dark:text-white font-semibold"
                                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                            }`}
                          >
                            Students Rosters ({students.length})
                            {batchTab === "students" && (
                              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-zinc-950 dark:bg-white" />
                            )}
                          </button>                          <button
                            type="button"
                            onClick={() => setBatchTab("semesters")}
                            className={`pb-1 font-medium transition-colors relative ${
                              batchTab === "semesters"
                                ? "text-zinc-955 dark:text-white font-semibold"
                                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                            }`}
                          >
                            Semesters & Assignments ({semesters.length})
                            {batchTab === "semesters" && (
                              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-zinc-950 dark:bg-white" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Students Sub-tab */}
                      {batchTab === "students" && (
                        <div className="space-y-6">
                          <div className="grid gap-6 md:grid-cols-2">
                            {/* Manual Add Student Form */}
                            <form onSubmit={onAddStudent} className="border border-zinc-150 dark:border-zinc-850 p-4 rounded-lg bg-zinc-50/50 dark:bg-zinc-900/10 space-y-3">
                              <h4 className="font-semibold text-zinc-900 dark:text-white text-xs">Add Single Student Manually</h4>
                              <div className="space-y-2">
                                <div>
                                  <Label htmlFor="studentId" className="text-zinc-700 dark:text-zinc-300">Roll Number / Student ID</Label>                                  <Input
                                    id="studentId"
                                    type="text"
                                    placeholder="e.g. STU202301"
                                    value={newStudentId}
                                    onChange={(e) => setNewStudentId(e.target.value)}
                                    className="h-8 text-xs border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="studentName" className="text-zinc-700 dark:text-zinc-300">Full Name</Label>
                                  <Input
                                    id="studentName"
                                    type="text"
                                    placeholder="e.g. John Doe"
                                    value={newStudentName}
                                    onChange={(e) => setNewStudentName(e.target.value)}
                                    className="h-8 text-xs border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500"
                                  />
                                </div>                                <div>
                                  <Label htmlFor="studentEmail" className="text-zinc-700 dark:text-zinc-300">Email Address</Label>
                                  <Input
                                    id="studentEmail"
                                    type="email"
                                    placeholder="e.g. john.doe@email.com"
                                    value={newStudentEmail}
                                    onChange={(e) => setNewStudentEmail(e.target.value)}
                                    className="h-8 text-xs border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500"
                                  />
                                </div>                                 <div>
                                  {!isManualLanguage && batchLanguages.length > 0 ? (
                                    <>
                                      <Label htmlFor="studentLanguage" className="text-zinc-700 dark:text-zinc-300">Language Subject ID</Label>
                                      <select
                                        id="studentLanguage"
                                        value={newStudentLanguage}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          if (val === "__manual__") {
                                            setIsManualLanguage(true);
                                            setNewStudentLanguage("");
                                          } else {
                                            setNewStudentLanguage(val);
                                          }
                                        }}
                                        className="flex h-8 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white px-3 py-1 text-xs shadow-sm focus:outline-none animate-in fade-in duration-200"
                                      >
                                        {batchLanguages.map((sub) => (
                                          <option key={sub._id} value={sub.subjectId}>
                                            {sub.subjectId} - {sub.name}
                                          </option>
                                        ))}
                                        <option value="__manual__">-- Enter Manually --</option>
                                      </select>
                                    </>
                                  ) : (
                                    <>
                                      <div className="flex items-center justify-between">
                                        <Label htmlFor="studentLanguage" className="text-zinc-700 dark:text-zinc-300">Language Subject ID</Label>
                                        {batchLanguages.length > 0 && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setIsManualLanguage(false);
                                              setNewStudentLanguage(batchLanguages[0].subjectId);
                                            }}
                                            className="text-[10px] text-zinc-500 dark:text-zinc-400 hover:underline"
                                          >
                                            Use Dropdown select
                                          </button>
                                        )}
                                      </div>
                                      <Input
                                        id="studentLanguage"
                                        type="text"
                                        placeholder={batchLanguages.length === 0 ? "e.g. KAN101 (Register language subject first to auto-populate)" : "e.g. KAN101"}
                                        value={newStudentLanguage}
                                        onChange={(e) => setNewStudentLanguage(e.target.value)}
                                        className="h-8 text-xs border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 animate-in fade-in duration-200"
                                      />
                                    </>
                                  )}
                                </div>
                              </div>
                              <Button type="submit" size="sm" className="bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200">
                                Register Student
                              </Button>
                            </form>                            {/* CSV Bulk Upload Form */}
                            <div className="border border-zinc-150 dark:border-zinc-850 p-4 rounded-lg bg-zinc-50/50 dark:bg-zinc-900/10 space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-zinc-900 dark:text-white text-xs">Excel/CSV Bulk Upload</h4>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  onClick={downloadCsvTemplate}
                                  className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold p-0 h-auto hover:bg-transparent"
                                >
                                  Download CSV Template
                                </Button>
                              </div>                              {/* Visual template mock sheet */}
                              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2 rounded text-[10px] font-mono text-zinc-500 space-y-1">
                                <p className="text-zinc-400 font-bold border-b pb-0.5 border-zinc-200 dark:border-zinc-800">Expected Columns (Edit in Excel):</p>
                                <p>studentId,fullName,email,language</p>
                                <p>STU202301,John Doe,john@example.com,KAN101</p>
                              </div>

                              {/* File Upload Option */}
                              <div className="space-y-1">
                                <Label htmlFor="studentFile" className="text-zinc-700 dark:text-zinc-300">Upload Spreadsheet (CSV/TXT)</Label>
                                <Input
                                  id="studentFile"
                                  type="file"
                                  accept=".csv,.txt"
                                  onChange={handleFileUpload}
                                  className="h-8 text-xs border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white file:text-xs file:bg-zinc-100 dark:file:bg-zinc-800 file:border-0 file:rounded-md file:mr-2"
                                />
                              </div>

                              <div className="space-y-1">
                                <Label htmlFor="csvText" className="text-zinc-700 dark:text-zinc-300">Or Paste CSV Content</Label>
                                <textarea
                                  id="csvText"
                                  rows={2}
                                  placeholder="STU202301,John Doe,john@example.com,KAN101&#10;STU202302,Jane Smith,jane@example.com,HIN101"
                                  value={csvText}
                                  onChange={(e) => setCsvText(e.target.value)}
                                  className="w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white p-2 font-mono text-[10px] shadow-sm transition-colors focus-visible:outline-none"
                                />
                              </div>
                              <div className="flex space-x-2">
                                <Button type="button" size="sm" variant="outline" onClick={handleParseCsv} className="text-xs h-8">
                                  Parse Text
                                </Button>
                                {csvPreview.length > 0 && (
                                  <Button type="button" size="sm" onClick={onUploadBulkStudents} className="bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 text-xs h-8">
                                    Upload Bulk ({csvPreview.length})
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Student Table */}
                          <div className="space-y-2">
                            <h4 className="font-semibold text-zinc-900 dark:text-white text-xs">Registered Students roster</h4>
                            <div className="overflow-x-auto border border-zinc-150 dark:border-zinc-850 rounded-lg">
                              <table className="w-full text-left border-collapse">                                <thead>
                                  <tr className="border-b border-zinc-200 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-900/20 text-zinc-500 dark:text-zinc-400 font-semibold">
                                    <th className="py-2 px-4">Student ID</th>
                                    <th className="py-2 px-4">Full Name</th>
                                    <th className="py-2 px-4">Email</th>
                                    <th className="py-2 px-4">Language</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {students.length === 0 ? (
                                    <tr>
                                      <td colSpan={4} className="py-4 text-center text-zinc-500">
                                        No students registered in this batch yet. Use forms above to add.
                                      </td>
                                    </tr>
                                  ) : (
                                    students.map((s) => (
                                      <tr key={s._id} className="border-b border-zinc-100 dark:border-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900/10">
                                        <td className="py-2 px-4 font-mono font-semibold">{s.studentId}</td>
                                        <td className="py-2 px-4">{s.fullName}</td>
                                        <td className="py-2 px-4 text-zinc-500">{s.email}</td>
                                        <td className="py-2 px-4 font-semibold uppercase text-[10px] text-zinc-600 dark:text-zinc-400">{s.language || 'kan'}</td>
                                      </tr>
                                    ))
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Semesters & Sections Sub-tab */}
                      {batchTab === "semesters" && (
                        <div className="space-y-6">
                          <div className="grid gap-6 md:grid-cols-2">
                            {/* Create Semester Form */}
                            <form onSubmit={onCreateSemester} className="border border-zinc-150 dark:border-zinc-850 p-4 rounded-lg bg-zinc-50/50 dark:bg-zinc-900/10 space-y-3">
                              <h4 className="font-semibold text-zinc-900 dark:text-white text-xs">Create New Academic Semester</h4>
                              <div className="space-y-2">
                                <Label htmlFor="semName" className="text-zinc-700 dark:text-zinc-300">Semester Name / Level</Label>                                <Input
                                  id="semName"
                                  type="text"
                                  placeholder="e.g. Semester 1"
                                  value={newSemesterName}
                                  onChange={(e) => setNewSemesterName(e.target.value)}
                                  className="h-8 text-xs border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500"
                                />
                              </div>
                              <Button type="submit" size="sm" className="bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200">
                                Add Semester
                              </Button>
                            </form>

                            {/* Select Active Semester & Create Sections */}
                            <div className="border border-zinc-150 dark:border-zinc-850 p-4 rounded-lg bg-zinc-50/50 dark:bg-zinc-900/10 space-y-3">
                              <h4 className="font-semibold text-zinc-900 dark:text-white text-xs">Select Semester to Manage Sections</h4>
                              <select
                                className="flex h-8 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none"
                                value={selectedSemester?._id || ""}
                                onChange={(e) => {
                                  const sem = semesters.find(s => s._id === e.target.value);
                                  setSelectedSemester(sem || null);
                                  setSections([]);
                                  setAllotments([]);
                                }}
                              >
                                <option value="">-- Choose Semester --</option>
                                {semesters.map(s => (
                                  <option key={s._id} value={s._id}>{s.name}</option>
                                ))}
                              </select>

                              {selectedSemester && (
                                <form onSubmit={onCreateSection} className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                                  <Label htmlFor="secName" className="text-zinc-700 dark:text-zinc-300 font-semibold text-[11px]">Add Section (Optional)</Label>
                                  <div className="flex space-x-2">                                    <Input
                                      id="secName"
                                      type="text"
                                      placeholder="e.g. Section A"
                                      value={newSectionName}
                                      onChange={(e) => setNewSectionName(e.target.value)}
                                      className="h-8 text-xs border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500"
                                    />
                                    <Button type="submit" size="sm" className="bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 text-xs h-8 shrink-0">
                                      Add Section
                                    </Button>
                                  </div>
                                  <div className="flex flex-wrap gap-1.5 pt-1">
                                    <span className="text-[10px] text-zinc-500 font-semibold self-center mr-1">Created Sections:</span>
                                    {sections.length === 0 ? (
                                      <span className="text-[10px] text-zinc-400 italic">None</span>
                                    ) : (
                                      sections.map(sec => (
                                        <span key={sec._id} className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-850 text-zinc-700 dark:text-zinc-300 font-semibold">
                                          {sec.name}
                                        </span>
                                      ))
                                    )}
                                  </div>
                                </form>
                              )}
                            </div>
                          </div>                          {/* Student Section Assignment Grid */}
                          {selectedSemester && (
                            <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 bg-white dark:bg-zinc-950 space-y-4">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                                <div>
                                  <h4 className="font-semibold text-zinc-900 dark:text-white text-xs">Student Section Assignment - {selectedSemester.name}</h4>
                                  <p className="text-[10px] text-zinc-500">Assign students to sections. Click "Save Assignments" to persist your changes.</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <select
                                    className="flex h-8 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-900 dark:text-white px-2 py-0.5 text-xs shadow-sm focus:outline-none"
                                    value={bulkSectionId}
                                    onChange={(e) => setBulkSectionId(e.target.value)}
                                  >
                                    <option value="">-- Bulk Assign --</option>
                                    <option value="clear">Clear Assignment</option>
                                    {sections.map(sec => (
                                      <option key={sec._id} value={sec._id}>{sec.name}</option>
                                    ))}
                                  </select>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      if (!bulkSectionId) return;
                                      const updated = { ...localAllotments };
                                      selectedStudentIds.forEach(id => {
                                        updated[id] = bulkSectionId === "clear" ? "" : bulkSectionId;
                                      });
                                      setLocalAllotments(updated);
                                      setSelectedStudentIds([]);
                                      setBulkSectionId("");
                                    }}
                                    className="text-xs h-8"
                                    disabled={selectedStudentIds.length === 0}
                                  >
                                    Assign Selected ({selectedStudentIds.length})
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => {
                                      const list = Object.keys(localAllotments).map(id => ({
                                        studentId: id,
                                        sectionId: localAllotments[id] || null,
                                      }));
                                      onSaveAllotments(list);
                                    }}
                                    className="bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 text-xs h-8"
                                  >
                                    Save Assignments
                                  </Button>
                                </div>
                              </div>

                              <div className="overflow-x-auto border border-zinc-150 dark:border-zinc-850 rounded-lg">
                                <table className="w-full text-left border-collapse">
                                  <thead>
                                    <tr className="border-b border-zinc-200 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-900/20 text-zinc-500 dark:text-zinc-400 font-semibold">
                                      <th className="py-2 px-4 w-10">
                                        <input
                                          type="checkbox"
                                          checked={students.length > 0 && selectedStudentIds.length === students.length}
                                          onChange={(e) => {
                                            if (e.target.checked) {
                                              setSelectedStudentIds(students.map(s => s._id));
                                            } else {
                                              setSelectedStudentIds([]);
                                            }
                                          }}
                                          className="rounded border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                                        />
                                      </th>                                      <th className="py-2 px-4">Student ID</th>
                                      <th className="py-2 px-4">Full Name</th>
                                      <th className="py-2 px-4">Language</th>
                                      <th className="py-2 px-4 text-right">Assigned Section</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {students.length === 0 ? (
                                      <tr>
                                        <td colSpan={5} className="py-4 text-center text-zinc-500">
                                          No students registered in this batch yet.
                                        </td>
                                      </tr>
                                    ) : (
                                      students.map((s) => (
                                        <tr key={s._id} className="border-b border-zinc-100 dark:border-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900/10">
                                          <td className="py-2 px-4">
                                            <input
                                              type="checkbox"
                                              checked={selectedStudentIds.includes(s._id)}
                                              onChange={(e) => {
                                                if (e.target.checked) {
                                                  setSelectedStudentIds([...selectedStudentIds, s._id]);
                                                } else {
                                                  setSelectedStudentIds(selectedStudentIds.filter(id => id !== s._id));
                                                }
                                              }}
                                              className="rounded border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                                            />
                                          </td>
                                          <td className="py-2 px-4 font-mono font-semibold">{s.studentId}</td>
                                          <td className="py-2 px-4">{s.fullName}</td>
                                          <td className="py-2 px-4 font-bold uppercase text-[10px] text-zinc-550 dark:text-zinc-450">{s.language || 'kan'}</td>
                                          <td className="py-2 px-4 text-right">
                                            <select
                                              className="h-7 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-2 py-0.5 text-[11px] font-semibold text-zinc-800 dark:text-zinc-200"
                                              value={localAllotments[s._id] || ""}
                                              onChange={(e) => {
                                                setLocalAllotments({
                                                  ...localAllotments,
                                                  [s._id]: e.target.value,
                                                });
                                              }}
                                            >                                              <option value="">-- Unassigned --</option>
                                              {sections.map(sec => (
                                                <option key={sec._id} value={sec._id}>{sec.name}</option>
                                              ))}
                                            </select>
                                          </td>
                                        </tr>
                                      ))
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}                </CardContent>
              </Card>
            </div>
        );
      }
    } else if (user.role === "Faculty") {
      if (window.location.pathname.endsWith("/grades")) {
        return (
              <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                <CardHeader>
                  <CardTitle className="text-zinc-900 dark:text-white text-base flex items-center space-x-2">
                    <FileSpreadsheet className="h-5 w-5 text-zinc-400" />
                    <span>Academic Grades Ledger</span>
                  </CardTitle>
                  <CardDescription className="text-zinc-505 text-xs">
                    Grades, marks, and student evaluations ledger.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-xs">
                  <div className="border border-zinc-200 dark:border-zinc-800 p-6 rounded-md bg-zinc-50 dark:bg-zinc-900/10 flex flex-col items-center justify-center text-center space-y-2">
                    <Activity className="h-8 w-8 text-zinc-500 animate-pulse" />
                    <h4 className="font-semibold text-zinc-900 dark:text-white">Academic grading ledger not open</h4>
                    <p className="text-zinc-500 max-w-sm">
                      Functional modules for entering semester grades, report card generation, and student marks distribution are part of subsequent releases.
                    </p>
                  </div>
                </CardContent>
              </Card>
        );
      } else if (window.location.pathname.endsWith("/assignments")) {
        const availableSemesters = myAllocations
          .filter(a => a.course === selectedFacultyCourse)
          .map(a => a.semester)
          .filter((sem, index, self) => sem && self.findIndex(s => s._id === sem._id) === index);

        const availableSections = myAllocations
          .filter(a => a.course === selectedFacultyCourse && a.semester?._id === selectedFacultySemesterId)
          .map(a => a.section)
          .filter((sec, index, self) => self.findIndex(s => (s?._id || "sem") === (sec?._id || "sem")) === index);

        const availableSubjects = myAllocations
          .filter(a => 
            a.course === selectedFacultyCourse && 
            a.semester?._id === selectedFacultySemesterId && 
            (a.section?._id || "semester-wide") === (selectedFacultySectionId || "semester-wide")
          )
          .map(a => a.subject)
          .filter((sub, index, self) => sub && self.findIndex(s => s._id === sub._id) === index);

        return (
            <div className="space-y-6">
              {/* Filter Selection Panel */}
              <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm animate-in fade-in duration-200">
                <CardHeader>
                  <CardTitle className="text-zinc-900 dark:text-white text-base flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-zinc-400" />
                    <span>Assignments Submission Ledger</span>
                  </CardTitle>
                  <CardDescription className="text-zinc-500 text-xs">
                    Select Course, Subject/Section allocation to manage student coursework assignments.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
                  {/* Course Filter Dropdown */}
                  <div className="space-y-1">
                    <Label className="text-zinc-700 dark:text-zinc-300 text-xs">Course / Department</Label>
                    <select
                      className="flex h-8 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white px-3 py-1 text-xs shadow-sm focus-visible:outline-none"
                      value={selectedFacultyCourse}
                      onChange={(e) => {
                        const courseVal = e.target.value;
                        setSelectedFacultyCourse(courseVal);
                        setSelectedFacultySemesterId("");
                        setSelectedFacultySectionId("");
                        setSelectedFacultySubjectId("");
                        setSelectedFacultyAllocId("");
                      }}
                    >
                      <option value="">-- Select Course --</option>
                      {[...new Set(myAllocations.map(a => a.course))].sort().map(course => (
                        <option key={course} value={course}>{course}</option>
                      ))}
                    </select>
                  </div>

                  {/* Semester Dropdown */}
                  <div className="space-y-1">
                    <Label className="text-zinc-700 dark:text-zinc-300 text-xs">Semester</Label>
                    <select
                      className="flex h-8 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white px-3 py-1 text-xs shadow-sm focus-visible:outline-none"
                      value={selectedFacultySemesterId}
                      onChange={(e) => {
                        const semVal = e.target.value;
                        setSelectedFacultySemesterId(semVal);
                        setSelectedFacultySectionId("");
                        setSelectedFacultySubjectId("");
                        setSelectedFacultyAllocId("");
                      }}
                      disabled={!selectedFacultyCourse}
                    >
                      <option value="">-- Select Semester --</option>
                      {availableSemesters.map(sem => (
                        <option key={sem._id} value={sem._id}>{sem.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Session / Section Dropdown */}
                  <div className="space-y-1">
                    <Label className="text-zinc-700 dark:text-zinc-300 text-xs">Session / Section</Label>
                    <select
                      className="flex h-8 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white px-3 py-1 text-xs shadow-sm focus-visible:outline-none"
                      value={selectedFacultySectionId}
                      onChange={(e) => {
                        const secVal = e.target.value;
                        setSelectedFacultySectionId(secVal);
                        setSelectedFacultySubjectId("");
                        setSelectedFacultyAllocId("");
                      }}
                      disabled={!selectedFacultySemesterId}
                    >
                      <option value="">-- Select Section --</option>
                      {availableSections.map(sec => {
                        const val = sec ? sec._id : "semester-wide";
                        const label = sec ? `Section ${sec.name}` : "Semester-wide (All)";
                        return <option key={val} value={val}>{label}</option>;
                      })}
                    </select>
                  </div>

                  {/* Subject Dropdown */}
                  <div className="space-y-1">
                    <Label className="text-zinc-700 dark:text-zinc-300 text-xs">Subject</Label>
                    <select
                      className="flex h-8 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white px-3 py-1 text-xs shadow-sm focus-visible:outline-none"
                      value={selectedFacultySubjectId}
                      onChange={(e) => {
                        const subVal = e.target.value;
                        setSelectedFacultySubjectId(subVal);
                        if (subVal) {
                          const matchingAlloc = myAllocations.find(a => 
                            a.course === selectedFacultyCourse &&
                            a.semester?._id === selectedFacultySemesterId &&
                            (a.section?._id || "semester-wide") === (selectedFacultySectionId || "semester-wide") &&
                            a.subject?._id === subVal
                          );
                          if (matchingAlloc) {
                            setSelectedFacultyAllocId(matchingAlloc._id);
                            fetchAssignments(matchingAlloc._id);
                          } else {
                            setSelectedFacultyAllocId("");
                          }
                        } else {
                          setSelectedFacultyAllocId("");
                        }
                      }}
                      disabled={!selectedFacultySectionId}
                    >
                      <option value="">-- Select Subject --</option>
                      {availableSubjects.map(sub => (
                        <option key={sub._id} value={sub._id}>{sub.name} ({sub.subjectId})</option>
                      ))}
                    </select>
                  </div>
                </CardContent>
              </Card>

              {/* Assignments Card */}
              {selectedFacultyAllocId && (
                <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm animate-in fade-in duration-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b border-zinc-100 dark:border-zinc-900">
                    <div>
                      <CardTitle className="text-zinc-900 dark:text-white text-xs font-semibold">
                        Assignments Submission Ledger
                      </CardTitle>
                      <CardDescription className="text-[10px] text-zinc-550 dark:text-zinc-500 mt-1">
                        Create coursework tasks and track student submissions.
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      {assignments.length > 0 && !isCreateAssignmentOpen && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={downloadAllAssignmentsExcel}
                          className="text-[10px] h-7 px-3 border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-955/20 text-emerald-600 flex items-center space-x-1"
                        >
                          <FileSpreadsheet className="h-3.5 w-3.5" />
                          <span>Export All Excel</span>
                        </Button>
                      )}
                      <Button
                        type="button"
                        onClick={() => setIsCreateAssignmentOpen(!isCreateAssignmentOpen)}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 text-[10px] h-7 px-3 flex items-center space-x-1"
                      >
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span>{isCreateAssignmentOpen ? "View List" : "Create Assignment"}</span>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    {isCreateAssignmentOpen ? (
                      <form onSubmit={handleCreateAssignment} className="space-y-3 max-w-md border border-zinc-100 dark:border-zinc-800 p-4 rounded-lg bg-zinc-50/50 dark:bg-zinc-900/5">
                        <h4 className="text-xs font-bold text-zinc-900 dark:text-white">Create New Course Assignment</h4>
                        
                        <div className="space-y-1 text-xs">
                          <Label htmlFor="assignTitle">Assignment Title</Label>
                          <Input
                            id="assignTitle"
                            type="text"
                            placeholder="e.g. Midterm Lab Journal"
                            value={newAssignmentTitle}
                            onChange={(e) => setNewAssignmentTitle(e.target.value)}
                            className="h-8 text-xs bg-white dark:bg-zinc-900"
                            required
                          />
                        </div>

                        <div className="space-y-1 text-xs">
                          <Label htmlFor="assignDesc">Description (Optional)</Label>
                          <Input
                            id="assignDesc"
                            type="text"
                            placeholder="e.g. Write experiments 1-5"
                            value={newAssignmentDesc}
                            onChange={(e) => setNewAssignmentDesc(e.target.value)}
                            className="h-8 text-xs bg-white dark:bg-zinc-900"
                          />
                        </div>

                        <div className="space-y-1 text-xs">
                          <Label htmlFor="assignDueDate">Due Date</Label>
                          <Input
                            id="assignDueDate"
                            type="date"
                            value={newAssignmentDueDate}
                            onChange={(e) => setNewAssignmentDueDate(e.target.value)}
                            className="h-8 text-xs bg-white dark:bg-zinc-900"
                            required
                          />
                        </div>

                        <Button
                          type="submit"
                          disabled={isAssignmentSubmitting}
                          size="sm"
                          className="bg-primary text-primary-foreground hover:bg-primary/90 mt-2 px-4 py-1.5 text-xs font-semibold shadow-sm"
                        >
                          {isAssignmentSubmitting ? "Creating..." : "Save Assignment"}
                        </Button>
                      </form>
                    ) : (
                      <>
                        {assignmentsLoading ? (
                          <div className="flex flex-col items-center justify-center p-12 space-y-4">
                            <div className="h-7 w-7 animate-spin rounded-full border-2 border-zinc-200 dark:border-zinc-850 border-t-zinc-850 dark:border-t-zinc-200" />
                            <span className="text-zinc-500 text-xs font-semibold animate-pulse">Loading assignments roster...</span>
                          </div>
                        ) : assignments.length === 0 ? (
                          <div className="p-6 text-center text-zinc-505 italic text-xs">
                            No assignments created yet for this class subject. Click "Create Assignment" to add one.
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {/* Assignments List Sorting/Filtering Controls */}
                            <div className="flex flex-col sm:flex-row gap-2 pb-2">
                              <div className="relative flex-1">
                                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                                <Input
                                  type="text"
                                  placeholder="Search assignments..."
                                  value={assignmentSearch}
                                  onChange={(e) => setAssignmentSearch(e.target.value)}
                                  className="h-8 pl-8 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                                />
                              </div>
                              <div className="flex gap-2">
                                <select
                                  className="h-8 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white px-2 py-1 text-xs shadow-sm focus:outline-none"
                                  value={assignmentFilter}
                                  onChange={(e) => setAssignmentFilter(e.target.value)}
                                >
                                  <option value="all">All Status</option>
                                  <option value="completed">Completed (All Submitted)</option>
                                  <option value="pending">Pending Submissions</option>
                                </select>
                                <select
                                  className="h-8 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white px-2 py-1 text-xs shadow-sm focus:outline-none"
                                  value={assignmentSort}
                                  onChange={(e) => setAssignmentSort(e.target.value)}
                                >
                                  <option value="dueDateAsc">Due Date (Soonest first)</option>
                                  <option value="dueDateDesc">Due Date (Latest first)</option>
                                  <option value="titleAsc">Title (A-Z)</option>
                                  <option value="createdAtDesc">Created (Newest first)</option>
                                </select>
                              </div>
                            </div>

                            {getFilteredAndSortedAssignments().length === 0 ? (
                              <div className="p-6 text-center text-zinc-500 italic text-xs border border-zinc-250 dark:border-zinc-850 rounded-lg">
                                No assignments match your search or filter criteria.
                              </div>
                            ) : (
                              <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                                {getFilteredAndSortedAssignments().map((assign) => {
                                  const submittedCount = assign.submissions.filter(s => s.status === 'submitted').length;
                                  const totalCount = assign.submissions.length;
                                  const isSelected = selectedAssignment?._id === assign._id;
                                  
                                  return (
                                    <div
                                      key={assign._id}
                                      className={`p-3 border rounded-lg cursor-pointer transition-all flex flex-col justify-between ${
                                        isSelected
                                          ? 'border-primary bg-primary/5 dark:bg-primary/10'
                                          : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/10'
                                      }`}
                                      onClick={() => setSelectedAssignment(assign)}
                                    >
                                      <div>
                                        <div className="flex items-start justify-between">
                                          <h4 className="text-xs font-bold text-zinc-900 dark:text-white truncate pr-2">{assign.title}</h4>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDeleteAssignment(assign._id);
                                            }}
                                            className="text-red-500 hover:text-red-700 text-[10px] shrink-0"
                                          >
                                            Delete
                                          </button>
                                        </div>
                                        <p className="text-[10px] text-zinc-550 dark:text-zinc-500 line-clamp-1 mt-0.5">{assign.description || 'No description'}</p>
                                      </div>
                                      <div className="mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-between text-[9px] font-bold text-zinc-500">
                                        <span>Due: {new Date(assign.dueDate).toLocaleDateString()}</span>
                                        <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-1.5 py-0.5 rounded">
                                          {submittedCount} / {totalCount} Submitted
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Submissions Details table for selected Assignment */}
                            {selectedAssignment && (
                              <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 space-y-3 bg-zinc-50/50 dark:bg-zinc-900/5 animate-in fade-in duration-200">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2 gap-2">
                                  <div>
                                    <h4 className="text-xs font-bold text-zinc-900 dark:text-white">
                                      Submission Register: {selectedAssignment.title}
                                    </h4>
                                    <p className="text-[10px] text-zinc-500">
                                      Click toggle buttons to mark submission status.
                                    </p>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="xs"
                                    onClick={() => downloadAssignmentExcel(selectedAssignment)}
                                    className="text-[10px] h-7 px-2 border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-955/20 text-emerald-600 flex items-center space-x-1 self-start"
                                  >
                                    <FileSpreadsheet className="h-3.5 w-3.5" />
                                    <span>Download Excel</span>
                                  </Button>
                                </div>

                                {/* Submissions Sorting/Filtering Controls */}
                                <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 pb-1">
                                  <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                                    <Input
                                      type="text"
                                      placeholder="Search student or roll no..."
                                      value={submissionSearch}
                                      onChange={(e) => setSubmissionSearch(e.target.value)}
                                      className="h-8 pl-8 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                                    />
                                  </div>
                                  <select
                                    className="h-8 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white px-2 py-1 text-xs shadow-sm focus:outline-none"
                                    value={submissionFilterStatus}
                                    onChange={(e) => setSubmissionFilterStatus(e.target.value)}
                                  >
                                    <option value="all">All Submissions</option>
                                    <option value="submitted">Submitted</option>
                                    <option value="pending">Pending</option>
                                  </select>
                                  <select
                                    className="h-8 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white px-2 py-1 text-xs shadow-sm focus:outline-none"
                                    value={submissionFilterLanguage}
                                    onChange={(e) => setSubmissionFilterLanguage(e.target.value)}
                                  >
                                    <option value="all">All Languages</option>
                                    {getSubmissionsLanguages().map(lang => (
                                      <option key={lang} value={lang}>{lang.toUpperCase()}</option>
                                    ))}
                                  </select>
                                  <select
                                    className="h-8 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white px-2 py-1 text-xs shadow-sm focus:outline-none"
                                    value={submissionSort}
                                    onChange={(e) => setSubmissionSort(e.target.value)}
                                  >
                                    <option value="rollAsc">Roll Number (Asc)</option>
                                    <option value="rollDesc">Roll Number (Desc)</option>
                                    <option value="nameAsc">Name (A-Z)</option>
                                    <option value="statusSubmitted">Submitted First</option>
                                    <option value="statusPending">Pending First</option>
                                  </select>
                                </div>

                                <div className="overflow-x-auto border border-zinc-150 dark:border-zinc-850 rounded-lg bg-white dark:bg-zinc-950">
                                  <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                      <tr className="border-b border-zinc-200 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-900/20 text-zinc-505 dark:text-zinc-400 font-semibold">
                                        <th className="py-2.5 px-3">Roll Number</th>
                                        <th className="py-2.5 px-3">Student Name</th>
                                        <th className="py-2.5 px-3">Language</th>
                                        <th className="py-2.5 px-3 text-right">Submission Status</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {getFilteredAndSortedSubmissions().length === 0 ? (
                                        <tr>
                                          <td colSpan={4} className="py-8 text-center text-zinc-500 italic text-xs">
                                            No student submissions match search/filter criteria.
                                          </td>
                                        </tr>
                                      ) : (
                                        getFilteredAndSortedSubmissions().map((sub) => {
                                          const student = sub.student || {};
                                          return (
                                            <tr key={student._id} className="border-b border-zinc-100 dark:border-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900/10">
                                              <td className="py-2 px-3 font-mono font-bold">{student.studentId || 'N/A'}</td>
                                              <td className="py-2 px-3 font-medium">{student.fullName || 'Unknown'}</td>
                                              <td className="py-2 px-3 uppercase text-[10px] font-bold text-zinc-500">{student.language || 'N/A'}</td>
                                              <td className="py-2 px-3 text-right">
                                                <button
                                                  type="button"
                                                  onClick={() => handleToggleSubmission(selectedAssignment, student._id, sub.status)}
                                                  className={`px-3 py-1 text-[10px] font-bold rounded-md border transition-all ${
                                                    sub.status === 'submitted'
                                                      ? 'bg-emerald-500 border-emerald-600 text-white shadow-sm'
                                                      : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-555 dark:text-zinc-400 hover:bg-zinc-50'
                                                  }`}
                                                >
                                                  {sub.status === 'submitted' ? 'Submitted' : 'Pending'}
                                                </button>
                                              </td>
                                            </tr>
                                          );
                                        })
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
        );
      } else {
        const availableSemesters = myAllocations
          .filter(a => a.course === selectedFacultyCourse)
          .map(a => a.semester)
          .filter((sem, index, self) => sem && self.findIndex(s => s._id === sem._id) === index);

        const availableSections = myAllocations
          .filter(a => a.course === selectedFacultyCourse && a.semester?._id === selectedFacultySemesterId)
          .map(a => a.section)
          .filter((sec, index, self) => self.findIndex(s => (s?._id || "sem") === (sec?._id || "sem")) === index);

        const availableSubjects = myAllocations
          .filter(a => 
            a.course === selectedFacultyCourse && 
            a.semester?._id === selectedFacultySemesterId && 
            (a.section?._id || "semester-wide") === (selectedFacultySectionId || "semester-wide")
          )
          .map(a => a.subject)
          .filter((sub, index, self) => sub && self.findIndex(s => s._id === sub._id) === index);

        return (
              <div className="space-y-6">
              {/* Status Messages */}
              {attendanceError && (
                <div className="p-3 text-xs text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-950/20 rounded animate-in fade-in duration-200">
                  {attendanceError}
                </div>
              )}
              {attendanceSuccess && (
                <div className="p-3 text-xs text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30 bg-emerald-50 dark:bg-emerald-950/20 rounded animate-in fade-in duration-200">
                  {attendanceSuccess}
                </div>
              )}

              {/* Filter Selection Panel */}
              <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                <CardHeader>
                  <CardTitle className="text-zinc-900 dark:text-white text-base flex items-center space-x-2">
                    <BookOpen className="h-5 w-5 text-zinc-400" />
                    <span>Daily Student Attendance Register</span>
                  </CardTitle>
                  <CardDescription className="text-zinc-500 text-xs">
                    Select Course, Subject/Section allocation, and Date to mark daily student attendance.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-5">
                  {/* Course Filter Dropdown */}
                  <div className="space-y-1">
                    <Label className="text-zinc-700 dark:text-zinc-300 text-xs">Course / Department</Label>
                    <select
                      className="flex h-8 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white px-3 py-1 text-xs shadow-sm focus-visible:outline-none"
                      value={selectedFacultyCourse}
                      onChange={(e) => {
                        const courseVal = e.target.value;
                        setSelectedFacultyCourse(courseVal);
                        setSelectedFacultySemesterId("");
                        setSelectedFacultySectionId("");
                        setSelectedFacultySubjectId("");
                        setSelectedFacultyAllocId("");
                        setAttendanceStudents([]);
                      }}
                    >
                      <option value="">-- Select Course --</option>
                      {[...new Set(myAllocations.map(a => a.course))].sort().map(course => (
                        <option key={course} value={course}>{course}</option>
                      ))}
                    </select>
                  </div>

                  {/* Semester Dropdown */}
                  <div className="space-y-1">
                    <Label className="text-zinc-700 dark:text-zinc-300 text-xs">Semester</Label>
                    <select
                      className="flex h-8 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white px-3 py-1 text-xs shadow-sm focus-visible:outline-none"
                      value={selectedFacultySemesterId}
                      onChange={(e) => {
                        const semVal = e.target.value;
                        setSelectedFacultySemesterId(semVal);
                        setSelectedFacultySectionId("");
                        setSelectedFacultySubjectId("");
                        setSelectedFacultyAllocId("");
                        setAttendanceStudents([]);
                      }}
                      disabled={!selectedFacultyCourse}
                    >
                      <option value="">-- Select Semester --</option>
                      {availableSemesters.map(sem => (
                        <option key={sem._id} value={sem._id}>{sem.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Session / Section Dropdown */}
                  <div className="space-y-1">
                    <Label className="text-zinc-700 dark:text-zinc-300 text-xs">Session / Section</Label>
                    <select
                      className="flex h-8 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white px-3 py-1 text-xs shadow-sm focus-visible:outline-none"
                      value={selectedFacultySectionId}
                      onChange={(e) => {
                        const secVal = e.target.value;
                        setSelectedFacultySectionId(secVal);
                        setSelectedFacultySubjectId("");
                        setSelectedFacultyAllocId("");
                        setAttendanceStudents([]);
                      }}
                      disabled={!selectedFacultySemesterId}
                    >
                      <option value="">-- Select Section --</option>
                      {availableSections.map(sec => {
                        const val = sec ? sec._id : "semester-wide";
                        const label = sec ? `Section ${sec.name}` : "Semester-wide (All)";
                        return <option key={val} value={val}>{label}</option>;
                      })}
                    </select>
                  </div>

                  {/* Subject Dropdown */}
                  <div className="space-y-1">
                    <Label className="text-zinc-700 dark:text-zinc-300 text-xs">Subject</Label>
                    <select
                      className="flex h-8 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white px-3 py-1 text-xs shadow-sm focus-visible:outline-none"
                      value={selectedFacultySubjectId}
                      onChange={(e) => {
                        const subVal = e.target.value;
                        setSelectedFacultySubjectId(subVal);
                        if (subVal) {
                          const matchingAlloc = myAllocations.find(a => 
                            a.course === selectedFacultyCourse &&
                            a.semester?._id === selectedFacultySemesterId &&
                            (a.section?._id || "semester-wide") === (selectedFacultySectionId || "semester-wide") &&
                            a.subject?._id === subVal
                          );
                          if (matchingAlloc) {
                            setSelectedFacultyAllocId(matchingAlloc._id);
                            fetchAttendanceStudents(matchingAlloc._id, selectedFacultyDate);
                          } else {
                            setSelectedFacultyAllocId("");
                            setAttendanceStudents([]);
                          }
                        } else {
                          setSelectedFacultyAllocId("");
                          setAttendanceStudents([]);
                        }
                      }}
                      disabled={!selectedFacultySectionId}
                    >
                      <option value="">-- Select Subject --</option>
                      {availableSubjects.map(sub => (
                        <option key={sub._id} value={sub._id}>{sub.name} ({sub.subjectId})</option>
                      ))}
                    </select>
                  </div>

                  {/* Date Picker */}
                  <div className="space-y-1">
                    <Label className="text-zinc-700 dark:text-zinc-300 text-xs">Attendance Date</Label>
                    <Input
                      type="date"
                      value={selectedFacultyDate}
                      onChange={(e) => {
                        const dateVal = e.target.value;
                        setSelectedFacultyDate(dateVal);
                        if (selectedFacultyAllocId) {
                          fetchAttendanceStudents(selectedFacultyAllocId, dateVal);
                        }
                      }}
                      className="h-8 text-xs border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
                    />
                  </div>
                </CardContent>
              </Card>              {selectedFacultyAllocId && (
                <div className="flex border border-zinc-200 dark:border-zinc-800 rounded-lg p-1 bg-zinc-50 dark:bg-zinc-900/50 space-x-2 text-[11px] font-semibold mb-4 w-full sm:max-w-xl animate-in fade-in duration-200">
                  <button
                    type="button"
                    onClick={() => setFacultyTab("mark")}
                    className={`flex-1 py-1.5 px-3 rounded-md transition-all text-center ${
                      facultyTab === "mark"
                        ? "bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-800 dark:border-zinc-850 shadow-sm font-bold"
                        : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                    }`}
                  >
                    Mark Attendance
                  </button>
                  <button
                    type="button"
                    onClick={() => setFacultyTab("consolidated")}
                    className={`flex-1 py-1.5 px-3 rounded-md transition-all text-center ${
                      facultyTab === "consolidated"
                        ? "bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-800 dark:border-zinc-850 shadow-sm font-bold"
                        : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                    }`}
                  >
                    Consolidated Report
                  </button>
                  <button
                    type="button"
                    onClick={() => setFacultyTab("history")}
                    className={`flex-1 py-1.5 px-3 rounded-md transition-all text-center ${
                      facultyTab === "history"
                        ? "bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-800 dark:border-zinc-850 shadow-sm font-bold"
                        : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                    }`}
                  >
                    Attendance History Logs
                  </button>
                  <button
                    type="button"
                    onClick={() => setFacultyTab("assignments")}
                    className={`flex-1 py-1.5 px-3 rounded-md transition-all text-center ${
                      facultyTab === "assignments"
                        ? "bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-800 dark:border-zinc-850 shadow-sm font-bold"
                        : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                    }`}
                  >
                    Assignments
                  </button>
                </div>
              )}

              {/* Attendance Marker Grid */}
              {selectedFacultyAllocId && facultyTab === "mark" && (
                <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-zinc-100 dark:border-zinc-900">
                    <div>
                      <CardTitle className="text-zinc-900 dark:text-white text-xs font-semibold">
                        Roster List {attendanceIsMarked && <span className="ml-2 text-[10px] bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 px-1.5 py-0.5 rounded font-bold uppercase">Marked</span>}
                      </CardTitle>
                      <CardDescription className="text-[10px] text-zinc-550 dark:text-zinc-500 mt-1">
                        Toggle each student status or use bulk actions, then click save.
                      </CardDescription>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        onClick={downloadDailyAttendanceExcel}
                        className="text-[10px] h-7 px-2 border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-955/20 text-emerald-600 flex items-center space-x-1"
                        disabled={attendanceStudents.length === 0}
                      >
                        <FileSpreadsheet className="h-3.5 w-3.5" />
                        <span>Download Excel</span>
                      </Button>
                       <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        onClick={() => {
                          setAttendanceStudents(prev => prev.map(s => ({ ...s, status: 'present' })));
                        }}
                        disabled={attendanceStudents.length === 0 || !attendanceEditable}
                        className="text-[10px] h-7 px-2"
                      >
                        Mark All Present
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        onClick={() => {
                          setAttendanceStudents(prev => prev.map(s => ({ ...s, status: 'absent' })));
                        }}
                        disabled={attendanceStudents.length === 0 || !attendanceEditable}
                        className="text-[10px] h-7 px-2 border-red-200 hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-955/20 text-red-600"
                      >
                        Mark All Absent
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    {attendanceLoading ? (
                      <div className="flex flex-col items-center justify-center p-12 space-y-4">
                        <div className="h-7 w-7 animate-spin rounded-full border-2 border-zinc-200 dark:border-zinc-800 border-t-zinc-800 dark:border-t-zinc-200" />
                        <span className="text-zinc-500 text-xs font-semibold animate-pulse">Loading student register roster...</span>
                      </div>
                    ) : (
                      <>
                        {attendanceIsMarked && !attendanceEditable && (
                          <div className="flex items-start space-x-2 rounded-md border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-955/15 p-3 text-xs text-amber-700 dark:text-amber-300">
                            <Lock className="h-4 w-4 shrink-0 mt-0.5" />
                            <span>
                              This attendance register was submitted more than 30 minutes ago and is locked. Editing is disabled. Please contact your HOD if corrections are required.
                            </span>
                          </div>
                        )}
                        {attendanceIsMarked && attendanceEditable && attendanceMinsRemaining !== null && (
                          <div className="flex items-start space-x-2 rounded-md border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-955/15 p-3 text-xs text-emerald-700 dark:text-emerald-300">
                            <Clock className="h-4 w-4 shrink-0 mt-0.5 animate-pulse" />
                            <span>
                              This register is marked. You can edit it for another <strong>{attendanceMinsRemaining} minutes</strong>.
                            </span>
                          </div>
                        )}

                        {attendanceStudents.length > 0 && (
                          <div className="grid grid-cols-3 gap-3 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-lg text-center animate-in fade-in duration-200">
                            <div className="space-y-0.5">
                              <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Total Strength</p>
                              <p className="text-sm font-bold text-zinc-900 dark:text-white">{attendanceStudents.length}</p>
                            </div>
                            <div className="space-y-0.5 border-l border-zinc-200 dark:border-zinc-800">
                              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium uppercase tracking-wider">Present</p>
                              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                {attendanceStudents.filter(s => s.status === 'present').length}
                              </p>
                            </div>
                            <div className="space-y-0.5 border-l border-zinc-200 dark:border-zinc-800">
                              <p className="text-[10px] text-red-600 dark:text-red-400 font-medium uppercase tracking-wider">Absent</p>
                              <p className="text-sm font-bold text-red-600 dark:text-red-400">
                                {attendanceStudents.filter(s => s.status === 'absent').length}
                              </p>
                            </div>
                          </div>
                        )}
                        {attendanceStudents.length === 0 ? (
                          <div className="p-6 text-center text-zinc-500 italic text-xs">
                            No students enrolled in this course batch/language selection matching this subject.
                          </div>
                        ) : (
                          <form onSubmit={onSubmitAttendance} className="space-y-4">
                            {/* Search Box */}
                            <div className="relative">
                              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                              <Input
                                type="text"
                                placeholder="Search by student name or roll number..."
                                value={facultyMarkSearch}
                                onChange={(e) => setFacultyMarkSearch(e.target.value)}
                                className="h-8 pl-8 text-xs border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
                              />
                            </div>

                            <div className="overflow-x-auto border border-zinc-150 dark:border-zinc-850 rounded-lg">
                              <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                  <tr className="border-b border-zinc-200 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-900/20 text-zinc-505 dark:text-zinc-400 font-semibold">
                                    <th className="py-2.5 px-3">Roll Number</th>
                                    <th className="py-2.5 px-3">Student Name</th>
                                    <th className="py-2.5 px-3">Language (Sub ID)</th>
                                    <th className="py-2.5 px-3 text-right">Attendance Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {attendanceStudents.filter(s => 
                                    s.fullName.toLowerCase().includes(facultyMarkSearch.toLowerCase()) ||
                                    s.studentId.toLowerCase().includes(facultyMarkSearch.toLowerCase())
                                  ).length === 0 ? (
                                    <tr>
                                      <td colSpan={4} className="py-6 text-center text-zinc-500 italic">
                                        No students matching "{facultyMarkSearch}" found.
                                      </td>
                                    </tr>
                                  ) : (
                                    attendanceStudents.filter(s => 
                                      s.fullName.toLowerCase().includes(facultyMarkSearch.toLowerCase()) ||
                                      s.studentId.toLowerCase().includes(facultyMarkSearch.toLowerCase())
                                    ).map((student) => (
                                      <tr key={student._id} className="border-b border-zinc-100 dark:border-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900/10">
                                        <td className="py-2 px-3 font-mono font-bold">{student.studentId}</td>
                                        <td className="py-2 px-3">{student.fullName}</td>
                                        <td className="py-2 px-3 font-bold uppercase text-[10px] text-zinc-550 dark:text-zinc-450">{student.language}</td>
                                        <td className="py-2 px-3 text-right">
                                          <div className="inline-flex rounded-md shadow-sm">
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setAttendanceStudents(prev =>
                                                  prev.map(s => (s._id === student._id ? { ...s, status: 'present' } : s))
                                                );
                                              }}
                                              disabled={!attendanceEditable}
                                              className={`px-3 py-1 text-[10px] font-bold rounded-l-md border transition-all ${
                                                student.status === 'present'
                                                  ? 'bg-emerald-500 border-emerald-600 text-white shadow-sm'
                                                  : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-850'
                                              } ${!attendanceEditable ? 'opacity-60 cursor-not-allowed' : ''}`}
                                            >
                                              Present
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setAttendanceStudents(prev =>
                                                  prev.map(s => (s._id === student._id ? { ...s, status: 'absent' } : s))
                                                );
                                              }}
                                              disabled={!attendanceEditable}
                                              className={`px-3 py-1 text-[10px] font-bold rounded-r-md border-t border-b border-r transition-all ${
                                                student.status === 'absent'
                                                  ? 'bg-red-500 border-red-600 text-white shadow-sm'
                                                  : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-850'
                                              } ${!attendanceEditable ? 'opacity-60 cursor-not-allowed' : ''}`}
                                            >
                                              Absent
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    ))
                                  )}
                                </tbody>
                              </table>
                            </div>

                            <Button
                              type="submit"
                              size="sm"
                              disabled={attendanceSubmitting || !attendanceEditable}
                              className="bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 w-full"
                            >
                              {attendanceSubmitting ? "Saving Attendance..." : (attendanceIsMarked ? (attendanceEditable ? "Update Attendance Register" : "Attendance Register Locked") : "Submit Attendance Register")}
                            </Button>
                          </form>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              )}
              {/* Consolidated Report */}
              {selectedFacultyAllocId && facultyTab === "consolidated" && (
                <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b border-zinc-100 dark:border-zinc-900">
                    <div>
                      <CardTitle className="text-zinc-900 dark:text-white text-xs font-semibold">
                        Consolidated Attendance Report
                      </CardTitle>
                      <CardDescription className="text-[10px] text-zinc-550 dark:text-zinc-500 mt-1">
                        Summary of student presence, total classes held, and overall attendance percentage.
                      </CardDescription>
                    </div>
                    <div>
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        onClick={downloadConsolidatedAttendanceExcel}
                        className="text-[10px] h-7 px-2 border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-955/20 text-emerald-600 flex items-center space-x-1"
                        disabled={consolidatedLoading || consolidatedData.length === 0}
                      >
                        <FileSpreadsheet className="h-3.5 w-3.5" />
                        <span>Download Excel</span>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {consolidatedLoading ? (
                      <div className="flex flex-col items-center justify-center p-12 space-y-4">
                        <div className="h-7 w-7 animate-spin rounded-full border-2 border-zinc-200 dark:border-zinc-800 border-t-zinc-800 dark:border-t-zinc-200" />
                        <span className="text-zinc-500 text-xs font-semibold animate-pulse">Loading consolidated attendance records...</span>
                      </div>
                    ) : consolidatedData.length === 0 ? (
                      <div className="p-6 text-center text-xs text-zinc-500 italic">
                        No attendance data found for this class allocation.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* Search Box */}
                        <div className="relative">
                          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                          <Input
                            type="text"
                            placeholder="Search by student name or roll number..."
                            value={facultyConsolidatedSearch}
                            onChange={(e) => setFacultyConsolidatedSearch(e.target.value)}
                            className="h-8 pl-8 text-xs border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
                          />
                        </div>

                        <div className="overflow-x-auto border border-zinc-150 dark:border-zinc-850 rounded-lg">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="border-b border-zinc-200 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-900/20 text-zinc-505 dark:text-zinc-400 font-semibold">
                                <th className="py-2.5 px-3">Roll Number</th>
                                <th className="py-2.5 px-3">Student Name</th>
                                <th className="py-2.5 px-3">Language Choice</th>
                                <th className="py-2.5 px-3 text-center">Classes Attended</th>
                                <th className="py-2.5 px-3 text-center">Total Classes</th>
                                <th className="py-2.5 px-3 text-right">Attendance %</th>
                              </tr>
                            </thead>
                            <tbody>
                              {consolidatedData.filter(student => 
                                student.fullName.toLowerCase().includes(facultyConsolidatedSearch.toLowerCase()) ||
                                student.studentId.toLowerCase().includes(facultyConsolidatedSearch.toLowerCase())
                              ).length === 0 ? (
                                <tr>
                                  <td colSpan={6} className="py-6 text-center text-zinc-500 italic">
                                    No students matching "{facultyConsolidatedSearch}" found.
                                  </td>
                                </tr>
                              ) : (
                                consolidatedData.filter(student => 
                                  student.fullName.toLowerCase().includes(facultyConsolidatedSearch.toLowerCase()) ||
                                  student.studentId.toLowerCase().includes(facultyConsolidatedSearch.toLowerCase())
                                ).map((student) => {
                                  const isLowAttendance = student.percentage < 75;
                                  return (
                                    <tr key={student._id} className="border-b border-zinc-100 dark:border-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900/10">
                                      <td className="py-2.5 px-3 font-mono font-bold">{student.studentId}</td>
                                      <td className="py-2.5 px-3 font-semibold">{student.fullName}</td>
                                      <td className="py-2.5 px-3 uppercase text-[10px] text-zinc-500 font-bold">{student.language || "N/A"}</td>
                                      <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">{student.presentCount}</td>
                                      <td className="py-2.5 px-3 text-center text-zinc-550 dark:text-zinc-400 font-bold">{student.totalClasses}</td>
                                      <td className="py-2.5 px-3 text-right">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                          isLowAttendance
                                            ? 'bg-red-500/10 border border-red-500/20 text-red-650 dark:text-red-400'
                                            : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-650 dark:text-emerald-450'
                                        }`}>
                                          {student.percentage}%
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
              {/* Attendance History Logs */}
              {selectedFacultyAllocId && facultyTab === "history" && (
                <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                  <CardHeader>
                    <CardTitle className="text-zinc-900 dark:text-white text-xs font-semibold">
                      Attendance Register History Logs
                    </CardTitle>
                    <CardDescription className="text-[10px] text-zinc-550 dark:text-zinc-500 mt-1">
                      Chronological list of all marked daily attendance registers.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {historyLoading ? (
                      <div className="flex flex-col items-center justify-center p-12 space-y-4">
                        <div className="h-7 w-7 animate-spin rounded-full border-2 border-zinc-200 dark:border-zinc-800 border-t-zinc-800 dark:border-t-zinc-200" />
                        <span className="text-zinc-500 text-xs font-semibold animate-pulse">Loading attendance logs history...</span>
                      </div>
                    ) : historyData.length === 0 ? (
                      <div className="p-6 text-center text-xs text-zinc-500 italic">
                        No attendance history registers found for this class allocation.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* Search Box */}
                        <div className="relative">
                          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                          <Input
                            type="text"
                            placeholder="Search by date, student name, or roll number..."
                            value={facultyHistorySearch}
                            onChange={(e) => setFacultyHistorySearch(e.target.value)}
                            className="h-8 pl-8 text-xs border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
                          />
                        </div>

                        {historyData.filter(log => {
                          const query = facultyHistorySearch.toLowerCase();
                          const dateStr = new Date(log.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }).toLowerCase();
                          const matchesDate = dateStr.includes(query);
                          const matchesStudent = log.records.some(r => 
                            r.fullName.toLowerCase().includes(query) ||
                            r.studentId.toLowerCase().includes(query)
                          );
                          return matchesDate || matchesStudent;
                        }).length === 0 ? (
                          <div className="p-6 text-center text-zinc-500 italic text-xs">
                            No attendance history registers match search query "{facultyHistorySearch}".
                          </div>
                        ) : (
                          historyData.filter(log => {
                            const query = facultyHistorySearch.toLowerCase();
                            const dateStr = new Date(log.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }).toLowerCase();
                            const matchesDate = dateStr.includes(query);
                            const matchesStudent = log.records.some(r => 
                              r.fullName.toLowerCase().includes(query) ||
                              r.studentId.toLowerCase().includes(query)
                            );
                            return matchesDate || matchesStudent;
                          }).map((log) => {
                            const isExpanded = expandedHistoryLogId === log._id;
                            const matchingRecords = log.records.filter(r => {
                              if (!facultyHistorySearch) return true;
                              const query = facultyHistorySearch.toLowerCase();
                              return r.fullName.toLowerCase().includes(query) || r.studentId.toLowerCase().includes(query);
                            });
                            return (
                              <div
                                key={log._id}
                                className="border border-zinc-150 dark:border-zinc-850 rounded-lg overflow-hidden bg-zinc-50/50 dark:bg-zinc-900/5 transition-all"
                              >
                                {/* Header Click to Expand */}
                                <div
                                  onClick={() => setExpandedHistoryLogId(isExpanded ? null : log._id)}
                                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/30 select-none"
                                >
                                  <div className="flex items-center space-x-3 text-xs">
                                    <span className="font-bold text-zinc-800 dark:text-zinc-200">
                                      {new Date(log.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                                    </span>
                                    <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-550 dark:text-zinc-400 px-1.5 py-0.5 rounded font-mono font-bold">
                                      {log.total} Students
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-4">
                                    <div className="flex space-x-2 text-[10px] font-bold">
                                      <span className="text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                                        {log.present} Present
                                      </span>
                                      <span className="text-red-650 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded">
                                        {log.absent} Absent
                                      </span>
                                    </div>
                                    <ChevronDown className={`h-4 w-4 text-zinc-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                  </div>
                                </div>

                                {/* Roster details for this date */}
                                {isExpanded && (
                                  <div className="p-3 border-t border-zinc-150 dark:border-zinc-850 bg-white dark:bg-zinc-955 space-y-3 animate-in slide-in-from-top-1 duration-150">
                                    <div className="flex items-center justify-between text-[10px] text-zinc-500 font-semibold">
                                      <span>Student List Details</span>
                                      {log.isEditable ? (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setSelectedFacultyDate(log.date.split('T')[0]);
                                            setFacultyTab("mark");
                                          }}
                                          className="text-zinc-900 dark:text-white underline hover:opacity-80"
                                        >
                                          Edit this register
                                        </button>
                                      ) : (
                                        <span className="text-zinc-400 dark:text-zinc-550 flex items-center space-x-1 cursor-default font-normal">
                                          <Lock className="h-2.5 w-2.5" />
                                          <span>Locked for editing</span>
                                        </span>
                                      )}
                                    </div>
                                    {matchingRecords.length === 0 ? (
                                      <div className="p-2 text-center text-zinc-500 italic text-[11px]">
                                        No student records match search query in this register.
                                      </div>
                                    ) : (
                                      <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                                        {matchingRecords.map((r, rIdx) => (
                                          <div
                                            key={rIdx}
                                            className={`flex items-center justify-between p-2 rounded-md text-[11px] border ${
                                              r.status === 'present'
                                                ? 'border-emerald-100 dark:border-emerald-950/20 bg-emerald-50/20 text-emerald-800 dark:text-emerald-450'
                                                : 'border-red-100 dark:border-red-955/20 bg-red-50/20 text-red-800 dark:text-red-405'
                                            }`}
                                          >
                                            <div className="font-medium truncate pr-2">
                                              <span className="font-mono font-bold mr-1.5">{r.studentId}</span>
                                              <span>{r.fullName}</span>
                                            </div>
                                            <span className="font-bold text-[9px] uppercase tracking-wider">
                                              {r.status}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Assignment Tab */}
              {selectedFacultyAllocId && facultyTab === "assignments" && (
                <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm animate-in fade-in duration-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b border-zinc-100 dark:border-zinc-900">
                    <div>
                      <CardTitle className="text-zinc-900 dark:text-white text-xs font-semibold">
                        Assignments Submission Ledger
                      </CardTitle>
                      <CardDescription className="text-[10px] text-zinc-550 dark:text-zinc-500 mt-1">
                        Create coursework tasks and track student submissions.
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      {assignments.length > 0 && !isCreateAssignmentOpen && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={downloadAllAssignmentsExcel}
                          className="text-[10px] h-7 px-3 border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-955/20 text-emerald-600 flex items-center space-x-1"
                        >
                          <FileSpreadsheet className="h-3.5 w-3.5" />
                          <span>Export All Excel</span>
                        </Button>
                      )}
                      <Button
                        type="button"
                        onClick={() => setIsCreateAssignmentOpen(!isCreateAssignmentOpen)}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 text-[10px] h-7 px-3 flex items-center space-x-1"
                      >
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span>{isCreateAssignmentOpen ? "View List" : "Create Assignment"}</span>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    {isCreateAssignmentOpen ? (
                      <form onSubmit={handleCreateAssignment} className="space-y-3 max-w-md border border-zinc-100 dark:border-zinc-800 p-4 rounded-lg bg-zinc-50/50 dark:bg-zinc-900/5">
                        <h4 className="text-xs font-bold text-zinc-900 dark:text-white">Create New Course Assignment</h4>
                        
                        <div className="space-y-1 text-xs">
                          <Label htmlFor="assignTitle">Assignment Title</Label>
                          <Input
                            id="assignTitle"
                            type="text"
                            placeholder="e.g. Midterm Lab Journal"
                            value={newAssignmentTitle}
                            onChange={(e) => setNewAssignmentTitle(e.target.value)}
                            className="h-8 text-xs bg-white dark:bg-zinc-900"
                            required
                          />
                        </div>

                        <div className="space-y-1 text-xs">
                          <Label htmlFor="assignDesc">Description (Optional)</Label>
                          <Input
                            id="assignDesc"
                            type="text"
                            placeholder="e.g. Write experiments 1-5"
                            value={newAssignmentDesc}
                            onChange={(e) => setNewAssignmentDesc(e.target.value)}
                            className="h-8 text-xs bg-white dark:bg-zinc-900"
                          />
                        </div>

                        <div className="space-y-1 text-xs">
                          <Label htmlFor="assignDueDate">Due Date</Label>
                          <Input
                            id="assignDueDate"
                            type="date"
                            value={newAssignmentDueDate}
                            onChange={(e) => setNewAssignmentDueDate(e.target.value)}
                            className="h-8 text-xs bg-white dark:bg-zinc-900"
                            required
                          />
                        </div>

                        <Button
                          type="submit"
                          disabled={isAssignmentSubmitting}
                          size="sm"
                          className="bg-primary text-primary-foreground hover:bg-primary/90 mt-2 px-4 py-1.5 text-xs font-semibold shadow-sm"
                        >
                          {isAssignmentSubmitting ? "Creating..." : "Save Assignment"}
                        </Button>
                      </form>
                    ) : (
                      <>
                        {assignmentsLoading ? (
                          <div className="flex flex-col items-center justify-center p-12 space-y-4">
                            <div className="h-7 w-7 animate-spin rounded-full border-2 border-zinc-200 dark:border-zinc-850 border-t-zinc-850 dark:border-t-zinc-200" />
                            <span className="text-zinc-500 text-xs font-semibold animate-pulse">Loading assignments roster...</span>
                          </div>
                        ) : assignments.length === 0 ? (
                          <div className="p-6 text-center text-zinc-505 italic text-xs">
                            No assignments created yet for this class subject. Click "Create Assignment" to add one.
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {/* Assignments List Sorting/Filtering Controls */}
                            <div className="flex flex-col sm:flex-row gap-2 pb-2">
                              <div className="relative flex-1">
                                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                                <Input
                                  type="text"
                                  placeholder="Search assignments..."
                                  value={assignmentSearch}
                                  onChange={(e) => setAssignmentSearch(e.target.value)}
                                  className="h-8 pl-8 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                                />
                              </div>
                              <div className="flex gap-2">
                                <select
                                  className="h-8 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white px-2 py-1 text-xs shadow-sm focus:outline-none"
                                  value={assignmentFilter}
                                  onChange={(e) => setAssignmentFilter(e.target.value)}
                                >
                                  <option value="all">All Status</option>
                                  <option value="completed">Completed (All Submitted)</option>
                                  <option value="pending">Pending Submissions</option>
                                </select>
                                <select
                                  className="h-8 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white px-2 py-1 text-xs shadow-sm focus:outline-none"
                                  value={assignmentSort}
                                  onChange={(e) => setAssignmentSort(e.target.value)}
                                >
                                  <option value="dueDateAsc">Due Date (Soonest first)</option>
                                  <option value="dueDateDesc">Due Date (Latest first)</option>
                                  <option value="titleAsc">Title (A-Z)</option>
                                  <option value="createdAtDesc">Created (Newest first)</option>
                                </select>
                              </div>
                            </div>

                            {getFilteredAndSortedAssignments().length === 0 ? (
                              <div className="p-6 text-center text-zinc-500 italic text-xs border border-zinc-250 dark:border-zinc-850 rounded-lg">
                                No assignments match your search or filter criteria.
                              </div>
                            ) : (
                              <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                                {getFilteredAndSortedAssignments().map((assign) => {
                                  const submittedCount = assign.submissions.filter(s => s.status === 'submitted').length;
                                  const totalCount = assign.submissions.length;
                                  const isSelected = selectedAssignment?._id === assign._id;
                                  
                                  return (
                                    <div
                                      key={assign._id}
                                      className={`p-3 border rounded-lg cursor-pointer transition-all flex flex-col justify-between ${
                                        isSelected
                                          ? 'border-primary bg-primary/5 dark:bg-primary/10'
                                          : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/10'
                                      }`}
                                      onClick={() => setSelectedAssignment(assign)}
                                    >
                                      <div>
                                        <div className="flex items-start justify-between">
                                          <h4 className="text-xs font-bold text-zinc-900 dark:text-white truncate pr-2">{assign.title}</h4>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDeleteAssignment(assign._id);
                                            }}
                                            className="text-red-500 hover:text-red-700 text-[10px] shrink-0"
                                          >
                                            Delete
                                          </button>
                                        </div>
                                        <p className="text-[10px] text-zinc-550 dark:text-zinc-500 line-clamp-1 mt-0.5">{assign.description || 'No description'}</p>
                                      </div>
                                      <div className="mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-between text-[9px] font-bold text-zinc-500">
                                        <span>Due: {new Date(assign.dueDate).toLocaleDateString()}</span>
                                        <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-1.5 py-0.5 rounded">
                                          {submittedCount} / {totalCount} Submitted
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Submissions Details table for selected Assignment */}
                            {selectedAssignment && (
                              <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 space-y-3 bg-zinc-50/50 dark:bg-zinc-900/5 animate-in fade-in duration-200">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2 gap-2">
                                  <div>
                                    <h4 className="text-xs font-bold text-zinc-900 dark:text-white">
                                      Submission Register: {selectedAssignment.title}
                                    </h4>
                                    <p className="text-[10px] text-zinc-550 dark:text-zinc-500 mt-1">
                                      Click toggle buttons to mark submission status.
                                    </p>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="xs"
                                    onClick={() => downloadAssignmentExcel(selectedAssignment)}
                                    className="text-[10px] h-7 px-2 border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-955/20 text-emerald-600 flex items-center space-x-1 self-start"
                                  >
                                    <FileSpreadsheet className="h-3.5 w-3.5" />
                                    <span>Download Excel</span>
                                  </Button>
                                </div>

                                {/* Submissions Sorting/Filtering Controls */}
                                <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 pb-1">
                                  <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                                    <Input
                                      type="text"
                                      placeholder="Search student or roll no..."
                                      value={submissionSearch}
                                      onChange={(e) => setSubmissionSearch(e.target.value)}
                                      className="h-8 pl-8 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                                    />
                                  </div>
                                  <select
                                    className="h-8 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white px-2 py-1 text-xs shadow-sm focus:outline-none"
                                    value={submissionFilterStatus}
                                    onChange={(e) => setSubmissionFilterStatus(e.target.value)}
                                  >
                                    <option value="all">All Submissions</option>
                                    <option value="submitted">Submitted</option>
                                    <option value="pending">Pending</option>
                                  </select>
                                  <select
                                    className="h-8 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white px-2 py-1 text-xs shadow-sm focus:outline-none"
                                    value={submissionFilterLanguage}
                                    onChange={(e) => setSubmissionFilterLanguage(e.target.value)}
                                  >
                                    <option value="all">All Languages</option>
                                    {getSubmissionsLanguages().map(lang => (
                                      <option key={lang} value={lang}>{lang.toUpperCase()}</option>
                                    ))}
                                  </select>
                                  <select
                                    className="h-8 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white px-2 py-1 text-xs shadow-sm focus:outline-none"
                                    value={submissionSort}
                                    onChange={(e) => setSubmissionSort(e.target.value)}
                                  >
                                    <option value="rollAsc">Roll Number (Asc)</option>
                                    <option value="rollDesc">Roll Number (Desc)</option>
                                    <option value="nameAsc">Name (A-Z)</option>
                                    <option value="statusSubmitted">Submitted First</option>
                                    <option value="statusPending">Pending First</option>
                                  </select>
                                </div>

                                <div className="overflow-x-auto border border-zinc-150 dark:border-zinc-850 rounded-lg bg-white dark:bg-zinc-950">
                                  <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                      <tr className="border-b border-zinc-200 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-900/20 text-zinc-505 dark:text-zinc-400 font-semibold">
                                        <th className="py-2.5 px-3">Roll Number</th>
                                        <th className="py-2.5 px-3">Student Name</th>
                                        <th className="py-2.5 px-3">Language</th>
                                        <th className="py-2.5 px-3 text-right">Submission Status</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {getFilteredAndSortedSubmissions().length === 0 ? (
                                        <tr>
                                          <td colSpan={4} className="py-8 text-center text-zinc-500 italic text-xs">
                                            No student submissions match search/filter criteria.
                                          </td>
                                        </tr>
                                      ) : (
                                        getFilteredAndSortedSubmissions().map((sub) => {
                                          const student = sub.student || {};
                                          return (
                                            <tr key={student._id} className="border-b border-zinc-100 dark:border-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900/10">
                                              <td className="py-2 px-3 font-mono font-bold">{student.studentId || 'N/A'}</td>
                                              <td className="py-2 px-3 font-medium">{student.fullName || 'Unknown'}</td>
                                              <td className="py-2 px-3 uppercase text-[10px] font-bold text-zinc-500">{student.language || 'N/A'}</td>
                                              <td className="py-2 px-3 text-right">
                                                <button
                                                  type="button"
                                                  onClick={() => handleToggleSubmission(selectedAssignment, student._id, sub.status)}
                                                  className={`px-3 py-1 text-[10px] font-bold rounded-md border transition-all ${
                                                    sub.status === 'submitted'
                                                      ? 'bg-emerald-500 border-emerald-600 text-white shadow-sm'
                                                      : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-555 dark:text-zinc-400 hover:bg-zinc-50'
                                                  }`}
                                                >
                                                  {sub.status === 'submitted' ? 'Submitted' : 'Pending'}
                                                </button>
                                              </td>
                                            </tr>
                                          );
                                        })
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              )}
              </div>
        );
      }
    } else {
      return (
            <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
              <CardHeader>
                <CardTitle className="text-zinc-900 dark:text-white text-base">Module Workspace</CardTitle>
                <CardDescription className="text-zinc-505 text-xs">
                  Review metrics and manage actions relative to your role permissions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="border border-zinc-200 dark:border-zinc-800 p-6 rounded-md bg-zinc-50 dark:bg-zinc-900/10 flex flex-col items-center justify-center text-center space-y-2">
                  <Activity className="h-8 w-8 text-zinc-500 animate-pulse" />
                  <h4 className="font-semibold text-zinc-900 dark:text-white">No active academic workflows</h4>
                  <p className="text-zinc-500 max-w-sm">
                    Functional modules for Attendance, Subject Allocation, and Marks Entry are part of subsequent releases.
                  </p>
                </div>
              </CardContent>
            </Card>
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-row items-center justify-between">
        <div className="flex flex-col space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white md:text-2xl">
            Welcome back, {user.fullName}
          </h2>
          <p className="text-xs text-zinc-500 font-medium">
            DMS Dashboard — {user.role === "Admin" ? "System Administration" : `Department: ${user.department || "N/A"} | College: ${user.college || "N/A"}`}
          </p>
        </div>
        {user.role !== "Faculty" && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setRecentActivitiesOpen(!recentActivitiesOpen)}
            className="text-xs flex items-center space-x-1.5 h-8 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300"
          >
            <Activity className="h-3.5 w-3.5" />
            <span>{recentActivitiesOpen ? "Hide Logs" : "Show Logs"}</span>
          </Button>
        )}
      </div>

      {user.role !== "Faculty" && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, idx) => (
            <Card key={idx} className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <span className="text-xs font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">
                  {stat.title}
                </span>
                {stat.icon}
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-zinc-900 dark:text-white">{stat.value}</div>
                <p className="text-[10px] text-zinc-500 mt-0.5">{stat.change}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-7">
        <div className={`col-span-1 ${recentActivitiesOpen && user.role !== "Faculty" ? "lg:col-span-4" : "lg:col-span-7"} space-y-6 transition-all duration-300`}>
          {renderWorkspace()}
        </div>
        {recentActivitiesOpen && user.role !== "Faculty" && (
          <div className="col-span-1 lg:col-span-3 animate-in fade-in slide-in-from-right-1 duration-200">
            <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 h-full">
              <CardHeader 
                className="cursor-pointer select-none pb-3" 
                onClick={() => setRecentActivitiesOpen(false)}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-zinc-900 dark:text-white text-base">Recent Activities</CardTitle>
                  <div className="text-zinc-500 dark:text-zinc-400 p-1 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-full transition-colors">
                    <ChevronDown className="h-4 w-4 rotate-90" />
                  </div>
                </div>
                <CardDescription className="text-zinc-505 text-xs mt-1">
                  System events and access logs.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="relative pl-4 border-l border-zinc-200 dark:border-zinc-850 space-y-4">
                  <div className="space-y-1">
                    <div className="absolute left-[-4.5px] mt-1 h-2 w-2 rounded-full bg-zinc-900 dark:bg-zinc-100 ring-4 ring-white dark:ring-black" />
                    <p className="text-zinc-700 dark:text-zinc-300 font-medium">Session initialized successfully</p>
                    <p className="text-[10px] text-zinc-500">JWT verification completed</p>
                  </div>
                  <div className="space-y-1">
                    <div className="absolute left-[-4.5px] mt-1 h-2 w-2 rounded-full bg-zinc-300 dark:bg-zinc-800" />
                    <p className="text-zinc-505 dark:text-zinc-400 font-medium">Database connection secure</p>
                    <p className="text-[10px] text-zinc-500">Mongoose client connected to localhost</p>
                  </div>
                  <div className="space-y-1">
                    <div className="absolute left-[-4.5px] mt-1 h-2 w-2 rounded-full bg-zinc-300 dark:bg-zinc-800" />
                    <p className="text-zinc-505 dark:text-zinc-400 font-medium">System seeder executed</p>
                    <p className="text-[10px] text-zinc-500 font-normal">Initialized default Admin credentials (ADM001)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>              )}

      </div>
      {user.role === "Admin" && (
        <div className="mt-8 space-y-4">
          {/* Tab Triggers */}
          <div className="flex border-b border-zinc-200 dark:border-zinc-800 space-x-6 text-sm">
            <button
              type="button"
              onClick={() => setActiveTab("staff")}
              className={`pb-2 font-medium transition-colors relative ${
                activeTab === "staff"
                  ? "text-zinc-955 dark:text-white"
                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
              }`}
            >
              Staff Directory ({users.length})
              {activeTab === "staff" && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-zinc-950 dark:bg-white" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("courses")}
              className={`pb-2 font-medium transition-colors relative ${
                activeTab === "courses"
                  ? "text-zinc-955 dark:text-white"
                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
              }`}
            >
              Course Registry ({courses.length})
              {activeTab === "courses" && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-zinc-950 dark:bg-white" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("colleges")}
              className={`pb-2 font-medium transition-colors relative ${
                activeTab === "colleges"
                  ? "text-zinc-955 dark:text-white"
                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
              }`}
            >
              College Registry ({colleges.length})
              {activeTab === "colleges" && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-zinc-955 dark:bg-white" />
              )}
            </button>
          </div>

          {/* Tab Contents */}
          <div className="transition-all duration-300">
            {activeTab === "staff" && (
              <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                <CardHeader>
                  <CardTitle className="text-zinc-900 dark:text-white text-base">Registered staff & Faculty Accounts</CardTitle>
                  <CardDescription className="text-zinc-500 text-xs">
                    Live directory list of registered accounts.
                  </CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-850 text-zinc-500 dark:text-zinc-400 font-semibold">
                        <th className="py-2 pr-4">Employee ID</th>
                        <th className="py-2 px-4">Name</th>
                        <th className="py-2 px-4">Role</th>
                        <th className="py-2 px-4">College</th>
                        <th className="py-2 px-4">Department / Course</th>
                        <th className="py-2 px-4">Last Login</th>
                        <th className="py-2 px-4">Status</th>
                        <th className="py-2 pl-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-4 text-center text-zinc-500">
                            No employees registered yet.
                          </td>
                        </tr>
                      ) : (
                        users.map((u) => (
                          <tr key={u.id || u.employeeId || u._id} className="border-b border-zinc-100 dark:border-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900/10">
                            <td className="py-2 pr-4 font-mono text-zinc-500 dark:text-zinc-400">{u.employeeId}</td>
                            <td className="py-2 px-4">{u.fullName}</td>
                            <td className="py-2 px-4">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 text-zinc-600 dark:text-zinc-400">
                                {u.role}
                              </span>
                            </td>
                            <td className="py-2 px-4">{u.college || "N/A"}</td>
                            <td className="py-2 px-4">{u.department || "N/A"}</td>
                            <td className="py-2 px-4 text-zinc-500">
                              {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : "Never"}
                            </td>
                            <td className="py-2 px-4">
                              {u.role === "Admin" ? (
                                <span className="text-[10px] font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-wider">
                                  Always Active
                                </span>
                              ) : (
                                <div className="flex items-center space-x-2">
                                  <button
                                    type="button"
                                    onClick={() => onToggleUserStatus(u)}
                                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                      u.status === "active" ? "bg-emerald-600" : "bg-zinc-300 dark:bg-zinc-800"
                                    }`}
                                    title="Toggle Account Status"
                                  >
                                    <span
                                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                                        u.status === "active" ? "translate-x-4" : "translate-x-0"
                                      }`}
                                    />
                                  </button>
                                  <span className={`text-[10px] font-bold ${u.status === "active" ? "text-emerald-400" : "text-zinc-500"}`}>
                                    {u.status === "active" ? "Active" : "Inactive"}
                                  </span>
                                </div>
                              )}
                            </td>
                            <td className="py-2 pl-4 text-right space-x-2">
                              {u.role !== "Admin" && (
                                <>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900"
                                    onClick={() => {
                                      setEditingUser(u);
                                      setEditingUserRole(u.role);
                                      setEditingUserCollege(u.college || "");
                                    }}
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-zinc-500 dark:text-zinc-400 hover:text-red-655 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-955/20"
                                    onClick={() => {
                                      setDeletingUser(u);
                                      setDeleteConfirmText("");
                                    }}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}

            {activeTab === "courses" && (
              <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                <CardHeader>
                  <CardTitle className="text-zinc-900 dark:text-white text-base">Academic Courses / Departments</CardTitle>
                  <CardDescription className="text-zinc-500 text-xs">
                    Active department structures inside the system database.
                  </CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-850 text-zinc-500 dark:text-zinc-400 font-semibold">
                        <th className="py-2 pr-4">Course ID</th>
                        <th className="py-2 px-4">Course Name</th>
                        <th className="py-2 px-4">Assigned College</th>
                        <th className="py-2 pl-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courses.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-zinc-500">
                            No courses or departments created yet.
                          </td>
                        </tr>
                      ) : (
                        courses.map((c) => (
                          <tr key={c.courseId} className="border-b border-zinc-100 dark:border-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900/10">
                            <td className="py-2 pr-4 font-mono text-zinc-505 dark:text-zinc-400">{c.courseId}</td>
                            <td className="py-2 px-4">{c.courseName}</td>
                            <td className="py-2 px-4">{c.college}</td>
                            <td className="py-2 pl-4 text-right space-x-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-zinc-505 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900"
                                onClick={() => setEditingCourse(c)}
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-zinc-505 dark:text-zinc-400 hover:text-red-655 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-955/20"
                                onClick={() => {
                                  setDeletingCourse(c);
                                  setDeleteConfirmText("");
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}

            {activeTab === "colleges" && (
              <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                <CardHeader>
                  <CardTitle className="text-zinc-900 dark:text-white text-base">College Registry</CardTitle>
                  <CardDescription className="text-zinc-500 text-xs">
                    Registered Colleges inside the system database.
                  </CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-850 text-zinc-500 dark:text-zinc-400 font-semibold">
                        <th className="py-2 pr-4">College ID</th>
                        <th className="py-2 px-4">College Name</th>
                        <th className="py-2 pl-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {colleges.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="py-4 text-center text-zinc-500">
                            No colleges created yet. Create one on the left panel to begin.
                          </td>
                        </tr>
                      ) : (
                        colleges.map((col) => (
                          <tr key={col.collegeId} className="border-b border-zinc-100 dark:border-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900/10">
                            <td className="py-2 pr-4 font-mono text-zinc-505 dark:text-zinc-400">{col.collegeId}</td>
                            <td className="py-2 px-4">{col.collegeName}</td>
                            <td className="py-2 pl-4 text-right space-x-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-zinc-505 dark:text-zinc-400 hover:text-zinc-955 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900"
                                onClick={() => setEditingCollege(col)}
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-zinc-505 dark:text-zinc-400 hover:text-red-655 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-955/20"
                                onClick={() => {
                                  setDeletingCollege(col);
                                  setDeleteConfirmText("");
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Modals for Edit / Delete operations */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white">
            <CardHeader>
              <CardTitle className="text-base text-zinc-955 dark:text-white">Edit Staff Details</CardTitle>
              <CardDescription className="text-xs text-zinc-500">
                Modify account values for employee {editingUser.employeeId}.
              </CardDescription>
            </CardHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const data = Object.fromEntries(formData.entries());
              onUpdateUser(editingUser.id || editingUser._id, data);
            }}>
              <CardContent className="space-y-4 text-xs">
                <div className="space-y-1">
                  <Label htmlFor="edit-fullName" className="text-zinc-700 dark:text-zinc-300">Full Name</Label>
                  <Input
                    id="edit-fullName"
                    name="fullName"
                    defaultValue={editingUser.fullName}
                    className="border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-email" className="text-zinc-700 dark:text-zinc-300">Email Address</Label>
                  <Input
                    id="edit-email"
                    name="email"
                    type="email"
                    defaultValue={editingUser.email}
                    className="border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="edit-role" className="text-zinc-700 dark:text-zinc-300">System Role</Label>
                    <select
                      id="edit-role"
                      name="role"
                      value={editingUserRole}
                      onChange={(e) => setEditingUserRole(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-900 dark:text-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none"
                      required
                    >
                      <option value="Principal">Principal</option>
                      <option value="HOD">HOD</option>
                      <option value="Office Assistant">Office Assistant</option>
                      <option value="Faculty">Faculty</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="edit-college" className="text-zinc-700 dark:text-zinc-300">College</Label>
                    <select
                      id="edit-college"
                      name="college"
                      value={editingUserCollege}
                      onChange={(e) => setEditingUserCollege(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-900 dark:text-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none"
                      required
                    >
                      <option value="">-- Select College --</option>
                      {colleges.map((col) => (
                        <option key={col.collegeId} value={col.collegeName}>
                          {col.collegeName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {editingUserRole === "HOD" && (
                  <div className="space-y-1">
                    <Label htmlFor="edit-department" className="text-zinc-700 dark:text-zinc-300">Course / Department</Label>
                    <select
                      id="edit-department"
                      name="department"
                      defaultValue={editingUser.department}
                      className="flex h-9 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-900 dark:text-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none"
                      required
                    >
                      <option value="">-- Select Course --</option>
                      {courses
                        .filter((c) => c.college === editingUserCollege)
                        .map((course) => (
                          <option key={course.courseId} value={course.courseName}>
                            {course.courseName}
                          </option>
                        ))}
                    </select>
                  </div>
                )}
                <div className="space-y-1">
                  <Label htmlFor="edit-status" className="text-zinc-700 dark:text-zinc-300">Account Status</Label>
                  <select
                    id="edit-status"
                    name="status"
                    defaultValue={editingUser.status}
                    className="flex h-9 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-900 dark:text-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none"
                    required
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="flex space-x-2 pt-2">
                  <Button type="submit" className="bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200">
                    Save Changes
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
                    onClick={() => setEditingUser(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </form>
          </Card>
        </div>
      )}

      {editingCourse && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white">
            <CardHeader>
              <CardTitle className="text-base text-zinc-955 dark:text-white">Edit Course / Department</CardTitle>
              <CardDescription className="text-xs text-zinc-500">
                Modify configurations for course {editingCourse.courseId}.
              </CardDescription>
            </CardHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const data = Object.fromEntries(formData.entries());
              onUpdateCourse(editingCourse._id || editingCourse.id, data);
            }}>
              <CardContent className="space-y-4 text-xs">
                <div className="space-y-1">
                  <Label htmlFor="edit-courseId" className="text-zinc-700 dark:text-zinc-300">Course ID</Label>
                  <Input
                    id="edit-courseId"
                    name="courseId"
                    defaultValue={editingCourse.courseId}
                    className="border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-courseName" className="text-zinc-700 dark:text-zinc-300">Course Name</Label>
                  <Input
                    id="edit-courseName"
                    name="courseName"
                    defaultValue={editingCourse.courseName}
                    className="border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-courseCollege" className="text-zinc-700 dark:text-zinc-300">College</Label>
                  <select
                    id="edit-courseCollege"
                    name="college"
                    defaultValue={editingCourse.college}
                    className="flex h-9 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-900 dark:text-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none"
                    required
                  >
                    {colleges.map((col) => (
                      <option key={col.collegeId} value={col.collegeName}>
                        {col.collegeName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex space-x-2 pt-2">
                  <Button type="submit" className="bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200">
                    Save Changes
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-955 dark:hover:text-white"
                    onClick={() => setEditingCourse(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </form>
          </Card>
        </div>
      )}

      {editingCollege && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white">
            <CardHeader>
              <CardTitle className="text-base text-zinc-955 dark:text-white">Edit College Details</CardTitle>
              <CardDescription className="text-xs text-zinc-500">
                Modify configurations for college {editingCollege.collegeId}.
              </CardDescription>
            </CardHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const data = Object.fromEntries(formData.entries());
              onUpdateCollege(editingCollege._id || editingCollege.id, data);
            }}>
              <CardContent className="space-y-4 text-xs">
                <div className="space-y-1">
                  <Label htmlFor="edit-collegeId" className="text-zinc-700 dark:text-zinc-300">College ID</Label>
                  <Input
                    id="edit-collegeId"
                    name="collegeId"
                    defaultValue={editingCollege.collegeId}
                    className="border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-collegeName" className="text-zinc-700 dark:text-zinc-300">College Name</Label>
                  <Input
                    id="edit-collegeName"
                    name="collegeName"
                    defaultValue={editingCollege.collegeName}
                    className="border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500"
                    required
                  />
                </div>
                <div className="flex space-x-2 pt-2">
                  <Button type="submit" className="bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200">
                    Save Changes
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-955 dark:hover:text-white"
                    onClick={() => setEditingCollege(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </form>
          </Card>
        </div>
      )}

      {deletingUser && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white">
            <CardHeader>
              <CardTitle className="text-base text-red-655 dark:text-red-500 font-bold">Delete User Account</CardTitle>
              <CardDescription className="text-xs text-zinc-500">
                This action cannot be undone. All database records for this account will be purged.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <p className="text-zinc-700 dark:text-zinc-300">
                To confirm, type the user's Employee ID <strong className="text-zinc-950 dark:text-white font-semibold font-mono">"{deletingUser.employeeId}"</strong> below:
              </p>
              <Input
                type="text"
                placeholder="Type Employee ID here"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500"
              />
              <div className="flex space-x-2">
                <Button
                  type="button"
                  disabled={deleteConfirmText !== deletingUser.employeeId}
                  className="bg-red-600 text-white hover:bg-red-700 disabled:bg-zinc-100 disabled:text-zinc-400 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500"
                  onClick={() => onDeleteUser(deletingUser.id || deletingUser._id)}
                >
                  Delete Account
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
                  onClick={() => {
                    setDeletingUser(null);
                    setDeleteConfirmText("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {deletingCourse && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white">
            <CardHeader>
              <CardTitle className="text-base text-red-655 dark:text-red-500 font-bold">Delete Course / Department</CardTitle>
              <CardDescription className="text-xs text-zinc-500">
                This course structure will be deleted. (Forbidden if any users are assigned to it).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <p className="text-zinc-700 dark:text-zinc-300">
                To confirm, type the course name <strong className="text-zinc-950 dark:text-white font-semibold font-mono">"{deletingCourse.courseName}"</strong> below:
              </p>
              <Input
                type="text"
                placeholder="Type course name here"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500"
              />
              <div className="flex space-x-2">
                <Button
                  type="button"
                  disabled={deleteConfirmText !== deletingCourse.courseName}
                  className="bg-red-600 text-white hover:bg-red-700 disabled:bg-zinc-100 disabled:text-zinc-400 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500"
                  onClick={() => onDeleteCourse(deletingCourse._id || deletingCourse.id)}
                >
                  Delete Course
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
                  onClick={() => {
                    setDeletingCourse(null);
                    setDeleteConfirmText("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {deletingCollege && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white">
            <CardHeader>
              <CardTitle className="text-base text-red-655 dark:text-red-500 font-bold">Delete College / Organization</CardTitle>
              <CardDescription className="text-xs text-zinc-500">
                This college structure will be deleted. (Forbidden if any courses or users are assigned to it).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <p className="text-zinc-700 dark:text-zinc-300">
                To confirm, type the college name <strong className="text-zinc-950 dark:text-white font-semibold font-mono">"{deletingCollege.collegeName}"</strong> below:
              </p>
              <Input
                type="text"
                placeholder="Type college name here"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500"
              />
              <div className="flex space-x-2">
                <Button
                  type="button"
                  disabled={deleteConfirmText !== deletingCollege.collegeName}
                  className="bg-red-600 text-white hover:bg-red-700 disabled:bg-zinc-100 disabled:text-zinc-400 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500"
                  onClick={() => onDeleteCollege(deletingCollege._id || deletingCollege.id)}
                >
                  Delete College
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
                  onClick={() => {
                    setDeletingCollege(null);
                    setDeleteConfirmText("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

