import { createClient } from '@/utils/supabase/server';
import { InfoIcon } from 'lucide-react';
import { redirect } from 'next/navigation';

export default async function ProtectedPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/sign-in');
  }

  return (
    <div className='flex-1 w-full flex flex-col gap-12'>
      <div className='w-full'>
        <h1>Protected Page</h1>
      </div>
    </div>
  );
}
