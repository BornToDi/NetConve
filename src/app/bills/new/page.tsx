import { getSession } from "@/lib/actions";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BillForm } from "@/components/bills/bill-form";

export default async function NewBillPage() {
  const session = await getSession();
  if (!session || session.user.role !== "employee") {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto max-w-2xl">
        <Card>
            <CardHeader>
                <CardTitle>Create New Bill</CardTitle>
                <CardDescription>Fill out the details for your conveyance bill.</CardDescription>
            </CardHeader>
            <CardContent>
                <BillForm />
            </CardContent>
        </Card>
    </div>
  );
}
