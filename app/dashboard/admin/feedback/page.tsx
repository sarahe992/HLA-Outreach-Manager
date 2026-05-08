import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function FeedbackPage() {
  const session = await auth();
  if (!session || !["LEADERSHIP", "LEAD_AMBASSADOR"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  const submissions = await db.feedback.findMany({
    include: { user: { select: { name: true, role: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-hla-900">Feedback & Suggestions</h1>
        <p className="text-gray-500 text-sm mt-1">
          {submissions.length} submission{submissions.length !== 1 ? "s" : ""} from members
        </p>
      </div>

      {submissions.length === 0 ? (
        <p className="text-gray-400 text-sm">No feedback submitted yet.</p>
      ) : (
        <div className="space-y-3">
          {submissions.map((item) => (
            <Card key={item.id}>
              <CardContent className="pt-4 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-hla-900">{item.user.name}</span>
                    <Badge variant="outline" className="text-xs capitalize">
                      {item.user.role.replace("_", " ").toLowerCase()}
                    </Badge>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">
                    {new Date(item.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
