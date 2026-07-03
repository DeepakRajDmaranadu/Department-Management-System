import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useNavigate } from "react-router-dom";
import { getRoleRedirectPath } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, RefreshCw, Lock, User as UserIcon, AlertCircle } from "lucide-react";
import { CaptchaCanvas } from "./CaptchaCanvas";

const generateCaptchaText = () => {
  const chars = "0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const loginFormSchema = z.object({
  employeeId: z.string().trim().min(1, "Employee ID is required"),
  password: z.string().min(1, "Password is required"),
  captchaInput: z.string().trim().min(1, "Captcha code is required"),
  rememberMe: z.boolean(),
});

export const Login = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [captchaText, setCaptchaText] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate(getRoleRedirectPath(user.role), { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    setCaptchaText(generateCaptchaText());
  }, []);

  const refreshCaptcha = () => {
    setCaptchaText(generateCaptchaText());
    setValue("captchaInput", "");
  };

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      employeeId: "",
      password: "",
      captchaInput: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (data) => {
    if (data.captchaInput.toLowerCase() !== captchaText.toLowerCase()) {
      toast.error("Incorrect Captcha. Please try again.");
      refreshCaptcha();
      return;
    }

    setIsLoading(true);
    try {
      const loggedUser = await login(
        data.employeeId,
        data.password,
        data.rememberMe
      );
      toast.success("Welcome back! Redirecting to dashboard...");
      navigate(getRoleRedirectPath(loggedUser.role), { replace: true });
    } catch (err) {
      toast.error(typeof err === "string" ? err : (err.message || "Failed to sign in. Please verify your credentials."));
      refreshCaptcha();
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    toast.info("Password recovery is managed by the system administrator. Please contact the IT support desk to reset your password.");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-12 text-foreground sm:px-6 lg:px-8 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-100/50 via-background to-background dark:from-zinc-900/40 dark:via-background dark:to-background -z-10" />
      
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-card shadow-inner">
            <Lock className="h-6 w-6 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Department DMS
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign in to access your dashboard
          </p>
        </div>
 
        <Card className="border border-border bg-card shadow-xl backdrop-blur-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl text-center text-foreground">Employee Login</CardTitle>
            <CardDescription className="text-center text-muted-foreground">
              Only registered staff members may sign in.
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">

              <div className="space-y-2">
                <Label htmlFor="employeeId" className="text-foreground text-xs font-semibold">Employee ID</Label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground/60">
                    <UserIcon className="h-4 w-4" />
                  </span>
                  <Input
                    id="employeeId"
                    type="text"
                    placeholder="e.g. ADM001"
                    className="pl-10 border-border bg-muted/30 text-foreground placeholder-muted-foreground/50 focus:border-primary/30"
                    {...register("employeeId")}
                    disabled={isLoading}
                  />
                </div>
                {errors.employeeId && (
                  <p className="text-xs text-red-500">{errors.employeeId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-foreground text-xs font-semibold">Password</Label>
                  <a
                    href="#"
                    onClick={handleForgotPassword}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Forgot Password?
                  </a>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground/60">
                    <Lock className="h-4 w-4" />
                  </span>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-10 pr-10 border-border bg-muted/30 text-foreground placeholder-muted-foreground/50 focus:border-primary/30"
                    {...register("password")}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground/60 hover:text-foreground transition-colors"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="captchaInput" className="text-foreground text-xs font-semibold">Security Captcha</Label>
                <div className="flex items-center space-x-3">
                  <CaptchaCanvas text={captchaText} />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={refreshCaptcha}
                    className="border-border bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                    title="Refresh Captcha"
                    disabled={isLoading}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
                <Input
                  id="captchaInput"
                  type="text"
                  placeholder="Enter 6-digit captcha code"
                  className="border-border bg-muted/30 text-foreground placeholder-muted-foreground/50 focus:border-primary/30"
                  {...register("captchaInput")}
                  disabled={isLoading}
                  autoComplete="off"
                />
                {errors.captchaInput && (
                  <p className="text-xs text-red-500">{errors.captchaInput.message}</p>
                )}
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <Checkbox
                  id="rememberMe"
                  {...register("rememberMe")}
                  disabled={isLoading}
                  className="border-border"
                />
                <Label
                  htmlFor="rememberMe"
                  className="text-xs text-muted-foreground cursor-pointer select-none"
                >
                  Remember Me
                </Label>
              </div>
            </CardContent>

            <CardFooter>
              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all flex items-center justify-center space-x-2 shadow-sm"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};
