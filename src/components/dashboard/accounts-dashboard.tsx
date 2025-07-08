import type { Bill, User } from "@/lib/types";
import { BillsTable } from "../bills/bills-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AccountsDashboardProps {
  user: User;
  bills: Bill[];
  users: User[];
}

export function AccountsDashboard({ user, bills, users }: AccountsDashboardProps) {
  const pendingApprovalBills = bills.filter(
    (bill) => bill.status === "APPROVED_BY_SUPERVISOR"
  );
  
  const pendingPaymentBills = bills.filter(
      (bill) => bill.status === "APPROVED_BY_MANAGEMENT"
  )

  const allBills = bills;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Accounts Department</h1>
      <Tabs defaultValue="pending-approval">
        <TabsList>
          <TabsTrigger value="pending-approval">Pending Approval</TabsTrigger>
          <TabsTrigger value="pending-payment">Pending Payment</TabsTrigger>
          <TabsTrigger value="all-bills">All Bills History</TabsTrigger>
        </TabsList>
        <TabsContent value="pending-approval">
          <BillsTable bills={pendingApprovalBills} users={users} title="Bills Awaiting Your Approval" />
        </TabsContent>
        <TabsContent value="pending-payment">
          <BillsTable bills={pendingPaymentBills} users={users} title="Bills Approved for Payment" />
        </TabsContent>
        <TabsContent value="all-bills">
          <BillsTable bills={allBills} users={users} title="Complete Bill History" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
