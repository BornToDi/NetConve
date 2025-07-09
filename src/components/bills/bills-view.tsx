"use client";

import { useState, useMemo } from "react";
import type { Bill, User } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { BillsTable } from "./bills-table";

interface BillsViewProps {
  initialBills: Bill[];
  users: User[];
  isSupervisor: boolean;
}

export function BillsView({ initialBills, users, isSupervisor }: BillsViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const userMap = useMemo(() => new Map(users.map((user) => [user.id, user.name])), [users]);

  const filteredBills = useMemo(() => {
    if (!searchTerm || !isSupervisor) {
      return initialBills;
    }
    return initialBills.filter((bill) => {
      const employeeName = userMap.get(bill.employeeId) || "";
      return employeeName.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [initialBills, searchTerm, userMap, isSupervisor]);

  const searchBar = isSupervisor ? (
    <Input
      placeholder="Search by employee name..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="max-w-sm"
    />
  ) : null;

  return (
    <BillsTable
      bills={filteredBills}
      users={users}
      title="Bill History"
      action={searchBar}
    />
  );
}
