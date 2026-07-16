import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Link, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import api from "@/services/api";
import {
  LayoutDashboard,
  Users,
  Settings,
  ShieldAlert,
  FolderTree,
  FileSpreadsheet,
  CalendarCheck,
  BookOpen,
  LogOut,
  Bell,
  Search,
  KeyRound,
  X,
  Menu,
  ChevronRight,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "../context/ToastContext";

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      "Must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character"
    ),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const toast = useToast();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const [passLoading, setPassLoading] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.add("dark");
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(changePasswordSchema),
  });

  if (!user) return null;

  const getMenuItems = () => {
    switch (user.role) {
      case "Admin":
        return [
          { title: "User Directory", path: "/dashboard/admin", icon: <Users className="h-4 w-4" /> },
          { title: "Audit Trail", path: "/dashboard/admin/audit", icon: <ShieldAlert className="h-4 w-4" /> },
          { title: "System Controls", path: "/dashboard/admin/settings", icon: <Settings className="h-4 w-4" /> },
        ];
      case "Principal":
        return [
          { title: "Campus Overview", path: "/dashboard/principal", icon: <LayoutDashboard className="h-4 w-4" /> },
          { title: "Academic Audit", path: "/dashboard/principal/audit", icon: <FolderTree className="h-4 w-4" /> },
          { title: "Directory", path: "/dashboard/principal/directory", icon: <Users className="h-4 w-4" /> },
        ];
      case "HOD":
        return [
          { title: "Department Hub", path: "/dashboard/hod", icon: <FolderTree className="h-4 w-4" /> },
          { title: "Consolidated Attendance", path: "/dashboard/hod/attendance", icon: <CalendarCheck className="h-4 w-4" /> },
          { title: "Consolidated Assignments", path: "/dashboard/hod/assignments", icon: <CheckCircle className="h-4 w-4" /> },
          { title: "Consolidated IA Marks", path: "/dashboard/hod/grades", icon: <FileSpreadsheet className="h-4 w-4" /> },
          { title: "Subject Allocation", path: "/dashboard/hod/subjects", icon: <FileSpreadsheet className="h-4 w-4" /> },
        ];
      case "Faculty":
        return [
          { title: "My Workspace", path: "/dashboard/faculty", icon: <LayoutDashboard className="h-4 w-4" /> },
          { title: "Attendance Ledger", path: "/dashboard/faculty/attendance", icon: <CalendarCheck className="h-4 w-4" /> },
          { title: "Assignments", path: "/dashboard/faculty/assignments", icon: <CheckCircle className="h-4 w-4" /> },
          { title: "Academic Grades", path: "/dashboard/faculty/grades", icon: <FileSpreadsheet className="h-4 w-4" /> },
        ];
      case "Office Assistant":
        return [
          { title: "Records Desk", path: "/dashboard/office", icon: <FileSpreadsheet className="h-4 w-4" /> },
          { title: "Attendance Log", path: "/dashboard/office/attendance", icon: <CalendarCheck className="h-4 w-4" /> },
          { title: "General Inward", path: "/dashboard/office/inward", icon: <BookOpen className="h-4 w-4" /> },
        ];
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  const handlePasswordChange = async (data) => {
    setPassLoading(true);
    try {
      const response = await api.put("/api/auth/change-password", {
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
      });

      if (response.data.success) {
        toast.success("Password updated successfully.");
        reset();
        setIsPasswordModalOpen(false);
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to change password. Please verify current password."
      );
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-background text-foreground overflow-hidden relative">
      {/* Backdrop overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-30 md:static flex flex-col border-r border-border bg-card text-card-foreground transition-all duration-300 ${
          isSidebarOpen
            ? "w-64 translate-x-0"
            : "-translate-x-full w-0 md:translate-x-0 md:w-16"
        } shrink-0`}
      >
        <div className="h-14 border-b border-border flex items-center justify-between px-4">
          <div className="flex items-center space-x-2 overflow-hidden">
            <div className="h-7 w-7 rounded bg-primary text-primary-foreground flex items-center justify-center font-black text-sm shrink-0">
              D
            </div>
            {isSidebarOpen && (
              <span className="font-semibold text-foreground tracking-wide truncate">
                Dept DMS
              </span>
            )}
          </div>
          {isSidebarOpen && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-zinc-400 hover:text-zinc-955 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 hidden md:flex"
              onClick={() => setIsSidebarOpen(false)}
            >
              <ChevronRight className="h-4 w-4 rotate-180" />
            </Button>
          )}
        </div>

        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {menuItems.map((item, idx) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={idx}
                to={item.path}
                className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  isActive
                    ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-955 dark:text-white border border-zinc-200 dark:border-zinc-850"
                    : "text-zinc-505 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-250 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50"
                }`}
              >
                <div className="shrink-0">{item.icon}</div>
                {isSidebarOpen && <span className="truncate">{item.title}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-2 border-t border-border bg-muted/40">
          <Button
            type="button"
            variant="ghost"
            className="w-full justify-start text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 px-3 py-2 text-sm"
            onClick={logout}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {isSidebarOpen && <span className="ml-3 truncate">Sign Out</span>}
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-14 border-b border-border bg-card/90 backdrop-blur-md flex items-center justify-between px-6 z-10">
          <div className="flex items-center space-x-4">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-zinc-505 dark:text-zinc-400 hover:text-zinc-955 dark:hover:text-white md:hidden"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            {!isSidebarOpen && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-zinc-505 dark:text-zinc-400 hover:text-zinc-955 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 hidden md:flex"
                onClick={() => setIsSidebarOpen(true)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}

            <div className="relative w-48 md:w-64 hidden sm:block">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-400 dark:text-zinc-505">
                <Search className="h-4 w-4" />
              </span>
              <Input
                type="text"
                placeholder="Search resources..."
                className="h-8 pl-9 border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/40 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-505 focus:border-zinc-300 dark:focus:border-zinc-700"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="relative">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-zinc-505 dark:text-zinc-400 hover:text-zinc-955 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900"
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              >
                <Bell className="h-4 w-4" />
                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-red-500 ring-1 ring-white dark:ring-zinc-950" />
              </Button>

              {isNotificationOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 shadow-lg text-xs z-30">
                  <div className="flex justify-between items-center pb-2 border-b border-zinc-100 dark:border-zinc-800 mb-2">
                    <span className="font-semibold text-zinc-900 dark:text-white">Notifications</span>
                    <button
                      type="button"
                      className="text-zinc-505 hover:text-zinc-955 dark:hover:text-white"
                      onClick={() => setIsNotificationOpen(false)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="space-y-3 pt-1">
                    <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-900/50">
                      <p className="text-zinc-700 dark:text-zinc-300 font-medium">Authentication Module Part 1 Complete</p>
                      <span className="text-[10px] text-zinc-505 font-normal">Just now</span>
                    </div>
                    <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-900/50">
                      <p className="text-zinc-700 dark:text-zinc-300 font-medium">New User Seeder added</p>
                      <span className="text-[10px] text-zinc-505 font-normal">1 hour ago</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                type="button"
                className="flex items-center space-x-2 focus:outline-none"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
              >
                <div className="h-8 w-8 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-xs font-bold text-zinc-800 dark:text-white uppercase hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
                  {user.fullName.substring(0, 2)}
                </div>
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-1 shadow-lg z-30">
                  <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800 text-xs">
                    <p className="font-medium text-zinc-900 dark:text-white truncate">{user.fullName}</p>
                    <p className="text-zinc-500 truncate mt-0.5">{user.email}</p>
                    <p className="text-zinc-700 dark:text-zinc-400 text-[10px] bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-1.5 py-0.5 inline-block mt-1 font-semibold uppercase tracking-wider">
                      {user.role}
                    </p>
                  </div>
                  <div className="py-1">
                    <button
                      type="button"
                      className="flex w-full items-center px-4 py-2 text-xs text-zinc-650 dark:text-zinc-400 hover:text-zinc-955 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900"
                      onClick={() => {
                        setIsProfileOpen(false);
                        setIsPasswordModalOpen(true);
                      }}
                    >
                      <KeyRound className="mr-2 h-3.5 w-3.5" />
                      Change Password
                    </button>
                    <button
                      type="button"
                      className="flex w-full items-center px-4 py-2 text-xs text-red-655 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/20"
                      onClick={() => {
                        setIsProfileOpen(false);
                        logout();
                      }}
                    >
                      <LogOut className="mr-2 h-3.5 w-3.5" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>

      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => {
                setIsPasswordModalOpen(false);
                reset();
              }}
              className="absolute top-4 right-4 text-zinc-400 dark:text-zinc-500 hover:text-zinc-955 dark:hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-zinc-955 dark:text-white">Change Password</h3>
              <p className="text-xs text-zinc-505 mt-1">
                Enter your current password and your new credentials.
              </p>
            </div>

            <form onSubmit={handleSubmit(handlePasswordChange)} className="space-y-4">

              <div className="space-y-2 text-xs">
                <Label htmlFor="oldPassword">Current Password</Label>
                <Input
                  id="oldPassword"
                  type="password"
                  className="border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-505"
                  {...register("oldPassword")}
                />
                {errors.oldPassword && (
                  <p className="text-[11px] text-red-500">{errors.oldPassword.message}</p>
                )}
              </div>

              <div className="space-y-2 text-xs">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  className="border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-505"
                  {...register("newPassword")}
                />
                {errors.newPassword && (
                  <p className="text-[11px] text-red-500">{errors.newPassword.message}</p>
                )}
              </div>

              <div className="space-y-2 text-xs">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  className="border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-505"
                  {...register("confirmPassword")}
                />
                {errors.confirmPassword && (
                  <p className="text-[11px] text-red-500">{errors.confirmPassword.message}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={passLoading}
                className="w-full bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 mt-2 font-medium"
              >
                {passLoading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
