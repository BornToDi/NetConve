import { RegistrationForm } from "@/components/auth/registration-form";
import { Logo } from "@/components/logo";
import { getUsers } from "@/lib/data";
import Link from "next/link";

export default async function RegisterPage() {
  const supervisors = await getUsers("supervisor");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <RegistrationForm supervisors={supervisors} />
         <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
