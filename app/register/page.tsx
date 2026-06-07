"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ChevronLeft } from "lucide-react";

function RadioOption({
  label, value, selected, onSelect,
}: {
  label: string; value: string; selected: boolean; onSelect: (v: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={cn(
        "w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-colors",
        selected
          ? "border-hla-600 bg-hla-50 text-hla-900 font-medium"
          : "border-gray-200 text-gray-700 hover:border-hla-300 hover:bg-gray-50"
      )}
    >
      <div className="flex items-center gap-2.5">
        <div className={cn(
          "w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center",
          selected ? "border-hla-600 bg-hla-600" : "border-gray-300 bg-white"
        )}>
          {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
        </div>
        {label}
      </div>
    </button>
  );
}

function RadioGroup({
  options, value, onChange, withOther, otherValue, onOtherChange, otherPlaceholder,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  withOther?: boolean;
  otherValue?: string;
  onOtherChange?: (v: string) => void;
  otherPlaceholder?: string;
}) {
  return (
    <div className="space-y-2">
      {options.map((opt) => (
        <RadioOption key={opt} label={opt} value={opt} selected={value === opt} onSelect={onChange} />
      ))}
      {withOther && (
        <RadioOption label="Other" value="Other" selected={value === "Other"} onSelect={onChange} />
      )}
      {withOther && value === "Other" && (
        <Input
          className="mt-1"
          placeholder={otherPlaceholder ?? "Please specify…"}
          value={otherValue ?? ""}
          onChange={(e) => onOtherChange?.(e.target.value)}
          required
        />
      )}
    </div>
  );
}

const YEAR_OPTIONS = ["Freshman", "Sophomore", "Junior", "Senior", "Graduate Student"];
const BUSINESS_MAJORS = ["Finance", "Accounting", "Strategy", "Global Supply Chain", "EXDM", "HR", "IS", "Management", "Marketing", "Entrepreneurship", "Pre-Business"];
const MEDICAL_CAREERS = ["Doctor", "Nurse", "Dentist", "PA", "NP"];
const HEARD_OPTIONS = ["Tabling", "Friends", "Posters or advertising", "Class"];

interface FormState {
  name: string;
  phone: string;
  yearInSchool: string;
  fieldOfStudy: string;
  businessMajor: string;
  businessMajorOther: string;
  medicalCareer: string;
  medicalCareerOther: string;
  otherMajor: string;
  heardAboutHla: string;
  heardAboutHlaOther: string;
  email: string;
  password: string;
  confirm: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>({
    name: "", phone: "", yearInSchool: "", fieldOfStudy: "",
    businessMajor: "", businessMajorOther: "",
    medicalCareer: "", medicalCareerOther: "",
    otherMajor: "", heardAboutHla: "", heardAboutHlaOther: "",
    email: "", password: "", confirm: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [claimed, setClaimed] = useState(false);

  function set(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  function validateStep1(): string | null {
    if (!form.name.trim()) return "Please enter your name.";
    if (!form.phone.trim()) return "Please enter your phone number.";
    if (!form.yearInSchool) return "Please select your year in school.";
    if (!form.fieldOfStudy) return "Please select your field of study.";
    if (form.fieldOfStudy === "Business") {
      if (!form.businessMajor) return "Please select your business major.";
      if (form.businessMajor === "Other" && !form.businessMajorOther.trim()) return "Please specify your major.";
    }
    if (form.fieldOfStudy === "Medical") {
      if (!form.medicalCareer) return "Please select the career you are pursuing.";
      if (form.medicalCareer === "Other" && !form.medicalCareerOther.trim()) return "Please specify your career.";
    }
    if (form.fieldOfStudy === "Other" && !form.otherMajor.trim()) return "Please enter your major.";
    if (!form.heardAboutHla) return "Please tell us how you heard about HLA.";
    if (form.heardAboutHla === "Other" && !form.heardAboutHlaOther.trim()) return "Please specify how you heard about HLA.";
    return null;
  }

  function handleNext(e: React.FormEvent) {
    e.preventDefault();
    const err = validateStep1();
    if (err) { setError(err); return; }
    setError("");
    setStep(2);
  }

  function deriveMajor() {
    if (form.fieldOfStudy === "Business")
      return form.businessMajor === "Other" ? form.businessMajorOther : form.businessMajor;
    if (form.fieldOfStudy === "Medical")
      return form.medicalCareer === "Other" ? form.medicalCareerOther : form.medicalCareer;
    if (form.fieldOfStudy === "Other") return form.otherMajor;
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) { setError("Passwords do not match."); return; }
    if (form.password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        phone: form.phone,
        email: form.email,
        password: form.password,
        yearInSchool: form.yearInSchool,
        fieldOfStudy: form.fieldOfStudy,
        major: deriveMajor(),
        heardAboutHla: form.heardAboutHla === "Other" ? form.heardAboutHlaOther : form.heardAboutHla,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      if (data.error === "already_claimed") {
        setError("already_claimed");
      } else {
        setError(data.error ?? "Registration failed.");
      }
    } else if (data.claimed) {
      setClaimed(true);
    } else {
      router.push("/login?registered=1");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-hla-950 via-hla-800 to-hla-700 p-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Brand */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur mb-4">
            <span className="text-white font-bold text-2xl tracking-tight">HLA</span>
          </div>
          <h1 className="text-white text-2xl font-bold">Join HLA</h1>
          <p className="text-hla-200 text-sm mt-1">Healthcare Leadership Association · BYU</p>
        </div>

        <Card className="shadow-2xl border-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Ambassador Registration</CardTitle>
                <CardDescription>
                  {step === 1 ? "Tell us about yourself" : "Create your account"}
                </CardDescription>
              </div>
              {/* Step indicator */}
              <div className="flex items-center gap-1.5">
                <div className="w-8 h-1.5 rounded-full bg-hla-600" />
                <div className={cn("w-8 h-1.5 rounded-full transition-colors", step === 2 ? "bg-hla-600" : "bg-gray-200")} />
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {step === 1 ? (
              <form onSubmit={handleNext} className="space-y-5">
                {/* Name */}
                <div className="space-y-1.5">
                  <Label>Full Name *</Label>
                  <Input
                    placeholder="Jane Doe"
                    value={form.name}
                    onChange={set("name")}
                    autoComplete="name"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <Label>Phone Number *</Label>
                  <Input
                    type="tel"
                    placeholder="+1 (801) 555-0100"
                    value={form.phone}
                    onChange={set("phone")}
                    autoComplete="tel"
                  />
                </div>

                {/* Year in school */}
                <div className="space-y-1.5">
                  <Label>Year in School *</Label>
                  <RadioGroup
                    options={YEAR_OPTIONS}
                    value={form.yearInSchool}
                    onChange={(v) => setForm((p) => ({ ...p, yearInSchool: v }))}
                  />
                </div>

                {/* Field of study */}
                <div className="space-y-1.5">
                  <Label>General Field of Study *</Label>
                  <RadioGroup
                    options={["Business", "Medical (Doctor, Nurse, Dentist, PA, NP, Therapist, etc.)", "Public Health", "Other"]}
                    value={form.fieldOfStudy}
                    onChange={(v) => setForm((p) => ({
                      ...p,
                      fieldOfStudy: v,
                      businessMajor: "", businessMajorOther: "",
                      medicalCareer: "", medicalCareerOther: "",
                      otherMajor: "",
                    }))}
                  />
                </div>

                {/* Business major */}
                {form.fieldOfStudy === "Business" && (
                  <div className="space-y-1.5">
                    <Label>Business Major *</Label>
                    <RadioGroup
                      options={BUSINESS_MAJORS}
                      value={form.businessMajor}
                      onChange={(v) => setForm((p) => ({ ...p, businessMajor: v, businessMajorOther: "" }))}
                      withOther
                      otherValue={form.businessMajorOther}
                      onOtherChange={(v) => setForm((p) => ({ ...p, businessMajorOther: v }))}
                      otherPlaceholder="Your major…"
                    />
                  </div>
                )}

                {/* Medical career */}
                {form.fieldOfStudy === "Medical (Doctor, Nurse, Dentist, PA, NP, Therapist, etc.)" && (
                  <div className="space-y-1.5">
                    <Label>Career You Are Pursuing *</Label>
                    <RadioGroup
                      options={MEDICAL_CAREERS}
                      value={form.medicalCareer}
                      onChange={(v) => setForm((p) => ({ ...p, medicalCareer: v, medicalCareerOther: "" }))}
                      withOther
                      otherValue={form.medicalCareerOther}
                      onOtherChange={(v) => setForm((p) => ({ ...p, medicalCareerOther: v }))}
                      otherPlaceholder="Your career path…"
                    />
                  </div>
                )}

                {/* Other major */}
                {form.fieldOfStudy === "Other" && (
                  <div className="space-y-1.5">
                    <Label>What is your major? *</Label>
                    <Input
                      placeholder="Your major…"
                      value={form.otherMajor}
                      onChange={set("otherMajor")}
                    />
                  </div>
                )}

                {/* How did you hear about HLA */}
                <div className="space-y-1.5">
                  <Label>How did you hear about HLA? *</Label>
                  <RadioGroup
                    options={HEARD_OPTIONS}
                    value={form.heardAboutHla}
                    onChange={(v) => setForm((p) => ({ ...p, heardAboutHla: v, heardAboutHlaOther: "" }))}
                    withOther
                    otherValue={form.heardAboutHlaOther}
                    onOtherChange={(v) => setForm((p) => ({ ...p, heardAboutHlaOther: v }))}
                    otherPlaceholder="How you heard about us…"
                  />
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <Button type="submit" className="w-full">Next</Button>

                <p className="text-center text-sm text-gray-500">
                  Already have an account?{" "}
                  <Link href="/login" className="text-hla-700 font-medium hover:underline">Sign in</Link>
                </p>
              </form>
            ) : claimed ? (
              <div className="space-y-4">
                <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-4 text-sm text-green-800 space-y-1">
                  <p className="font-semibold">Your email is already in our system!</p>
                  <p>Your password has been set and your account is ready to go.</p>
                </div>
                <Button className="w-full" onClick={() => router.push("/login")}>
                  Sign in to your account
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <button
                  type="button"
                  onClick={() => { setStep(1); setError(""); }}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 -mt-1 mb-1"
                >
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>

                <div className="space-y-1.5">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@byu.edu"
                    value={form.email}
                    onChange={set("email")}
                    autoComplete="email"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={set("password")}
                    autoComplete="new-password"
                    required
                  />
                  <p className="text-xs text-gray-400">Minimum 8 characters</p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirm">Confirm Password *</Label>
                  <Input
                    id="confirm"
                    type="password"
                    placeholder="••••••••"
                    value={form.confirm}
                    onChange={set("confirm")}
                    autoComplete="new-password"
                    required
                  />
                </div>

                {error && error !== "already_claimed" && (
                  <p className="text-sm text-red-600">{error}</p>
                )}
                {error === "already_claimed" && (
                  <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800 space-y-1">
                    <p className="font-medium">It looks like you already have an account.</p>
                    <p>
                      Try{" "}
                      <Link href="/login" className="underline font-medium">signing in</Link>
                      , or{" "}
                      <Link href="/forgot-password" className="underline font-medium">reset your password</Link>
                      {" "}if you can&apos;t remember it.
                    </p>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating account…" : "Create account"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
