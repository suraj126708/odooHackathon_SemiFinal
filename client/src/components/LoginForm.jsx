import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { AuthContext } from "../context/AuthContext";
import { login as loginApi } from "../services/authService";
import { toast } from "react-toastify";
import {
  Card,
  CardTitle,
  CardDescription,
  CardContent,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Form } from "../components/ui/form";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export default function LoginForm() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const onChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const getRedirectPath = (role) => {
    if (role === "admin") return "/admin/dashboard";
    if (role === "manager") return "/manager/dashboard";
    return "/user/dashboard";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const parse = loginSchema.safeParse(form);
    if (!parse.success) {
      const zErrors = parse.error.flatten().fieldErrors;
      setErrors(zErrors);
      return;
    }

    setIsLoading(true);

    try {
      const response = await loginApi(form);
      login(response.token, response.user);
      localStorage.setItem("rms_role", response.user.role);
      toast.success("Login successful!");
      navigate(getRedirectPath(response.user.role));
    } catch (ex) {
      toast.error(ex.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-4 py-12">
      <Card className="surface-glow w-full max-w-md border-cyan-500/20">
        <CardContent className="space-y-4 p-6">
          <CardTitle className="text-xl font-semibold tracking-tight">
            Sign in
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Access the reimbursement management system.
          </CardDescription>

          <Form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={onChange}
                placeholder="you@example.com"
                className="bg-background/80"
                aria-invalid={errors.email ? "true" : "false"}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-destructive">{errors.email}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={onChange}
                  placeholder="••••••••"
                  className="bg-background/80 pr-16"
                  aria-invalid={errors.password ? "true" : "false"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2 top-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.password}
                </p>
              )}
            </div>

            <div className="flex flex-wrap justify-between gap-2 text-sm">
              <Link
                to="#"
                className="text-primary hover:underline"
              >
                Forgot password?
              </Link>
              <Link to="/register" className="text-primary hover:underline">
                Create account
              </Link>
            </div>

            <Button type="submit" className="w-full shadow-glow-sm" disabled={isLoading}>
              {isLoading ? "Signing in…" : "Sign in"}
            </Button>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
