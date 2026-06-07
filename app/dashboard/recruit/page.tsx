"use client";
import { useState } from "react";
import { Copy, Check, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RecruitPage() {
  const [copied, setCopied] = useState(false);

  const link = typeof window !== "undefined"
    ? `${window.location.origin}/register`
    : "/register";

  function copyLink() {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="p-6 max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-hla-900">Recruit Ambassadors</h1>
        <p className="text-gray-500 text-sm mt-1">
          Share this link with anyone interested in joining HLA as an ambassador.
        </p>
      </div>

      {/* Link card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center gap-2 text-hla-800">
          <Link2 className="h-4 w-4" />
          <span className="font-semibold text-sm">Ambassador Registration Link</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-700 font-mono truncate">
            {link}
          </div>
          <Button onClick={copyLink} variant={copied ? "default" : "outline"} className="flex-shrink-0 gap-2 min-w-[110px]">
            {copied
              ? <><Check className="h-4 w-4" /> Copied!</>
              : <><Copy className="h-4 w-4" /> Copy link</>}
          </Button>
        </div>

        <p className="text-xs text-gray-400">
          Anyone with this link can sign up. They'll be automatically assigned to a team and you'll receive a notification.
        </p>
      </div>

      {/* Tips */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
        <h2 className="font-semibold text-gray-900 text-sm">Tips for sharing</h2>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-hla-400 flex-shrink-0" />
            Text or DM the link directly to someone after chatting with them at a tabling event.
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-hla-400 flex-shrink-0" />
            Drop it in a group chat or class Discord after a class pitch.
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-hla-400 flex-shrink-0" />
            Put it in your Instagram bio or story during recruiting pushes.
          </li>
        </ul>
      </div>
    </div>
  );
}
