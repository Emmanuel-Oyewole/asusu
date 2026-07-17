import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { prisma } from "@/lib/prisma";

export default async function VerificationsQueuePage() {
  const pending = await prisma.user.findMany({
    where: { verificationStatus: "PENDING_REVIEW" },
    orderBy: { updatedAt: "asc" }, // oldest submission first — a fair queue
    select: {
      id: true,
      name: true,
      matricNo: true,
      department: true,
      updatedAt: true,
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Verifications</h1>
        <p className="text-sm text-muted-foreground">
          {pending.length} account{pending.length !== 1 ? "s" : ""} awaiting
          review
        </p>
      </div>

      {pending.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-16 text-center">
          <ClipboardList className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No pending verifications right now.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Matric No.</th>
                <th className="px-4 py-3 text-left font-medium">Department</th>
                <th className="px-4 py-3 text-left font-medium">Submitted</th>
                <th className="px-4 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((student) => (
                <tr key={student.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{student.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {student.matricNo}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {student.department}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {student.updatedAt.toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/verifications/${student.id}`}
                      className="text-primary underline underline-offset-4"
                    >
                      Review
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
