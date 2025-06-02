"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Simple validation for demo purposes
      // In a real app, this would call your authentication API
      const users = JSON.parse(localStorage.getItem('subscription-tracker-users') || '[]');
      const user = users.find((u: any) => u.email === email);

      if (!user) {
        setError("No account found with this email");
        setIsLoading(false);
        return;
      }

      // For demo purposes, we'll just check if password is provided
      // In a real app, you'd verify the password hash
      if (!password) {
        setError("Password is required");
        setIsLoading(false);
        return;
      }

      // Set user session in localStorage (demo purposes)
      localStorage.setItem('subscription-tracker-session', JSON.stringify({
        user: { id: user.id, name: user.name, email: user.email },
        signedIn: true
      }));

      router.push("/");
      router.refresh();
    } catch (error) {
      console.log("🚀 ~ handleSubmit ~ error:", error)
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Sign In
          </CardTitle>
          <p className="text-muted-foreground text-center">
            Welcome back to Subscription Tracker
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md dark:bg-red-950 dark:border-red-800 dark:text-red-400">
                <AlertTriangle className="h-4 w-4" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">
                Don&apos;t have an account?{" "}
              </span>
              <Link 
                href="/auth/signup" 
                className="text-primary hover:underline"
              >
                Sign up
              </Link>
            </div>
          </form>        </CardContent>
      </Card>
    </div>
  );
}
