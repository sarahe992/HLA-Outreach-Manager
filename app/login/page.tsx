"use client";
import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

function StatusBanner() {
  const searchParams = useSearchParams();
  if (searchParams.get("registered") === "1") {
    return (
      <div className="flex items-center gap-2.5 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-800 text-sm">
        <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-600" />
        Account created! Sign in to access your dashboard.
      </div>
    );
  }
  if (searchParams.get("reset") === "1") {
    return (
      <div className="flex items-center gap-2.5 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-800 text-sm">
        <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-600" />
        Password updated! Sign in with your new password.
      </div>
    );
  }
  return null;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      // Check if this is a pre-imported unclaimed account
      const check = await fetch("/api/auth/check-unclaimed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const { unclaimed } = await check.json();
      setError(unclaimed ? "unclaimed" : "invalid");
    } else {
      router.push("/dashboard/calendar");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-hla-950 via-hla-800 to-hla-700 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo / Brand */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur mb-4">
            <span className="text-white font-bold text-2xl tracking-tight">HLA</span>
          </div>
          <h1 className="text-white text-2xl font-bold">HLA Outreach Manager</h1>
          <p className="text-hla-200 text-sm mt-1">Healthcare Leadership Association · BYU</p>
        </div>

        <Suspense>
          <StatusBanner />
        </Suspense>

        <Card className="shadow-2xl border-0">
          <CardHeader>
            <CardTitle>Sign in to your account</CardTitle>
            <CardDescription>Enter your email and password below</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@byu.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error === "unclaimed" && (
                <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-800 space-y-1">
                  <p className="font-medium">Your email is in our system, but you haven&apos;t set a password yet.</p>
                  <p>
                    <Link href="/register" className="underline font-medium">Go to Register</Link>
                    {" "}to set up your account — it only takes a minute.
                  </p>
                </div>
              )}
              {error === "invalid" && (
                <div className="space-y-1">
                  <p className="text-sm text-red-600">Invalid email or password.</p>
                  <Link href="/forgot-password" className="text-sm text-hla-700 hover:underline">
                    Forgot your password?
                  </Link>
                </div>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in…" : "Sign in"}
              </Button>
            </form>
            <p className="text-center text-sm text-gray-500 mt-4">
              New ambassador?{" "}
              <Link href="/register" className="text-hla-700 font-medium hover:underline">
                Create an account
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
