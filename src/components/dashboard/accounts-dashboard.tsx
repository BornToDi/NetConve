import type { Bill, User } from "@/lib/types";
import { BillsTable } from "../bills/bills-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExportButton } from "../export/export-button";

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

  const paidBills = bills.filter((bill) => bill.status === "PAID");

  const allBills = bills;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Accounts Department</h1>
      <Tabs defaultValue="pending-approval">
        <TabsList>
          <TabsTrigger value="pending-approval">Pending Approval</TabsTrigger>
          <TabsTrigger value="pending-payment">Pending Payment</TabsTrigger>
          <TabsTrigger value="paid">Paid</TabsTrigger>
          <TabsTrigger value="all-bills">All Bills History</TabsTrigger>
        </TabsList>
        <TabsContent value="pending-approval">
          <BillsTable
            bills={pendingApprovalBills}
            users={users}
            title="Bills Awaiting Your Approval"
            action={<ExportButton bills={pendingApprovalBills} users={users} fileName="Pending_Approval_Bills" />}
          />
        </TabsContent>
        <TabsContent value="pending-payment">
          <BillsTable
            bills={pendingPaymentBills}
            users={users}
            title="Bills Approved for Payment"
            action={<ExportButton bills={pendingPaymentBills} users={users} fileName="Pending_Payment_Bills" />}
          />
        </TabsContent>
        <TabsContent value="paid">
            <BillsTable
                bills={paidBills}
                users={users}
                title="Paid Bills"
                action={<ExportButton bills={paidBills} users={users} fileName="Paid_Bills" />}
            />
        </TabsContent>
        <TabsContent value="all-bills">
          <BillsTable
            bills={allBills}
            users={users}
            title="Complete Bill History"
            action={<ExportButton bills={allBills} users={users} fileName="All_Bills_History" />}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
