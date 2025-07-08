
import type { User, Bill, Role } from "./types";

// This is a hack to preserve data across Next.js hot reloads in development.
// In a real app, you'd use a database.
declare global {
  // eslint-disable-next-line no-var
  var __users: User[] | undefined;
  // eslint-disable-next-line no-var
  var __bills: Bill[] | undefined;
}

const initialUsers: User[] = [
  { id: "user-1", name: "Alice Employee", email: "alice@example.com", role: "employee", supervisorId: "user-2" },
  { id: "user-2", name: "Bob Supervisor", email: "bob@example.com", role: "supervisor" },
  { id: "user-3", name: "Charlie Accounts", email: "charlie@example.com", role: "accounts" },
  { id: "user-4", name: "Diana Management", email: "diana@example.com", role: "management" },
  { id: "user-5", name: "Eve Employee", email: "eve@example.com", role: "employee", supervisorId: "user-2" },
];

const initialBills: Bill[] = [
  {
    id: "bill-1",
    employeeId: "user-1",
    title: "Client meeting travel",
    amount: 150.75,
    status: "SUBMITTED",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    history: [
      { status: "SUBMITTED", timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), actorId: "user-1" }
    ]
  },
  {
    id: "bill-2",
    employeeId: "user-5",
    title: "Office supplies purchase",
    amount: 85.00,
    status: "APPROVED_BY_SUPERVISOR",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    history: [
        { status: "SUBMITTED", timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), actorId: "user-5" },
        { status: "APPROVED_BY_SUPERVISOR", timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), actorId: "user-2" }
    ]
  },
  {
    id: "bill-3",
    employeeId: "user-1",
    title: "Team lunch",
    amount: 220.50,
    status: "REJECTED_BY_SUPERVISOR",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    history: [
        { status: "SUBMITTED", timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), actorId: "user-1" },
        { status: "REJECTED_BY_SUPERVISOR", timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), actorId: "user-2", comment: "Please provide an itemized receipt." }
    ]
  },
];

let users: User[];
let bills: Bill[];

// Initialize mock data on the global object if it doesn't exist.
if (process.env.NODE_ENV === "production") {
  users = initialUsers;
  bills = initialBills;
} else {
  if (!global.__users) {
    global.__users = initialUsers;
  }
  if (!global.__bills) {
    global.__bills = initialBills;
  }
  users = global.__users;
  bills = global.__bills;
}


// Mock API functions
export const findUserByEmail = async (email: string): Promise<User | undefined> => {
  return users.find((user) => user.email === email);
};

export const findUserById = async (id: string): Promise<User | undefined> => {
    return users.find((user) => user.id === id);
};

export const getUsers = async (role?: Role): Promise<User[]> => {
    if (role) {
        return users.filter(user => user.role === role);
    }
    return users;
};

export const createUser = async (userData: Omit<User, 'id'>): Promise<User> => {
    const newUser: User = { id: `user-${Date.now()}`, ...userData };
    users.push(newUser);
    return newUser;
};

export const getBills = async (): Promise<Bill[]> => {
    return bills;
};

export const getBillById = async (id: string): Promise<Bill | undefined> => {
    return bills.find(bill => bill.id === id);
}

export const createBill = async (billData: Omit<Bill, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'history'>): Promise<Bill> => {
    const newBill: Bill = {
        id: `bill-${Date.now()}`,
        ...billData,
        status: 'SUBMITTED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        history: [{ status: 'SUBMITTED', timestamp: new Date().toISOString(), actorId: billData.employeeId }]
    };
    bills.push(newBill);
    return newBill;
}

export const updateBillStatus = async (billId: string, newStatus: Bill['status'], actorId: string, comment?: string): Promise<Bill | undefined> => {
    const billIndex = bills.findIndex(b => b.id === billId);
    if (billIndex === -1) return undefined;

    const updatedBill: Bill = {
        ...bills[billIndex],
        status: newStatus,
        updatedAt: new Date().toISOString(),
        history: [
            ...bills[billIndex].history,
            { status: newStatus, timestamp: new Date().toISOString(), actorId, comment }
        ]
    };
    bills[billIndex] = updatedBill;
    return updatedBill;
}
