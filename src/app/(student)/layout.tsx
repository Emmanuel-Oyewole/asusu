import { requireStudent } from "@/lib/auth";
import { StudentShell } from "@/components/dashboard/student-shell";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireStudent();
  return <StudentShell userName={profile.name}>{children}</StudentShell>;
}
