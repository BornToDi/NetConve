import { getSession } from "@/lib/actions";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BillForm } from "@/components/bills/bill-form";

export default async function NewBillPage() {
  const session = await getSession();
  if (!session || !["employee", "supervisor"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto max-w-5xl">
        <Card>
            <CardHeader>
                <CardTitle>Create New Conveyance Bill</CardTitle>
                <CardDescription>Fill out the details for your bill. You can add multiple items.</CardDescription>
            </CardHeader>
            <CardContent>
                <BillForm user={session.user} />
            </CardContent>
        </Card>
    </div>
  );
}
