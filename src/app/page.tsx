"use client"

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';
import Clock from '../components/Clock';
import { Plus } from 'lucide-react';
import { User } from '@supabase/supabase-js';

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
  const [todos, setTodos] = useState<Todo[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Todo | null>(null);
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const supabase = createClientComponentClient();
  const router = useRouter();

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

        if (!error) {
          setTodos(data || []);
        } else {
          console.error('Error fetching todos:', error);
        }
      } else {
        router.push('/login');
      }
    };

    fetchUserAndTodos();

    const channel = supabase
      .channel('todos_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'todos' }, (payload) => {
        if (user) {
          if (payload.eventType === 'INSERT' && payload.new.user_id === user.id) {
            setTodos((prev) => [payload.new as Todo, ...prev]);
          }
          if (payload.eventType === 'UPDATE') {
            setTodos((prev) =>
              prev.map((todo) =>
                todo.id === (payload.old as Todo).id && (payload.new as Todo).user_id === user.id
                  ? (payload.new as Todo)
                  : todo
              )
            );
          }
          if (payload.eventType === 'DELETE' && (payload.old as Todo).user_id === user.id) {
            setTodos((prev) => prev.filter((todo) => todo.id !== (payload.old as Todo).id));
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, router, user]);

  const handleToggleComplete = async (id: string) => {
    const todo = todos.find((t) => t.id === id);
    if (!todo || !user || todo.user_id !== user.id) return;

    await supabase
      .from('todos')
      .update({ is_completed: !todo.is_completed })
      .eq('id', id)
      .select()
      .maybeSingle();
  };

  const handleDeleteTask = async (id: string) => {
    const todo = todos.find((t) => t.id === id);
    if (!todo || !user || todo.user_id !== user.id) return;

    await supabase.from('todos').delete().eq('id', id);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleSaveTask = async (
    taskData: Omit<Todo, 'id' | 'inserted_at' | 'user_id'> & { id?: string }
  ) => {
    if (!user) return;

    if (taskData.id) {
      await supabase
        .from('todos')
        .update({ ...taskData })
        .eq('id', taskData.id)
        .select()
        .maybeSingle();
    } else {
      await supabase.from('todos').insert({ ...taskData, user_id: user.id, is_completed: false });
    }
    closeModal();
  };

  const getFilteredTodos = () => {
    if (filter === 'completed') return todos.filter((t) => t.is_completed);
    if (filter === 'pending') return todos.filter((t) => !t.is_completed);
    return todos;
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 to-purple-50 text-gray-800 dark:text-white">
      {/* زر الهامبرجر */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="md:hidden absolute top-4 left-4 z-50 bg-white dark:bg-gray-800 p-2 rounded-md shadow-md"
      >
        {isSidebarOpen ? '✖' : '☰'}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-900 transform ${{
          true: isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
        }} transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:block`}
      >
        <Sidebar
          userEmail={user?.email}
          onLogout={handleLogout}
          onNewTaskClick={() => {
            setEditingTask(null);
            setIsModalOpen(true);
            setIsSidebarOpen(false);
          }}
          onFilterChange={setFilter}
        />
      </div>

      {/* Main */}
      <main className="flex-1 p-4 overflow-y-auto">
        <div className="flex justify-center mb-6">
          <Clock />
        </div>
        <h1 className="text-3xl font-bold mb-6 text-center text-indigo-700 dark:text-indigo-400">
          مهامك اليومية
        </h1>

        <div className="space-y-4">
          {getFilteredTodos().length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400">
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
                onEdit={() => {
                  setEditingTask(todo);
                  setIsModalOpen(true);
                  setIsSidebarOpen(false);
                }}
                onDelete={handleDeleteTask}
              />
            ))
          )}
        </div>

        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => {
              setEditingTask(null);
              setIsModalOpen(true);
              setIsSidebarOpen(false);
            }}
            className="w-16 h-16 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white rounded-full flex items-center justify-center text-3xl shadow-lg transition-transform transform hover:scale-110"
            title="إضافة مهمة جديدة"
          >
            <Plus className="h-8 w-8" />
          </button>
        </div>

        {isModalOpen && (
          <TaskModal task={editingTask} onClose={closeModal} onSave={handleSaveTask} />
        )}
      </main>
    </div>
  );
}
