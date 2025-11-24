"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

type UserRole = "student" | "senior" | null;

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole>(null);
  const { toast } = useToast();
  const router = useRouter();

  const handleSignup = (e: React.FormEvent) => {
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

    if (password.length < 8) {
      toast({
        title: "⚠️ Weak password",
        description: "Password must be at least 8 characters",
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

    // TODO: Implement Firebase authentication
    toast({
      title: "✅ Account created!",
      description: `Welcome to Aura Connect, ${name}!`,
    });

    // Route to role-specific dashboard
    setTimeout(() => {
      router.push(`/${role}`);
    }, 1000);
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
              <label htmlFor="name" className="text-sm font-medium">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <input
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <Button type="submit" className="w-full">
              Create Account
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
