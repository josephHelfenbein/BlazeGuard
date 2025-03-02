// import DeployButton from '@/components/deploy-button';
import { EnvVarWarning } from '@/components/env-var-warning';
import HeaderAuth from '@/components/header-auth';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { hasEnvVars } from '@/utils/supabase/check-env-vars';
import { Geist } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import Link from 'next/link';
import './globals.css';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Toaster } from 'react-hot-toast';

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000';

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: 'Next.js and Supabase Starter Kit',
  description: 'The fastest way to build apps with Next.js and Supabase',
};

const geistSans = Geist({
  display: 'swap',
  subsets: ['latin'],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' className={geistSans.className} suppressHydrationWarning>
      <body className='bg-background text-foreground'>
        <Toaster position='top-center' />
        <ThemeProvider
          attribute='class'
          defaultTheme='system'
          enableSystem
          disableTransitionOnChange
        >
          <SidebarProvider>
            <div className='relative w-full flex min-h-screen'>
              {/* Sidebar */}
              <AppSidebar />

              {/* Main content wrapper */}
              <div className='flex w-full flex-col'>
                {/* Header */}
                <header className='sticky top-0 z-40 w-full border-b border-b-foreground/10 bg-background'>
                  <div className='flex h-16 items-center px-4'>
                    <div className='flex items-center gap-2'>
                      <SidebarTrigger />
                      <Link href={'/'} className='font-semibold'>
                        ResponseAI
                      </Link>
                    </div>
                    <div className='ml-auto flex items-center'>
                      {!hasEnvVars ? <EnvVarWarning /> : <HeaderAuth />}
                    </div>
                  </div>
                </header>

                {/* Main content */}
                <main className='flex-1 overflow-auto p-4 md:p-6'>
                  {children}
                </main>

                {/* Footer */}
                <footer className='border-t py-4 text-center text-xs'>
                  <div className='flex justify-center'>
                    <ThemeSwitcher />
                  </div>
                </footer>
              </div>
            </div>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
