"use client";

import { useActionState } from "react";
import { useForm, useFieldArray, FormProvider, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
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
import { Form, FormControl, FormField, FormItem, FormMessage } from "../ui/form";


const billItemSchema = z.object({
  date: z.date({ required_error: "A date is required." }),
  from: z.string().min(1, "From location is required."),
  to: z.string().min(1, "To location is required."),
  transport: z.string().min(1, "Transport mode is required."),
  purpose: z.string().min(1, "Purpose is required."),
  amount: z.coerce.number().min(0.01, "Amount must be > 0."),
});

const billFormSchema = z.object({
  items: z.array(billItemSchema).min(1, "At least one bill item is required."),
});

type BillFormValues = z.infer<typeof billFormSchema>;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full bg-accent hover:bg-accent/90" disabled={pending}>
      {pending ? "Submitting..." : "Submit Bill"}
    </Button>
  );
}

export function BillForm() {
  const [state, action] = useActionState(submitBill, undefined);

  const form = useForm<BillFormValues>({
    resolver: zodResolver(billFormSchema),
    defaultValues: {
      items: [{ date: new Date(), from: "", to: "", transport: "", purpose: "", amount: 0 }],
    },
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });
  
  const watchedItems = form.watch("items");
  const totalAmount = watchedItems.reduce((acc, current) => acc + (current.amount || 0), 0);

  const onSubmit = (data: BillFormValues) => {
    const formData = new FormData();
    const itemsForServer = data.items.map(item => ({
      ...item,
      date: item.date.toISOString(),
      id: crypto.randomUUID(),
    }));

    formData.append("items", JSON.stringify(itemsForServer));
    formData.append("totalAmount", totalAmount.toString());
    action(formData);
  };
  

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 border p-4 rounded-lg relative">
              <div className="md:col-span-12 font-medium text-primary">Item #{index + 1}</div>
              
              <FormField
                control={form.control}
                name={`items.${index}.date`}
                render={({ field }) => (
                  <FormItem className="md:col-span-4">
                    <Label>Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
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
              
              <FormField
                control={form.control}
                name={`items.${index}.from`}
                render={({ field }) => (
                  <FormItem className="md:col-span-4">
                    <Label>From</Label>
                    <FormControl><Input placeholder="e.g. Office" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`items.${index}.to`}
                render={({ field }) => (
                  <FormItem className="md:col-span-4">
                    <Label>To</Label>
                    <FormControl><Input placeholder="e.g. Client Office" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name={`items.${index}.transport`}
                render={({ field }) => (
                  <FormItem className="md:col-span-4">
                    <Label>Transport</Label>
                    <FormControl><Input placeholder="e.g. Pathao, CNG" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`items.${index}.purpose`}
                render={({ field }) => (
                  <FormItem className="md:col-span-4">
                    <Label>Purpose</Label>
                    <FormControl><Input placeholder="e.g. Meeting" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

               <FormField
                control={form.control}
                name={`items.${index}.amount`}
                render={({ field }) => (
                  <FormItem className="md:col-span-4">
                    <Label>Amount</Label>
                    <FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="md:col-span-12 flex justify-end">
                 {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => append({ date: new Date(), from: "", to: "", transport: "", purpose: "", amount: 0 })}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Item
        </Button>
        
        <div className="mt-6 border-t pt-4 space-y-4">
            <div className="flex justify-between items-center text-xl font-bold">
                <span>Total Amount:</span>
                <span>
                     {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(totalAmount)}
                </span>
            </div>

            {state?.error && (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{state.error}</AlertDescription>
            </Alert>
            )}

           <SubmitButton />
        </div>
      </form>
    </FormProvider>
  );
}
