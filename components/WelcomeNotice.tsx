"use client";
import { useEffect, useState } from "react";
import { X } from "lucide-react";

export default function WelcomeNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("hla_welcome_seen")) {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    localStorage.setItem("hla_welcome_seen", "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-20 right-6 z-50 max-w-sm bg-white border border-gray-200 rounded-xl shadow-lg p-4 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <p className="font-semibold text-hla-900 text-sm">Welcome to HLA Outreach Manager!</p>
        <button onClick={dismiss} className="text-gray-400 hover:text-gray-600 mt-0.5 shrink-0">
          <X className="h-4 w-4" />
        </button>
      </div>
      <p className="text-sm text-gray-500">
        This is a new tool — if you run into any problems or have suggestions, tap the{" "}
        <span className="font-medium text-hla-900">Problems or Suggestions?</span> button in the bottom right and let us know!
      </p>
    </div>
  );
}
