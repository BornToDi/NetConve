"use client";

import { useActionState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn, numberToWords } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, PlusCircle, Trash2 } from "lucide-react";

import { submitBill } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Form, FormControl, FormField, FormItem, FormMessage, FormLabel } from "../ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Separator } from "../ui/separator";
import type { User } from "@/lib/types";


const billItemSchema = z.object({
  date: z.date({ required_error: "A date is required." }),
  from: z.string().min(1, "From location is required."),
  to: z.string().min(1, "To location is required."),
  transport: z.string().min(1, "Transport mode is required."),
  purpose: z.string().min(1, "Purpose is required."),
  amount: z.coerce.number().min(0.01, "Amount must be > 0."),
});

const billFormSchema = z.object({
  companyName: z.string().min(1, "Company name is required."),
  companyAddress: z.string().min(1, "Company address is required."),
  employeeId: z.string().min(1, "Employee ID is required."),
  employeeName: z.string().min(1, "Employee name is required."),
  employeeDesignation: z.string().min(1, "Designation is required."),
  items: z.array(billItemSchema).min(1, "At least one bill item is required."),
});

type BillFormValues = z.infer<typeof billFormSchema>;

function SubmitButton({ isPending }: { isPending: boolean }) {
  return (
    <Button type="submit" className="w-full bg-accent hover:bg-accent/90" disabled={isPending}>
      {isPending ? "Submitting..." : "Submit Bill"}
    </Button>
  );
}

export function BillForm({ user }: { user: User }) {
  const [state, action] = useActionState(submitBill, undefined);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<BillFormValues>({
    resolver: zodResolver(billFormSchema),
    defaultValues: {
      companyName: "Networld Bangladesh Limited",
      companyAddress: "57 & 57/A, Uday Tower, (4th Floor) Gulshan 1, Gulshan Avenue, 1212 Dhaka",
      employeeId: user.id,
      employeeName: user.name,
      employeeDesignation: user.designation || "",
      items: [{ date: new Date(), from: "", to: "", transport: "", purpose: "", amount: 0 }],
    },
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });
  
  const watchedItems = form.watch("items");
  const totalAmount = watchedItems.reduce((acc, current) => acc + (Number(current.amount) || 0), 0);
  const amountInWords = numberToWords(totalAmount) + " Only";
  
  useEffect(() => {
    if (state?.success) {
      router.push('/bills');
    }
  }, [state, router]);

  const onSubmit = (data: BillFormValues) => {
    startTransition(() => {
        const formData = new FormData();
        const itemsForServer = data.items.map(item => ({
          ...item,
          date: item.date.toISOString(),
          id: crypto.randomUUID(),
        }));

        formData.append("companyName", data.companyName);
        formData.append("companyAddress", data.companyAddress);
        formData.append("employeeId", data.employeeId);
        formData.append("employeeName", data.employeeName);
        formData.append("employeeDesignation", data.employeeDesignation);
        formData.append("items", JSON.stringify(itemsForServer));
        formData.append("totalAmount", totalAmount.toString());
        formData.append("amountInWords", amountInWords);
        
        action(formData);
    });
  };
  

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl><Input placeholder="e.g. Acme Corporation" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="companyAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Address</FormLabel>
                  <FormControl><Input placeholder="e.g. 123 Main St, City" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="employeeName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employee Name</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="employeeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employee ID</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="employeeDesignation"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Designation</FormLabel>
                  <FormControl><Input placeholder="e.g. Software Engineer" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>
        
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">No.</TableHead>
                <TableHead className="w-[150px]">Date</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Transport</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead className="w-[120px] text-right">Amount</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.map((field, index) => (
                <TableRow key={field.id} className="align-top">
                  <TableCell className="p-1 pt-3 font-medium">{index + 1}</TableCell>
                  <TableCell className="p-1">
                    <FormField
                      control={form.control}
                      name={`items.${index}.date`}
                      render={({ field }) => (
                        <FormItem>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full justify-start pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date > new Date() || date < new Date("1900-01-01")
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  <TableCell className="p-1">
                     <FormField
                        control={form.control}
                        name={`items.${index}.from`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl><Input placeholder="e.g. Office" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                  </TableCell>
                  <TableCell className="p-1">
                      <FormField
                        control={form.control}
                        name={`items.${index}.to`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl><Input placeholder="e.g. Client Office" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                  </TableCell>
                  <TableCell className="p-1">
                     <FormField
                        control={form.control}
                        name={`items.${index}.transport`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl><Input placeholder="e.g. Pathao, CNG" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                  </TableCell>
                  <TableCell className="p-1">
                     <FormField
                        control={form.control}
                        name={`items.${index}.purpose`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl><Input placeholder="e.g. Meeting" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                  </TableCell>
                  <TableCell className="p-1">
                     <FormField
                        control={form.control}
                        name={`items.${index}.amount`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl><Input type="number" step="0.01" placeholder="0.00" className="text-right" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                  </TableCell>
                   <TableCell className="p-1 pt-3 text-right">
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => append({ date: new Date(), from: "", to: "", transport: "", purpose: "", amount: 0 })}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Item
        </Button>
        
        <Separator />
        
        <div className="flex justify-between items-start">
            <div>
                 <p className="font-medium">Amount in Words:</p>
                 <p className="text-muted-foreground">{amountInWords}</p>
            </div>
            <div className="w-full max-w-xs space-y-2">
                 <div className="flex justify-between items-center text-xl font-bold">
                    <span>Total</span>
                    <span>
                        {new Intl.NumberFormat("en-IN", { style: "currency", currency: "BDT" }).format(totalAmount)}
                    </span>
                </div>
            </div>
        </div>
        
        <Separator />

        <div className="mt-6 space-y-4">
            {state?.error && (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{state.error}</AlertDescription>
            </Alert>
            )}
           <SubmitButton isPending={isPending} />
        </div>
      </form>
    </FormProvider>
  );
}
