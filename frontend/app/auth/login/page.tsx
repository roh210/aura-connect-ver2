"use client";

import { useState, useEffect } from "react";
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

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { signIn, user } = useAuth();

  // Auto-redirect when user is loaded
  useEffect(() => {
    if (user) {
      console.log("User logged in, redirecting to:", `/${user.role}`);
      router.push(`/${user.role}`);
    }
  }, [user, router]);

  const handleLogin = async (e: React.FormEvent) => {
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

    setLoading(true);

    try {
      // Firebase authentication
      await signIn(email, password);

      toast({
        title: "✅ Login successful",
        description: "Redirecting to dashboard...",
      });

      // Redirect will happen in useEffect based on user role
    } catch (error: any) {
      // Firebase error codes
      const errorMessages: Record<string, string> = {
        "auth/user-not-found": "No account found with this email",
        "auth/wrong-password": "Incorrect password",
        "auth/invalid-email": "Invalid email address",
        "auth/user-disabled": "This account has been disabled",
        "auth/too-many-requests":
          "Too many login attempts. Please try again later.",
        "auth/invalid-credential": "Invalid email or password",
      };

      const message =
        errorMessages[error.code] || "Failed to sign in. Please try again.";

      toast({
        title: "❌ Sign in failed",
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
            🔐 Login
          </CardTitle>
          <CardDescription className="text-center">
            Sign in to Aura Connect
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
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
