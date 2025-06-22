// app/login/page.tsx
"use client"; // هذا السطر ضروري جداً لأننا نستخدم React Hooks و useRouter

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log('LoginPage: Session found, redirecting to /');
        router.push('/');
      } else {
        console.log('LoginPage: No session found.');
      }
    };
    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('LoginPage: Auth state changed:', event, 'Session:', session);
        if (event === 'SIGNED_IN' && session) {
          console.log('LoginPage: User signed in, redirecting to /');
          router.push('/');
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router, supabase.auth]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100 p-4"> {/* Light, vibrant background */}
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-200"> {/* Brighter, rounded card */}
        <h2 className="text-3xl font-extrabold mb-8 text-center text-gray-800">
          أهلاً بك من جديد!
        </h2>
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa, // Using Supa theme
            variables: {
              default: {
                colors: {
                  brand: '#6366F1', // Indigo 500 (vibrant blue)
                  brandAccent: '#8B5CF6', // Violet 500 (vibrant purple)
                  inputBackground: '#F9FAFB', // Light gray for inputs
                  inputBorder: '#E5E7EB', // Lighter border
                  inputFocusBorder: '#6366F1', // Focus color
                  inputText: '#374151', // Dark gray text
                  buttonBackground: '#6366F1',
                  buttonBackgroundHover: '#4F46E5',
                  buttonBorder: '#6366F1',
                  buttonText: '#FFFFFF',
                },
              },
            },
          }}
          theme="light" // Explicitly setting light theme
          providers={['google', 'github']}
          redirectTo={`${process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3000'}/auth/callback`}
        />
      </div>
    </div>
  );
}