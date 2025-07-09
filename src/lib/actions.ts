"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { findUserByEmail, createUser, createBill, getBillById, updateBillStatus, findUserById } from "./data";
import type { Role, BillStatus } from "./types";
import { revalidatePath } from "next/cache";

const SESSION_COOKIE_NAME = "office-flow-session";

export async function login(prevState: { error: string } | undefined, formData: FormData) {
  const email = formData.get("email") as string;
  // In a real app, you'd also check the password
  // const password = formData.get("password") as string;

  const user = await findUserByEmail(email);

  if (!user) {
    return { error: "Invalid email or password." };
  }

  cookies().set(SESSION_COOKIE_NAME, user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // One week
    path: "/",
  });

  redirect("/dashboard");
}

export async function logout() {
  cookies().delete(SESSION_COOKIE_NAME);
  redirect("/");
}

export async function register(prevState: { error: string } | undefined, formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string; // In a real app, you'd hash this
  const role = formData.get("role") as Role;
  const supervisorId = formData.get("supervisorId") as string | undefined;

  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    return { error: "A user with this email already exists." };
  }
  
  if (role === 'employee' && !supervisorId) {
      return { error: "An employee must select a supervisor." }
  }

  const user = await createUser({
    name,
    email,
    role,
    supervisorId: role === 'employee' ? supervisorId : undefined,
  });
  
  cookies().set(SESSION_COOKIE_NAME, user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  redirect("/dashboard");
}

export async function getSession() {
  const userId = cookies().get(SESSION_COOKIE_NAME)?.value;
  if (!userId) return null;
  
  const user = await findUserById(userId);
  if (!user) return null;

  return { user };
}

export async function submitBill(prevState: { error?: string; success?: boolean; } | undefined, formData: FormData) {
    const session = await getSession();
    if (!session || !['employee', 'supervisor'].includes(session.user.role)) {
        return { error: 'Unauthorized' };
    }

    const companyName = formData.get('companyName') as string;
    const companyAddress = formData.get('companyAddress') as string;
    const employeeId = formData.get('employeeId') as string;
    const amountInWords = formData.get('amountInWords') as string;
    const itemsJSON = formData.get('items') as string;
    const totalAmount = formData.get('totalAmount') as string;

    if (!companyName || !itemsJSON || !totalAmount || !companyAddress || !amountInWords || !employeeId) {
        return { error: 'All fields are required.' };
    }
    
    try {
        const items = JSON.parse(itemsJSON);
        if (!Array.isArray(items) || items.length === 0) {
            return { error: 'At least one bill item is required.' };
        }
        
        await createBill({
            employeeId: employeeId,
            companyName,
            companyAddress,
            amountInWords,
            items: items,
            amount: parseFloat(totalAmount),
        }, session.user.role);
        
    } catch (e) {
        return { error: "Failed to submit bill. Please check the item details." };
    }

    revalidatePath('/dashboard');
    revalidatePath('/bills');
    return { success: true };
}

export async function handleBillAction(billId: string, action: 'approve' | 'reject', comment?: string) {
    const session = await getSession();
    if (!session) throw new Error('Not authenticated');

    const bill = await getBillById(billId);
    if (!bill) throw new Error('Bill not found');

    const { user } = session;
    let nextStatus: BillStatus | null = null;

    switch (user.role) {
        case 'supervisor':
            if (bill.status === 'SUBMITTED') {
                nextStatus = action === 'approve' ? 'APPROVED_BY_SUPERVISOR' : 'REJECTED_BY_SUPERVISOR';
            }
            break;
        case 'accounts':
            if (bill.status === 'APPROVED_BY_SUPERVISOR') {
                 nextStatus = action === 'approve' ? 'APPROVED_BY_ACCOUNTS' : 'REJECTED_BY_ACCOUNTS';
            } else if (bill.status === 'APPROVED_BY_MANAGEMENT') {
                 nextStatus = action === 'approve' ? 'PAID' : null; // Can't reject after management approval
            }
            break;
        case 'management':
            if (bill.status === 'APPROVED_BY_ACCOUNTS') {
                nextStatus = action === 'approve' ? 'APPROVED_BY_MANAGEMENT' : 'REJECTED_BY_MANAGEMENT';
            }
            break;
        case 'employee':
             if (action === 'approve' && bill.status === 'APPROVED_BY_MANAGEMENT') { // This is for "Receive Money" button
                nextStatus = 'PAID';
             }
             break;
    }

    if (nextStatus) {
        await updateBillStatus(billId, nextStatus, user.id, comment);
    } else {
        throw new Error('Invalid action for your role or bill status.');
    }
    
    revalidatePath(`/bills/${billId}`);
}

export async function receiveMoney(billId: string) {
    const session = await getSession();
    if (!session || session.user.role !== 'employee') {
        throw new Error('Unauthorized');
    }
    await updateBillStatus(billId, 'PAID', session.user.id, 'Payment confirmed by employee.');
    revalidatePath(`/bills/${billId}`);
}
