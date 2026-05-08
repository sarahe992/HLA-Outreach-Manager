import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function GuidelinesPage() {
  const session = await auth();
  if (!session || session.user.role === "AMBASSADOR") redirect("/dashboard/calendar");

  return (
    <div className="p-6 max-w-3xl space-y-8">
      <h1 className="text-2xl font-bold text-hla-900">Tabling Guidelines</h1>
      <p className="text-gray-500 text-sm -mt-4">Reference guide for Lead Ambassadors</p>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-hla-800 border-b border-hla-100 pb-2">
          📅 How to Schedule a Tabling
        </h2>
        <ul className="space-y-2 text-sm text-gray-700 list-disc list-inside">
          <li>Email the BCC (Business Career Center) <strong>2 weeks in advance</strong> to secure a spot at the Tanner building or the Wilk.</li>
          <li>
            All HLA communication to the BCC must go through{" "}
            <strong>Marcus (VP of Events)</strong> at{" "}
            <a href="mailto:ostvi011@student.byu.edu" className="text-hla-700 underline">
              ostvi011@student.byu.edu
            </a>{" "}
            — send him the exact email you want forwarded.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-hla-800 border-b border-hla-100 pb-2">
          🗓️ How to Organize a Tabling
        </h2>
        <ul className="space-y-2 text-sm text-gray-700 list-disc list-inside">
          <li>
            Use{" "}
            <a href="https://whenisgood.net/" target="_blank" rel="noreferrer" className="text-hla-700 underline">
              WhenIsGood
            </a>{" "}
            to poll team availability.
          </li>
          <li>Build a shared Google Calendar showing when team members are free.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-hla-800 border-b border-hla-100 pb-2">
          ✅ How to Execute a Tabling
        </h2>
        <ol className="space-y-2 text-sm text-gray-700 list-decimal list-inside">
          <li>
            Submit the purchasing form <strong>3 days in advance</strong> at{" "}
            <span className="text-hla-700 font-mono text-xs bg-hla-50 px-1 py-0.5 rounded">bit.ly3/hlapurchasing</span>{" "}
            to get spending approval from Emily.
          </li>
          <li>
            After approval, fill out the <strong>credit card checkout form</strong>:
            <ul className="mt-1 ml-4 space-y-1 list-disc">
              <li>Event name: <em>Tabling</em></li>
              <li>Date/time: the tabling time</li>
              <li>Estimated attendance: number of cookies to give out</li>
              <li>Remaining budget: <strong>$2,000</strong> (tabling does not come out of the budget)</li>
            </ul>
          </li>
          <li>Purchase cookies <strong>the night before</strong>.</li>
          <li>Text ambassadors a reminder the night before (group text first, then individual follow-ups).</li>
          <li>Pick up the tabling box from <strong>Britt's office</strong>.</li>
          <li>
            Set up the table with: QR codes, swag, cookies, banners, tablecloth.
          </li>
          <li>Wear HLA merch if possible.</li>
        </ol>
      </section>
    </div>
  );
}
