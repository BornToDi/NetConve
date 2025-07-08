import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { BillsTable } from "../bills/bills-table";
import type { Bill, User } from "@/lib/types";

interface EmployeeDashboardProps {
  user: User;
  bills: Bill[];
}

export function EmployeeDashboard({ user, bills }: EmployeeDashboardProps) {
  const myBills = bills.filter((bill) => bill.employeeId === user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Conveyance Bills</h1>
        <Button asChild className="bg-accent hover:bg-accent/90">
          <Link href="/bills/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Bill
          </Link>
        </Button>
      </div>
      <BillsTable bills={myBills} users={[user]} title="My Submissions"/>
    </div>
  );
}
