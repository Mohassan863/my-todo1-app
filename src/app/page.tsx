"use client" // هذا التوجيه ضروري لاستخدام React Hooks والوظائف من جانب العميل

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';
import Clock from '../components/Clock';
import { Plus, Search, Menu } from 'lucide-react'; // أضفت Menu هنا
import { User } from '@supabase/supabase-js'; // استيراد نوع المستخدم من Supabase

// تعريف واجهة Todo لمطابقة أعمدة قاعدة البيانات
interface Todo {
  id: string;
  user_id: string;
  task: string;
  is_completed: boolean;
  inserted_at: string;
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high';
}

export default function HomePage() {
  const [todos, setTodos] = useState<Todo[]>([]); // حالة لقائمة المهام
  const [user, setUser] = useState<User | null>(null); // حالة للمستخدم الحالي
  const supabase = createClientComponentClient(); // تهيئة عميل Supabase
  const router = useRouter(); // تهيئة Next.js router

  // حالات للتحكم في المودال
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Todo | null>(null); // يخزن المهمة التي يتم تعديلها
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending'>('all'); // حالة لفلترة المهام

  // حالة لفتح وإغلاق الـ Sidebar في الموبايل
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // تأثير (Effect) لجلب معلومات المستخدم والمهام عند تحميل المكون
  // ولإعداد مستمع Real-time
  useEffect(() => {
    const fetchUserAndTodos = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      if (currentUser) {
        const { data, error } = await supabase
          .from('todos')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('inserted_at', { ascending: false });

        if (error) {
          console.error('Error fetching todos:', error);
        } else {
          setTodos(data || []);
        }
      } else {
        setTodos([]);
        router.push('/login');
      }
    };

    fetchUserAndTodos();

    const channel = supabase
      .channel('todos_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'todos' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            if (user && payload.new.user_id === user.id) {
              setTodos((prevTodos) => [payload.new as Todo, ...prevTodos]);
            }
          } else if (payload.eventType === 'UPDATE') {
            setTodos((prevTodos) =>
              prevTodos.map((todo) =>
                (user && todo.id === (payload.old as Todo).id && (payload.new as Todo).user_id === user.id)
                  ? (payload.new as Todo)
                  : todo
              )
            );
          } else if (payload.eventType === 'DELETE') {
            if (user && (payload.old as Todo).user_id === user.id) {
              setTodos((prevTodos) =>
                prevTodos.filter((todo) => todo.id !== (payload.old as Todo).id)
              );
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, router, user]);

  // دالة لتبديل حالة إنجاز المهمة
  const handleToggleComplete = async (id: string) => {
    const todoToUpdate = todos.find(todo => todo.id === id);
    if (!todoToUpdate) {
      return;
    }
    if (!user || todoToUpdate.user_id !== user.id) {
        return;
    }

    const { data, error } = await supabase
      .from('todos')
      .update({ is_completed: !todoToUpdate.is_completed })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error updating task completion:', error);
    }
  };

  // دالة لحذف مهمة
  const handleDeleteTask = async (id: string) => {
    const todoToDelete = todos.find(todo => todo.id === id);
    if (!todoToDelete) {
      return;
    }
    if (!user || todoToDelete.user_id !== user.id) {
        return;
    }

    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting task:', error);
    }
  };

  // دالة لتسجيل خروج المستخدم
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error logging out:', error);
    } else {
      router.push('/login');
    }
  };

  // دالة لفتح المودال لإضافة مهمة جديدة
  const openAddTaskModal = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  // دالة لفتح المودال لتعديل مهمة موجودة
  const openEditTaskModal = (id: string) => {
    const task = todos.find(t => t.id === id);
    if (task) {
      if (!user || task.user_id !== user.id) {
        return;
      }
      setEditingTask(task);
      setIsModalOpen(true);
    }
  };

  // دالة لإغلاق المودال
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };

  // دالة لحفظ مهمة جديدة أو تحديث مهمة موجودة
  const handleSaveTask = async (taskData: Omit<Todo, 'id' | 'inserted_at' | 'user_id'> & { id?: string }) => {
    if (!user) {
      console.error('handleSaveTask: No user logged in.');
      return;
    }

    if (taskData.id) {
      const todoToUpdate = todos.find(todo => todo.id === taskData.id);
      if (!todoToUpdate || todoToUpdate.user_id !== user.id) {
          return;
      }

      const { data, error } = await supabase
        .from('todos')
        .update({
          task: taskData.task,
          dueDate: taskData.dueDate,
          priority: taskData.priority,
          is_completed: taskData.is_completed,
        })
        .eq('id', taskData.id)
        .select()
        .maybeSingle();

      if (error) {
        console.error('Error updating task:', error);
      }
    } else {
      const { error } = await supabase
        .from('todos')
        .insert({
          task: taskData.task,
          user_id: user.id,
          is_completed: false,
          dueDate: taskData.dueDate,
          priority: taskData.priority,
        });

      if (error) {
        console.error('Error adding new task:', error);
      }
    }
    closeModal();
  };

  // دالة لفلترة المهام بناءً على حالة الفلتر الحالية
  const getFilteredTodos = () => {
    if (filter === 'completed') {
      return todos.filter(todo => todo.is_completed);
    }
    if (filter === 'pending') {
      return todos.filter(todo => !todo.is_completed);
    }
    return todos;
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gradient-to-br from-blue-50 to-purple-50 text-gray-800 dark:text-white transition-colors duration-300 ease-in-out">
      
      {/* Sidebar يظهر دائماً في الديسكتوب، وفي الموبايل يظهر حسب الحالة */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden" onClick={() => setSidebarOpen(false)}></div>
      )}
      <div
        className={`
          fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-900 shadow-lg z-50
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:static md:shadow-none
        `}
      >
        <Sidebar
          userEmail={user?.email}
          onLogout={() => {
            handleLogout();
            setSidebarOpen(false);
          }}
          onNewTaskClick={() => {
            openAddTaskModal();
            setSidebarOpen(false);
          }}
          onFilterChange={(filterValue) => {
            setFilter(filterValue);
            setSidebarOpen(false);
          }}
        />
        {/* زر إغلاق في الموبايل */}
        {sidebarOpen && (
          <button
            className="md:hidden absolute top-4 right-4 p-2 rounded-md bg-gray-300 dark:bg-gray-700"
            onClick={() => setSidebarOpen(false)}
            aria-label="إغلاق القائمة"
          >
            ✕
          </button>
        )}
      </div>

      {/* زرار فتح القائمة في الموبايل يظهر فقط لما sidebarOpen false */}
      {!sidebarOpen && (
        <button
          className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-indigo-600 text-white shadow-md"
          onClick={() => setSidebarOpen(true)}
          aria-label="فتح القائمة"
        >
          <Menu className="w-6 h-6" />
        </button>
      )}

      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {/* مكون الساعة */}
        <div className="flex justify-center items-center mb-6 md:mb-10">
          <Clock />
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold mb-8 md:mb-12 text-center md:text-left text-indigo-700 dark:text-indigo-400">
          مهامك اليومية
        </h1>

        {/* شريط البحث والفلترة */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 space-y-4 md:space-y-0 md:space-x-4">
          <div className="relative flex-grow w-full md:w-auto">
            <input
              type="text"
              placeholder="ابحث عن مهمة..."
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-white border border-gray-300 text-gray-800 placeholder-gray-400 shadow-sm
                         dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-500
                         focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-200"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
          {/* أزرار الفلترة */}
          <div className="flex space-x-2 w-full md:w-auto justify-center">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-full font-medium shadow-sm transition-all duration-300 ease-in-out
                          ${filter === 'all' ? 'bg-indigo-500 text-white transform scale-105' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}
                          dark:${filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
            >
              الكل
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-full font-medium shadow-sm transition-all duration-300 ease-in-out
                          ${filter === 'completed' ? 'bg-green-500 text-white transform scale-105' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}
                          dark:${filter === 'completed' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
            >
              المُنجزة
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-full font-medium shadow-sm transition-all duration-300 ease-in-out
                          ${filter === 'pending' ? 'bg-orange-500 text-white transform scale-105' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}
                          dark:${filter === 'pending' ? 'bg-orange-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
            >
              المعلقة
            </button>
          </div>
        </div>

        {/* عرض قائمة المهام */}
        <div className="space-y-4">
          {getFilteredTodos().length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 text-lg py-10">
              {filter === 'all' ? 'لا توجد مهام حالياً. ابدأ بإضافة واحدة!' : 'لا توجد مهام بهذا التصنيف.'}
            </p>
          ) : (
            getFilteredTodos().map((todo) => (
              <TaskCard
                key={todo.id}
                id={todo.id}
                title={todo.task}
                isCompleted={todo.is_completed}
                dueDate={todo.dueDate}
                priority={todo.priority}
                onToggleComplete={handleToggleComplete}
                onEdit={openEditTaskModal}
                onDelete={handleDeleteTask}
              />
            ))
          )}
        </div>

        {/* زر الإجراء العائم لإضافة مهام جديدة */}
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={openAddTaskModal}
            className="w-16 h-16 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white rounded-full flex items-center justify-center text-3xl shadow-lg transition-transform transform hover:scale-110"
            title="إضافة مهمة جديدة"
          >
            <Plus className="h-8 w-8" />
          </button>
        </div>

        {/* مودال المهام (إضافة/تعديل) */}
        {isModalOpen && (
          <TaskModal
            task={editingTask}
            onClose={closeModal}
            onSave={handleSaveTask}
          />
        )}
      </main>
    </div>
  );
}
