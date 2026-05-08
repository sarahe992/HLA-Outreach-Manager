"use client";
import { useState } from "react";
import { MessageCircleQuestion } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    setStatus("done");
    setBody("");
  }

  function handleClose(val: boolean) {
    setOpen(val);
    if (!val) setStatus("idle");
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-hla-950 text-white text-sm font-medium px-4 py-2.5 rounded-full shadow-lg hover:bg-hla-800 transition-colors"
      >
        <MessageCircleQuestion className="h-4 w-4" />
        Problems or Suggestions?
      </button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Share Feedback</DialogTitle>
          </DialogHeader>

          {status === "done" ? (
            <div className="py-6 text-center space-y-3">
              <p className="text-2xl">Thanks!</p>
              <p className="text-gray-500 text-sm">We got your message and will look into it.</p>
              <Button onClick={() => handleClose(false)}>Close</Button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <p className="text-sm text-gray-500">
                This is a new tool — if you notice any problems or have any suggestions, note them here and we will get working on them!
              </p>
              <Textarea
                placeholder="Describe the issue or suggestion..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={5}
                required
              />
              <Button type="submit" className="w-full" disabled={status === "sending"}>
                {status === "sending" ? "Sending..." : "Submit"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
