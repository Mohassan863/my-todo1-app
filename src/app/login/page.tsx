// app/login/page.tsx
"use client";

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-200">
        <h2 className="text-3xl font-extrabold mb-8 text-center text-gray-800">
          أهلاً بك من جديد!
        </h2>
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#6366F1',
                  brandAccent: '#8B5CF6',
                  inputBackground: '#F9FAFB',
                  inputBorder: '#E5E7EB',
                  inputText: '#374151',
                },
                // هنا يمكن أن تكون خصائص أخرى مثل font, space, radii
              },
              // ******* هذا هو التغيير الرئيسي: نقل input و button إلى elements *******
              elements: {
                input: { // خصائص حقول الإدخال
                  focusBorder: '#6366F1', // لون التركيز
                  backgroundColor: '#F9FAFB', // تأكيد لون الخلفية
                  borderColor: '#E5E7EB', // تأكيد لون الحدود
                  color: '#374151', // تأكيد لون النص
                },
                button: { // خصائص الأزرار
                  background: '#6366F1',
                  backgroundHover: '#4F46E5',
                  border: '#6366F1',
                  color: '#FFFFFF', // تأكيد لون النص (تم تغيير 'text' إلى 'color')
                }
              }
            },
          }}
          theme="light"
          providers={['google', 'github']}
          redirectTo={`${process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3000'}/auth/callback`}
        />
      </div>
    </div>
  );
}
