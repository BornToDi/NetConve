export type Role = "employee" | "supervisor" | "accounts" | "management";

export type BillStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED_BY_SUPERVISOR"
  | "APPROVED_BY_ACCOUNTS"
  | "APPROVED_BY_MANAGEMENT"
  | "REJECTED_BY_SUPERVISOR"
  | "REJECTED_BY_ACCOUNTS"
  | "REJECTED_BY_MANAGEMENT"
  | "PAID";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  supervisorId?: string;
  designation?: string;
}

export interface BillItem {
  id: string;
  date: string;
  from: string;
  to: string;
  transport: string;
  purpose: string;
  amount: number;
}

export interface Bill {
  id:string;
  companyName: string;
  companyAddress: string;
  employeeId: string;
  amount: number; // This is the total amount
  amountInWords: string;
  items: BillItem[];
  status: BillStatus;
  createdAt: string;
  updatedAt: string;
  history: {
    status: BillStatus;
    timestamp: string;
    actorId: string;
    comment?: string;
  }[];
}
