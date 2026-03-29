import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { register as registerApi } from "../services/authService";
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
import { Select } from "../components/ui/select";

const signupSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().min(1, "Email is required").email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain an uppercase letter")
      .regex(/[a-z]/, "Must contain a lowercase letter")
      .regex(/[0-9]/, "Must contain a number"),
    confirmPassword: z.string(),
    country: z.string().min(2, "Country is required"),
    role: z.enum(["admin", "manager", "employee"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const countries = [
  "United States",
  "Canada",
  "United Kingdom",
  "Germany",
  "India",
  "Australia",
];

const passwordStrength = (password) => {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1)
    return { label: "Weak", className: "bg-red-500/90 text-white" };
  if (score <= 2)
    return { label: "Moderate", className: "bg-amber-500/90 text-white" };
  return { label: "Strong", className: "bg-emerald-500/90 text-white" };
};

export default function SignupForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    country: "",
    role: "employee",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const parse = signupSchema.safeParse(form);
    if (!parse.success) {
      setErrors(parse.error.flatten().fieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      await registerApi(form);
      toast.success("Registration successful! Please sign in.");
      navigate("/login");
    } catch (err) {
      toast.error(err.message || "Registration failed. Please try again.");
      setIsLoading(false);
    }
  };

  const strength = passwordStrength(form.password);

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-4 py-12">
      <Card className="surface-glow w-full max-w-lg border-cyan-500/20">
        <CardContent className="space-y-4 p-6">
          <CardTitle className="text-xl font-semibold tracking-tight">
            Create account
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Join as admin, manager, or employee. Company setup may follow admin
            signup.
          </CardDescription>

          <Form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Name
              </label>
              <Input
                id="name"
                name="name"
                value={form.name}
                onChange={onChange}
                placeholder="Your full name"
                className="bg-background/80"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-destructive">{errors.name}</p>
              )}
            </div>

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
              />
              {errors.email && (
                <p className="mt-1 text-xs text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-sm font-medium text-foreground"
                >
                  Password
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={onChange}
                  placeholder="Strong password"
                  className="bg-background/80"
                />
                {errors.password && (
                  <p className="mt-1 text-xs text-destructive">
                    {errors.password}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-1.5 block text-sm font-medium text-foreground"
                >
                  Confirm password
                </label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onChange={onChange}
                  placeholder="Re-enter password"
                  className="bg-background/80"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-destructive">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            <div className="text-xs font-medium text-muted-foreground">
              Password strength:{" "}
              <span
                className={`ml-1 rounded px-2 py-0.5 ${strength.className}`}
              >
                {strength.label}
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor="country"
                  className="mb-1.5 block text-sm font-medium text-foreground"
                >
                  Country
                </label>
                <Select
                  id="country"
                  name="country"
                  value={form.country}
                  onChange={onChange}
                  className="bg-background/80"
                >
                  <option value="">Select country</option>
                  {countries.map((country) => (
                    <option value={country} key={country}>
                      {country}
                    </option>
                  ))}
                </Select>
                {errors.country && (
                  <p className="mt-1 text-xs text-destructive">
                    {errors.country}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="role"
                  className="mb-1.5 block text-sm font-medium text-foreground"
                >
                  Role
                </label>
                <Select
                  id="role"
                  name="role"
                  value={form.role}
                  onChange={onChange}
                  className="bg-background/80"
                >
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </Select>
                {errors.role && (
                  <p className="mt-1 text-xs text-destructive">{errors.role}</p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full shadow-glow-sm"
              disabled={isLoading}
            >
              {isLoading ? "Registering…" : "Sign up"}
            </Button>
          </Form>

          <p className="text-sm text-muted-foreground">
            Already registered?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
