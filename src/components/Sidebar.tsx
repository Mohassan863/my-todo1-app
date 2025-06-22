// src/components/Sidebar.tsx
"use client";

import { Home, Calendar, Flag, Settings, LogOut, Sun, Moon, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface SidebarProps {
  userEmail?: string | null;
  onLogout: () => void;
  onNewTaskClick: () => void;
  onFilterChange: (filter: 'all' | 'completed' | 'pending') => void;
}

export default function Sidebar({ userEmail, onLogout, onNewTaskClick, onFilterChange }: SidebarProps) {
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleDarkMode = () => {
    if (document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
      setIsDarkMode(true);
    } else {
      document.documentElement.classList.remove('dark');
      setIsDarkMode(false);
    }
  }, []);

  return (
    <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 p-6 flex flex-col min-h-screen
                     dark:bg-gray-800 dark:border-gray-700 transition-colors duration-300 ease-in-out"> {/* Lighter background, subtle border */}
      {/* Sidebar Header - User Info */}
      <div className="flex items-center mb-8">
        <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-lg mr-3 shadow-md"> {/* Vibrant user icon */}
          {userEmail ? userEmail[0].toUpperCase() : '؟'}
        </div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">{userEmail || 'الضيف'}</h2>
      </div>

      {/* New Task Button */}
      <button
        onClick={onNewTaskClick}
        className="flex items-center justify-center bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg mb-6 transition-all duration-300 ease-in-out transform hover:scale-105" // Gradient, more rounded, shadow
      >
        <Plus className="mr-2 h-5 w-5" />
        مهمة جديدة
      </button>

      {/* Main Navigation Links */}
      <nav className="flex-1">
        <ul>
          <li className="mb-2">
            <button
              onClick={() => onFilterChange('all')}
              className="flex items-center p-3 rounded-lg text-gray-700 hover:bg-blue-50 focus:bg-blue-50 focus:text-blue-700
                         dark:text-gray-200 dark:hover:bg-gray-700 dark:focus:bg-gray-700 dark:focus:text-blue-400 w-full text-left transition-colors duration-200"
            > {/* Lighter hover, focus colors */}
              <Home className="mr-3 h-5 w-5" />
              <span>كل المهام</span>
            </button>
          </li>
          <li className="mb-2">
            <button
              onClick={() => onFilterChange('pending')}
              className="flex items-center p-3 rounded-lg text-gray-700 hover:bg-blue-50 focus:bg-blue-50 focus:text-blue-700
                         dark:text-gray-200 dark:hover:bg-gray-700 dark:focus:bg-gray-700 dark:focus:text-blue-400 w-full text-left transition-colors duration-200"
            >
              <Calendar className="mr-3 h-5 w-5" />
              <span>مهام اليوم</span>
            </button>
          </li>
          <li className="mb-2">
            <button
              onClick={() => onFilterChange('completed')}
              className="flex items-center p-3 rounded-lg text-gray-700 hover:bg-blue-50 focus:bg-blue-50 focus:text-blue-700
                         dark:text-gray-200 dark:hover:bg-gray-700 dark:focus:bg-gray-700 dark:focus:text-blue-400 w-full text-left transition-colors duration-200"
            >
              <Flag className="mr-3 h-5 w-5" />
              <span>المُنجزة</span>
            </button>
          </li>
        </ul>
      </nav>

      {/* Bottom section - Settings, Logout, Dark Mode Toggle */}
      <div className="mt-auto pt-6 border-t border-gray-100 dark:border-gray-700"> {/* Subtle top border */}
        <button
          onClick={() => router.push('/settings')}
          className="flex items-center p-3 rounded-lg text-gray-700 hover:bg-blue-50 focus:bg-blue-50 focus:text-blue-700
                     dark:text-gray-200 dark:hover:bg-gray-700 dark:focus:bg-gray-700 dark:focus:text-blue-400 w-full text-left transition-colors duration-200 mb-2"
        >
          <Settings className="mr-3 h-5 w-5" />
          <span>الإعدادات</span>
        </button>
        <button
          onClick={onLogout}
          className="flex items-center p-3 rounded-lg text-red-600 hover:bg-red-50 focus:bg-red-50 focus:text-red-700
                     dark:text-red-300 dark:hover:bg-red-800 dark:focus:bg-red-800 w-full text-left transition-colors duration-200"
        > {/* Vibrant red for logout */}
          <LogOut className="mr-3 h-5 w-5" />
          <span>تسجيل الخروج</span>
        </button>
        <div className="flex justify-end mt-4">
          <button
            onClick={toggleDarkMode}
            className="p-3 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 shadow-md
                     dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
          > {/* More pronounced toggle button */}
            {isDarkMode ? <Moon className="h-6 w-6" /> : <Sun className="h-6 w-6" />}
          </button>
        </div>
      </div>
    </aside>
  );
}
