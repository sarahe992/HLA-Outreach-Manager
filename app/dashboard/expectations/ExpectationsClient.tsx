"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Role } from "@prisma/client";

interface Props {
  role: Role;
}

function AmbassadorExpectations() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
        <div className="flex items-start gap-4">
          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-hla-100 text-hla-800 flex items-center justify-center font-bold text-sm">1</span>
          <div className="space-y-1">
            <h3 className="font-semibold text-gray-900">Invite at least 1 person per week</h3>
            <p className="text-sm text-gray-600">
              Reach out to students from your major or school (e.g. Cell Biology, School of Life Sciences) and invite them to the weekly HLA event. Introduce your guest(s) to the <strong>President or Vice President</strong> when they attend.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
        <div className="flex items-start gap-4">
          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-hla-100 text-hla-800 flex items-center justify-center font-bold text-sm">2</span>
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900">Tabling &amp; Class Pitches</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-hla-50 rounded-lg p-3 space-y-1">
                <p className="text-xs font-semibold text-hla-700 uppercase tracking-wide">Tabling</p>
                <p className="text-sm text-gray-700"><strong>1 per month</strong> — dedicate 2–3 hours helping your team run an educational booth explaining HLA to fellow students.</p>
              </div>
              <div className="bg-hla-50 rounded-lg p-3 space-y-1">
                <p className="text-xs font-semibold text-hla-700 uppercase tracking-wide">Class Pitch</p>
                <p className="text-sm text-gray-700"><strong>1 per semester</strong> — your Lead Ambassador will mentor you to set up and deliver a pitch in one of your classes.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
        <div className="flex items-start gap-4">
          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-hla-100 text-hla-800 flex items-center justify-center font-bold text-sm">3</span>
          <div className="space-y-1">
            <h3 className="font-semibold text-gray-900">Stay in touch with your Lead Ambassador</h3>
            <p className="text-sm text-gray-600">
              Your Lead Ambassador is your main resource for extra opportunities to serve and lead. Keep them informed of your desire to help and to bring new people into the HLA family.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function LeadAmbassadorExpectations() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-start gap-4">
          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-hla-100 text-hla-800 flex items-center justify-center font-bold text-sm">1</span>
          <div className="space-y-3 flex-1">
            <h3 className="font-semibold text-gray-900">Growth Support</h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-sm text-gray-600">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-hla-400 flex-shrink-0" />
                Facilitate <strong>2 tablings per month</strong> in your location.
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-600">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-hla-400 flex-shrink-0" />
                Complete <strong>2 class pitches yourself</strong> throughout the semester.
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-600">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-hla-400 flex-shrink-0" />
                Train each ambassador on your team on how to pitch.
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-600">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-hla-400 flex-shrink-0" />
                Support each ambassador in completing <strong>1 class pitch per semester</strong> — help them reach out to a professor, practice beforehand, and successfully deliver the pitch.
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-start gap-4">
          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-hla-100 text-hla-800 flex items-center justify-center font-bold text-sm">2</span>
          <div className="space-y-3 flex-1">
            <h3 className="font-semibold text-gray-900">Create Community</h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-sm text-gray-600">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-hla-400 flex-shrink-0" />
                Conduct <strong>monthly one-on-ones</strong> with each ambassador (can be split between yourself and your co-lead).
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-600">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-hla-400 flex-shrink-0" />
                Gather your ambassador team as often as time permits.
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-600">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-hla-400 flex-shrink-0" />
                Build an uplifting community centered on faith in Jesus Christ and passion for improving healthcare — a space where students develop meaningful relationships and a vision for their future.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ExpectationsClient({ role }: Props) {
  const showBoth = role === "LEAD_AMBASSADOR" || role === "LEADERSHIP";
  const [tab, setTab] = useState<"ambassador" | "lead">("ambassador");

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-hla-900">Expectations</h1>
        <p className="text-gray-500 text-sm mt-1">
          {showBoth
            ? "Role expectations for ambassadors and lead ambassadors."
            : "Your responsibilities as an Ambassador."}
        </p>
      </div>

      {showBoth ? (
        <>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
            <button
              onClick={() => setTab("ambassador")}
              className={cn(
                "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
                tab === "ambassador"
                  ? "bg-white text-hla-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              Ambassador
            </button>
            <button
              onClick={() => setTab("lead")}
              className={cn(
                "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
                tab === "lead"
                  ? "bg-white text-hla-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              Lead Ambassador
            </button>
          </div>

          {tab === "ambassador" ? <AmbassadorExpectations /> : <LeadAmbassadorExpectations />}
        </>
      ) : (
        <AmbassadorExpectations />
      )}
    </div>
  );
}
