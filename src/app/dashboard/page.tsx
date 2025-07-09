import { getSession } from "@/lib/actions";
import { redirect } from "next/navigation";
import { EmployeeDashboard } from "@/components/dashboard/employee-dashboard";
import { SupervisorDashboard } from "@/components/dashboard/supervisor-dashboard";
import { AccountsDashboard } from "@/components/dashboard/accounts-dashboard";
import { ManagementDashboard } from "@/components/dashboard/management-dashboard";
import { getBills, getUsers } from "@/lib/data";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect("/");
  }
  const user = session.user;
  
  const allBills = await getBills();
  const allUsers = await getUsers();

  const getDashboardForRole = () => {
    switch (user.role) {
      case "employee":
        return <EmployeeDashboard user={user} bills={allBills} users={allUsers} />;
      case "supervisor":
        return <SupervisorDashboard user={user} bills={allBills} users={allUsers} />;
      case "accounts":
        return <AccountsDashboard user={user} bills={allBills} users={allUsers}/>;
      case "management":
        return <ManagementDashboard user={user} bills={allBills} users={allUsers}/>;
      default:
        return <div>Invalid role</div>;
    }
  };

  return (
    <div className="container mx-auto">
      {getDashboardForRole()}
    </div>
  );
}
