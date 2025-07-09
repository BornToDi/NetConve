"use client";

import { useState, useMemo } from "react";
import type { Bill, User } from "@/lib/types";
import { BillsTable } from "../bills/bills-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExportButton } from "../export/export-button";
import { Input } from "@/components/ui/input";

interface AccountsDashboardProps {
  user: User;
  bills: Bill[];
  users: User[];
}

export function AccountsDashboard({ user, bills, users }: AccountsDashboardProps) {
  const [paidSearchTerm, setPaidSearchTerm] = useState("");
  const userMap = useMemo(() => new Map(users.map((user) => [user.id, user.name])), [users]);

  const pendingApprovalBills = bills.filter(
    (bill) => bill.status === "APPROVED_BY_SUPERVISOR"
  );
  
  const pendingPaymentBills = bills.filter(
      (bill) => bill.status === "APPROVED_BY_MANAGEMENT"
  )

  const allPaidBills = bills.filter((bill) => bill.status === "PAID");

  const filteredPaidBills = useMemo(() => {
      if (!paidSearchTerm) return allPaidBills;
      return allPaidBills.filter(bill => {
          const employeeName = userMap.get(bill.employeeId) || "";
          return employeeName.toLowerCase().includes(paidSearchTerm.toLowerCase());
      });
  }, [allPaidBills, paidSearchTerm, userMap]);

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
        <TabsContent value="paid" className="space-y-4">
            <div className="flex justify-between items-center">
                 <h2 className="text-2xl font-semibold">Paid Bills</h2>
                 <div className="flex gap-4 items-center">
                    <Input 
                        placeholder="Search by employee name..."
                        value={paidSearchTerm}
                        onChange={(e) => setPaidSearchTerm(e.target.value)}
                        className="max-w-sm"
                    />
                    <ExportButton bills={filteredPaidBills} users={users} fileName="Paid_Bills" />
                 </div>
            </div>
            <BillsTable
                bills={filteredPaidBills}
                users={users}
                title=""
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
