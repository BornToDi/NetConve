import { getSession } from "@/lib/actions";
import { getBills, getUsers } from "@/lib/data";
import { redirect } from "next/navigation";
import type { User } from "@/lib/types";
import { BillsView } from "@/components/bills/bills-view";

export default async function BillsPage() {
    const session = await getSession();
    if (!session) {
        redirect('/');
    }
    const user = session.user as User;
    const allBills = await getBills();
    const allUsers = await getUsers();

    let billsToShow = allBills;
    let title = "All Bills";

    // Filter bills based on user role
    if (user.role === 'employee') {
        billsToShow = allBills.filter(bill => bill.employeeId === user.id);
        title = "My Bills";
    } else if (user.role === 'supervisor') {
        const teamMemberIds = allUsers
            .filter(u => u.supervisorId === user.id)
            .map(u => u.id);
        // Include bills from team members and the supervisor themselves
        billsToShow = allBills.filter(bill => teamMemberIds.includes(bill.employeeId) || bill.employeeId === user.id);
        title = "My Team's & My Bills";
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">{title}</h1>
            <BillsView 
                initialBills={billsToShow} 
                users={allUsers} 
                isSupervisor={user.role === 'supervisor'} 
            />
        </div>
    );
}
