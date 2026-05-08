"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";

interface Team { id: string; name: string }

export default function RegisterPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "", confirm: "",
    teamId: "", graduationYear: "", major: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/teams").then((r) => r.json()).then(setTeams);
  }, []);

  function set(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Registration failed.");
    } else {
      router.push("/login?registered=1");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-hla-950 via-hla-800 to-hla-700 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur mb-4">
            <span className="text-white font-bold text-2xl tracking-tight">HLA</span>
          </div>
          <h1 className="text-white text-2xl font-bold">Join HLA</h1>
          <p className="text-hla-200 text-sm mt-1">Create your ambassador account</p>
        </div>

        <Card className="shadow-2xl border-0">
          <CardHeader>
            <CardTitle>Ambassador Registration</CardTitle>
            <CardDescription>Fill in your details to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5 col-span-2">
                  <Label>Full Name</Label>
                  <Input placeholder="Jane Doe" value={form.name} onChange={set("name")} required />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label>Email</Label>
                  <Input type="email" placeholder="you@byu.edu" value={form.email} onChange={set("email")} required />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label>Phone (for SMS reminders)</Label>
                  <Input type="tel" placeholder="+1 (801) 555-0100" value={form.phone} onChange={set("phone")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Major</Label>
                  <Input placeholder="Pre-Med" value={form.major} onChange={set("major")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Grad Year</Label>
                  <Input placeholder="2027" value={form.graduationYear} onChange={set("graduationYear")} />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label>Team</Label>
                  <Select onValueChange={(v) => setForm((p) => ({ ...p, teamId: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your team…" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label>Password</Label>
                  <Input type="password" placeholder="••••••••" value={form.password} onChange={set("password")} required />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label>Confirm Password</Label>
                  <Input type="password" placeholder="••••••••" value={form.confirm} onChange={set("confirm")} required />
                </div>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating account…" : "Create account"}
              </Button>
            </form>
            <p className="text-center text-sm text-gray-500 mt-4">
              Already have an account?{" "}
              <Link href="/login" className="text-hla-700 font-medium hover:underline">Sign in</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
