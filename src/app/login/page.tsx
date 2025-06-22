// app/login/page.tsx
"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { FaGoogle, FaGithub } from 'react-icons/fa';

export default function LoginPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Redirect if session exists
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push("/");
    });
  }, [router, supabase]);

  // Handle email/password login
  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setErrorMsg(error.message);
    } else {
      router.push("/");
    }
  }

  // Handle OAuth providers
  const handleOAuth = async (provider: "google" | "github") => {
    setErrorMsg(null);
    const { error } = await supabase.auth.signInWithOAuth({ provider });
    if (error) setErrorMsg(error.message);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-100 to-fuchsia-100 p-6">
      <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-lg border border-indigo-200">
        <h1 className="text-4xl font-extrabold mb-8 text-center text-indigo-800">تسجيل الدخول</h1>

        {errorMsg && (
          <div className="mb-6 text-red-800 bg-red-100 p-4 rounded-lg">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-indigo-700 mb-2 font-medium">البريد الإلكتروني</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-5 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-300 transition"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-indigo-700 mb-2 font-medium">كلمة المرور</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-5 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-300 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition"
          >
            {loading ? "جاري تسجيل الدخول..." : "دخول"}
          </button>
        </form>

        <div className="my-7 text-center text-gray-600">أو تسجيل بواسطة</div>

        <div className="flex flex-col gap-4">
          <button
            onClick={() => handleOAuth("google")}
            className="flex items-center justify-center border border-gray-300 bg-white py-3 rounded-lg hover:bg-gray-50 transition"
          >
            <FaGoogle className="w-5 h-5 text-red-500 ml-3" />
            <span className="text-gray-700 font-medium">تسجيل عبر Google</span>
          </button>

          <button
            onClick={() => handleOAuth("github")}
            className="flex items-center justify-center border border-gray-300 bg-white py-3 rounded-lg hover:bg-gray-50 transition"
          >
            <FaGithub className="w-5 h-5 text-gray-800 ml-3" />
            <span className="text-gray-700 font-medium">تسجيل عبر GitHub</span>
          </button>
        </div>

        <p className="mt-8 text-center text-gray-600">
          ليس لديك حساب؟{' '}
          <a href="/signup" className="text-purple-600 font-medium hover:underline">
            إنشاء حساب جديد
          </a>
        </p>
      </div>
    </div>
  );
}
