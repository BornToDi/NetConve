import { notFound, redirect } from "next/navigation";
import { getBillById, findUserById } from "@/lib/data";
import { getSession, handleBillAction, receiveMoney } from "@/lib/actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/bills/status-badge";
import { FileText } from "lucide-react";
import type { Bill } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { ClientDate } from "@/components/client-date";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";


async function getHistoryWithUserNames(bill: Bill) {
    const historyWithUsers = await Promise.all(
        bill.history.map(async (event) => {
            const user = await findUserById(event.actorId);
            return { ...event, actorName: user?.name || "System" };
        })
    );
    return historyWithUsers;
}

export default async function BillDetailsPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) {
    // This case should be handled by the layout, but as a safeguard:
    redirect('/');
  }
  const user = session.user;
  const bill = await getBillById(params.id);

  if (!bill) {
    notFound();
  }

  const employee = await findUserById(bill.employeeId);
  const history = await getHistoryWithUserNames(bill);

  const canTakeAction = () => {
      if (user.id === bill.employeeId && bill.status.startsWith('REJECTED')) return true; // Can resubmit
      
      switch(user.role) {
          case 'supervisor': return bill.status === 'SUBMITTED';
          case 'accounts': return bill.status === 'APPROVED_BY_SUPERVISOR' || bill.status === 'APPROVED_BY_MANAGEMENT';
          case 'management': return bill.status === 'APPROVED_BY_ACCOUNTS';
          default: return false;
      }
  };

  const isResubmittable = user.id === bill.employeeId && bill.status.startsWith('REJECTED');
  const isPayableByAccounts = user.role === 'accounts' && bill.status === 'APPROVED_BY_MANAGEMENT';
  const isReceivableByEmployee = user.id === bill.employeeId && bill.status === 'PAID';

  const ActionForm = ({ actionType }: { actionType: 'approve' | 'reject' }) => (
    <form action={async (formData) => {
        'use server'
        const comment = formData.get('comment') as string | undefined;
        await handleBillAction(bill.id, actionType, comment);
        revalidatePath(`/bills/${bill.id}`);
    }} className="space-y-2">
        {actionType === 'reject' && (
            <Textarea name="comment" placeholder="Provide a reason for rejection (required)..." required />
        )}
        <Button 
            type="submit" 
            className="w-full"
            variant={actionType === 'reject' ? 'destructive' : 'default'}
            style={actionType === 'approve' ? { backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))'} : {}}
        >
            {actionType === 'approve' ? 'Approve Bill' : 'Reject Bill'}
        </Button>
    </form>
  )

  return (
    <div className="container mx-auto max-w-4xl space-y-6">
        <div className="flex items-start justify-between">
            <div>
                 <h1 className="text-3xl font-bold">Conveyance Bill</h1>
                 <p className="text-muted-foreground">
                    Bill ID: {bill.id}
                 </p>
            </div>
            <StatusBadge status={bill.status} />
        </div>
        <Separator />
      
        <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
                 <Card>
                    <CardHeader>
                       <CardTitle>Bill Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="font-semibold">Submitted By:</p>
                                <p>{employee?.name}</p>
                                <p className="text-sm text-muted-foreground">{employee?.designation}</p>
                            </div>
                            <div>
                                <p className="font-semibold">Submission Date:</p>
                                <p><ClientDate dateString={bill.createdAt} format="date" /></p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader>
                        <CardTitle>Bill Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>From</TableHead>
                                    <TableHead>To</TableHead>
                                    <TableHead>Purpose</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {bill.items.map((item, index) => (
                                    <TableRow key={item.id}>
                                        <TableCell><ClientDate dateString={item.date} format="date" /></TableCell>
                                        <TableCell>{item.from}</TableCell>
                                        <TableCell>{item.to}</TableCell>
                                        <TableCell>{item.purpose}</TableCell>
                                        <TableCell className="text-right font-medium">
                                            {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(item.amount)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                         </Table>
                         <div className="mt-4 flex justify-end border-t pt-4">
                            <div className="text-right">
                                <p className="text-muted-foreground">Total Amount</p>
                                <p className="text-2xl font-bold">
                                    {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(bill.amount)}
                                </p>
                            </div>
                         </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Approval History</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <div className="space-y-4">
                            {history.map((event, index) => (
                                <div key={index} className="flex gap-4">
                                    <div className="flex flex-col items-center">
                                       <div className={`flex h-10 w-10 items-center justify-center rounded-full ${event.status.includes('REJECTED') ? 'bg-destructive' : 'bg-primary'}`}>
                                            <FileText className="h-5 w-5 text-primary-foreground" />
                                        </div>
                                        {index < history.length - 1 && <div className="w-px flex-1 bg-border" />}
                                    </div>
                                    <div className="pb-4">
                                        <p className="font-semibold">{event.status.replace(/_/g, ' ')}</p>
                                        <p className="text-sm text-muted-foreground">
                                            By {event.actorName} on <ClientDate dateString={event.timestamp} format="locale" />
                                        </p>
                                        {event.comment && (
                                             <p className="mt-1 text-sm italic text-destructive">"{event.comment}"</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         {isResubmittable && (
                            <Button asChild className="w-full">
                                <a href="/bills/new">Resubmit Bill</a>
                            </Button>
                        )}
                        {canTakeAction() && !isResubmittable && (
                            <>
                                <ActionForm actionType="approve" />
                                <ActionForm actionType="reject" />
                            </>
                        )}
                        {isPayableByAccounts && (
                             <form action={async () => { 'use server'; await handleBillAction(bill.id, 'approve'); }}>
                                <Button type="submit" className="w-full">Mark as Paid</Button>
                            </form>
                        )}
                        {isReceivableByEmployee && (
                            <form action={async () => { 'use server'; await receiveMoney(bill.id); }}>
                                <Button type="submit" className="w-full">Confirm Money Received</Button>
                            </form>
                        )}
                         {bill.status === 'PAID' && user.role !== 'employee' && <p className="text-center font-medium text-green-600">This bill has been paid.</p>}
                        {!canTakeAction() && !isPayableByAccounts && !isReceivableByEmployee && !isResubmittable && (
                             <p className="text-center text-sm text-muted-foreground">No actions available for you at this stage.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}
