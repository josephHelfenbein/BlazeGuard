import EmergencyRAG from "@/components/EmergencyRAG";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function EmergencyPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  return (
    <div className="container mx-auto py-8">
      <EmergencyRAG />
    </div>
  );
}
