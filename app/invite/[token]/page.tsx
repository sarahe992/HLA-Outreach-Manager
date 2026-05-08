"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const [invite, setInvite] = useState<{ role: string; valid: boolean } | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/invites/${token}`)
      .then((r) => r.json())
      .then(setInvite);
  }, [token]);

  function set(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    const res = await fetch(`/api/invites/${token}/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Failed to create account."); return; }
    router.push("/login?registered=1");
  }

  if (!invite) return <div className="min-h-screen flex items-center justify-center">Loading…</div>;
  if (!invite.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-hla-950 to-hla-700 p-4">
        <Card className="max-w-sm w-full text-center p-8">
          <p className="text-red-600 font-semibold">This invite link is invalid or has expired.</p>
        </Card>
      </div>
    );
  }

  const roleLabel = invite.role === "LEAD_AMBASSADOR" ? "Lead Ambassador" : "Club Leadership";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-hla-950 via-hla-800 to-hla-700 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur mb-4">
            <span className="text-white font-bold text-2xl">HLA</span>
          </div>
          <h1 className="text-white text-2xl font-bold">You've been invited</h1>
          <p className="text-hla-200 text-sm mt-1">
            Create your account as{" "}
            <Badge variant="secondary" className="ml-1">{roleLabel}</Badge>
          </p>
        </div>
        <Card className="shadow-2xl border-0">
          <CardHeader>
            <CardTitle>Create your account</CardTitle>
            <CardDescription>Fill in the details below to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Full Name</Label>
                <Input placeholder="Jane Doe" value={form.name} onChange={set("name")} required />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" placeholder="you@byu.edu" value={form.email} onChange={set("email")} required />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input type="tel" placeholder="+1 (801) 555-0100" value={form.phone} onChange={set("phone")} />
              </div>
              <div className="space-y-1.5">
                <Label>Password</Label>
                <Input type="password" placeholder="••••••••" value={form.password} onChange={set("password")} required />
              </div>
              <div className="space-y-1.5">
                <Label>Confirm Password</Label>
                <Input type="password" placeholder="••••••••" value={form.confirm} onChange={set("confirm")} required />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating account…" : "Create account"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
