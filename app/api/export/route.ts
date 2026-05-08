import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import * as XLSX from "xlsx";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "LEADERSHIP") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [tablingEvents, pitchingEvents, users] = await Promise.all([
    db.tablingEvent.findMany({
      include: { team: true, postData: true, slots: { include: { signups: { where: { cancelledAt: null } } } } },
      orderBy: { date: "asc" },
    }),
    db.pitchingEvent.findMany({
      include: { user: { select: { name: true, team: true } } },
      orderBy: { scheduledAt: "asc" },
    }),
    db.user.findMany({
      where: { role: "AMBASSADOR" },
      include: {
        team: true,
        tablingSignups: {
          where: { cancelledAt: null },
          include: { slot: { include: { tablingEvent: { include: { postData: true } } } } },
        },
        pitchingEvents: true,
      },
    }),
  ]);

  const tablingSheet = tablingEvents.map((e) => ({
    Team: e.team.name,
    Location: e.location,
    Date: e.date.toLocaleDateString(),
    "Snack Plan": e.snackPlan ?? "",
    "Students Reached": e.postData?.studentsReached ?? "",
    "Ambassadors Showed": e.postData?.ambassadorsShowed ?? "",
    "Total Hours": e.postData?.totalHours ?? "",
    "Signed Up": e.slots.reduce((s, sl) => s + sl.signups.length, 0),
  }));

  const pitchingSheet = pitchingEvents.map((e) => ({
    Ambassador: e.user.name,
    Team: e.user.team?.name ?? "—",
    "Class Name": e.className,
    Professor: e.professorName,
    Date: e.scheduledAt.toLocaleDateString(),
    "Student Count": e.studentCount ?? "",
    Completed: e.isCompleted ? "Yes" : "No",
  }));

  const ambassadorSheet = users.map((u) => ({
    Name: u.name,
    Email: u.email,
    Team: u.team?.name ?? "—",
    "Tabling Events Attended": u.tablingSignups.length,
    "Pitching Events": u.pitchingEvents.length,
    "Total Hours": u.tablingSignups.reduce(
      (s, sg) => s + (sg.slot.tablingEvent.postData?.totalHours ?? 0),
      0
    ),
    "Students Reached": u.tablingSignups.reduce(
      (s, sg) => s + (sg.slot.tablingEvent.postData?.studentsReached ?? 0),
      0
    ),
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(tablingSheet), "Tabling Events");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(pitchingSheet), "Pitching Events");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ambassadorSheet), "Ambassador Stats");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="HLA-KPI-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
