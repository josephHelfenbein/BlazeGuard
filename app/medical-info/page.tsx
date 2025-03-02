import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import MedicalInfoForm from "./form";
import { Toaster } from "@/components/ui/toaster";

export default async function MedicalInfoPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Medical Information</h1>
        <p className="text-muted-foreground mb-6">
          Please provide your medical information below. This information will
          be used in case of emergency.
        </p>
        <MedicalInfoForm />
        <Toaster />
      </div>
    </div>
  );
}
