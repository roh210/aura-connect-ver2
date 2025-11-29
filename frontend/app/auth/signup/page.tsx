"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

type UserRole = "student" | "senior" | null;

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { signUp } = useAuth();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!name || !email || !password || !confirmPassword || !role) {
      toast({
        title: "⚠️ Missing fields",
        description: "Please fill in all fields and select a role",
        variant: "destructive",
      });
      return;
    }

    if (!email.includes("@")) {
      toast({
        title: "⚠️ Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "⚠️ Weak password",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "⚠️ Passwords don't match",
        description: "Please make sure your passwords match",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Firebase authentication
      await signUp(email, password, name, role);

      toast({
        title: "✅ Account created!",
        description: `Welcome to Aura Connect, ${name}!`,
      });

      // Redirect will happen after auth state updates
      setTimeout(() => {
        router.push(`/${role}`);
      }, 1000);
    } catch (error: any) {
      // Firebase error codes
      const errorMessages: Record<string, string> = {
        "auth/email-already-in-use":
          "An account with this email already exists",
        "auth/invalid-email": "Invalid email address",
        "auth/weak-password": "Password should be at least 6 characters",
        "auth/operation-not-allowed": "Email/password sign up is not enabled",
      };

      const message =
        errorMessages[error.code] ||
        "Failed to create account. Please try again.";

      toast({
        title: "❌ Sign up failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-purple-50 to-pink-50">
      <Card className="max-w-md w-full">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold text-center">
            ✨ Sign Up
          </CardTitle>
          <CardDescription className="text-center">
            Create your Aura Connect account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            {/* Role Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">I am a...</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole("student")}
                  className={`p-3 border-2 rounded-md text-center transition-all ${
                    role === "student"
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="text-2xl mb-1">👨‍🎓</div>
                  <div className="text-xs font-medium">Student</div>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("senior")}
                  className={`p-3 border-2 rounded-md text-center transition-all ${
                    role === "senior"
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="text-2xl mb-1">👴</div>
                  <div className="text-xs font-medium">Senior</div>
                </button>
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder={
                  role === "student"
                    ? "student@university.edu"
                    : role === "senior"
                    ? "senior@email.com"
                    : "your@email.com"
                }
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            <p className="text-gray-600">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="text-purple-600 hover:underline font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
