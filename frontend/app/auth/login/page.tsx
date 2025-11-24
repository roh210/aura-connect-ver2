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

type UserRole = "student" | "senior";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("student");
  const { toast } = useToast();
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!email || !password) {
      toast({
        title: "⚠️ Missing fields",
        description: "Please fill in all fields",
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

    // TODO: Implement Firebase authentication
    // Extract name from email (before @)
    const userName = email.split("@")[0];

    toast({
      title: "✅ Login successful",
      description: `Welcome back, ${userName}!`,
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
            🔐 Login
          </CardTitle>
          <CardDescription className="text-center">
            Sign in to Aura Connect
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
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
                    : "senior@email.com"
                }
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <Button type="submit" className="w-full">
              Sign In
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            <p className="text-gray-600">
              Don&apos;t have an account?{" "}
              <Link
                href="/auth/signup"
                className="text-purple-600 hover:underline font-medium"
              >
                Sign up
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
