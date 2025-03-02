'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { toast } from 'react-hot-toast';

export default function SettingsPage() {
  return (
    <div className='container py-10'>
      <h1 className='text-3xl font-bold mb-8'>Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Start Wild Fire</CardTitle>
          <CardDescription>
            Initiate a controlled wild fire in your designated area. Use with
            caution.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant='destructive'
            onClick={() => toast.success('🔥 Wild fire initiated!')}
          >
            Start Fire
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
