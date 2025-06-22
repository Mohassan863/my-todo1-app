// app/auth/callback/route.ts
// هذا الملف هو Server Route Handler، ولا يستخدم React Hooks أو "use client".

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  console.log('Auth Callback: طلب الاستجابة من Google تم استقباله.'); // سجل لتتبع بداية العملية
  console.log('Auth Callback: الكود المستلم:', code); // سجل لعرض الكود المستلم

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    console.log('Auth Callback: جاري تبادل الكود بجلسة المستخدم...'); // سجل لتتبع عملية التبادل
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Auth Callback: خطأ في تبادل الكود بجلسة المستخدم:', error); // سجل الخطأ إذا حدث
      // في حالة وجود خطأ، يمكنك إعادة توجيه المستخدم إلى صفحة تسجيل الدخول مع رسالة خطأ
      return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_failed`);
    } else {
      console.log('Auth Callback: تم تبادل الجلسة بنجاح. المستخدم:', data.user?.email); // سجل النجاح
    }
  } else {
    console.log('Auth Callback: لم يتم العثور على كود في URL.'); // سجل إذا لم يكن هناك كود
  }

  console.log('Auth Callback: جاري إعادة التوجيه إلى الأصل:', requestUrl.origin); // سجل قبل إعادة التوجيه
  // URL to redirect to after sign in process completes
  // هذا سيقوم بإعادة توجيه المستخدم إلى http://localhost:3000/ (أو نطاق تطبيقك الفعلي)
  return NextResponse.redirect(requestUrl.origin);
}
