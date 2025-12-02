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
    <main className="min-h-screen flex items-center justify-center p-4 sm:p-8 relative overflow-hidden">
      {/* Holographic Gradient Background - matching landing page */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/50 via-purple-800/50 to-pink-900/50 animate-pulse" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.3),transparent_50%)]" />
      </div>

      <Card className="max-w-md w-full relative z-10 bg-gray-800/80 backdrop-blur-lg border-purple-500/30">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold text-center">
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              ✨ Sign Up
            </span>
          </CardTitle>
          <CardDescription className="text-center text-gray-300">
            Create your Aura Connect account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            {/* Role Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">
                I am a...
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole("student")}
                  className={`p-3 border-2 rounded-md text-center transition-all min-h-[44px] ${
                    role === "student"
                      ? "border-purple-400 bg-purple-600/30 text-white shadow-lg shadow-purple-500/20"
                      : "border-purple-500/30 bg-gray-700/30 text-gray-300 hover:border-purple-400 hover:bg-purple-600/20"
                  }`}
                >
                  <div className="text-2xl mb-1">👨‍🎓</div>
                  <div className="text-xs font-medium">Student</div>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("senior")}
                  className={`p-3 border-2 rounded-md text-center transition-all min-h-[44px] ${
                    role === "senior"
                      ? "border-pink-400 bg-pink-600/30 text-white shadow-lg shadow-pink-500/20"
                      : "border-purple-500/30 bg-gray-700/30 text-gray-300 hover:border-pink-400 hover:bg-pink-600/20"
                  }`}
                >
                  <div className="text-2xl mb-1">👴</div>
                  <div className="text-xs font-medium">Senior</div>
                </button>
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-200">
                Full Name
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                required
                className="bg-gray-700/50 border-purple-500/30 text-white placeholder:text-gray-400 focus:border-purple-400"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-200">
                Email
              </Label>
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
                className="bg-gray-700/50 border-purple-500/30 text-white placeholder:text-gray-400 focus:border-purple-400"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-200">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
                className="bg-gray-700/50 border-purple-500/30 text-white placeholder:text-gray-400 focus:border-purple-400"
              />
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-200">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
                className="bg-gray-700/50 border-purple-500/30 text-white placeholder:text-gray-400 focus:border-purple-400"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 min-h-[44px]"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            <p className="text-gray-300">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="text-purple-400 hover:text-pink-400 hover:underline font-medium transition-colors"
              >
                Login
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
