import type { Bill, User } from "@/lib/types";
import { BillsTable } from "../bills/bills-table";

interface SupervisorDashboardProps {
  user: User;
  bills: Bill[];
  users: User[];
}

export function SupervisorDashboard({ user, bills, users }: SupervisorDashboardProps) {
  const employees = users.filter(u => u.supervisorId === user.id);
  const employeeIds = employees.map(e => e.id);
  
  const pendingBills = bills.filter(
    (bill) => employeeIds.includes(bill.employeeId) && bill.status === "SUBMITTED"
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Pending Approvals</h1>
      <BillsTable bills={pendingBills} users={users} title="Bills from Your Team" />
    </div>
  );
}
