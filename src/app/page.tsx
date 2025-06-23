"use client";

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';
import Clock from '../components/Clock';
import { Plus, Search, Menu, X } from 'lucide-react';
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
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Todo | null>(null);
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchUserAndTodos = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      if (currentUser) {
        const { data: todosData, error } = await supabase
          .from('todos')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('inserted_at', { ascending: false });

        if (error) console.error('Error fetching todos:', error);
        else setTodos(todosData || []);
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
              setTodos((prev) => [payload.new as Todo, ...prev]);
            }
          } else if (payload.eventType === 'UPDATE') {
            setTodos((prev) =>
              prev.map((todo) =>
                (user && todo.id === (payload.old as Todo).id && (payload.new as Todo).user_id === user.id)
                  ? (payload.new as Todo)
                  : todo
              )
            );
          } else if (payload.eventType === 'DELETE') {
            if (user && (payload.old as Todo).user_id === user.id) {
              setTodos((prev) => prev.filter((todo) => todo.id !== (payload.old as Todo).id));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, router, user]);

  const handleToggleComplete = async (id: string) => {
    const todo = todos.find(todo => todo.id === id);
    if (!todo || !user || todo.user_id !== user.id) return;

    const { error } = await supabase
      .from('todos')
      .update({ is_completed: !todo.is_completed })
      .eq('id', id);

    if (error) console.error('Error updating task:', error);
  };

  const handleDeleteTask = async (id: string) => {
    const todo = todos.find(todo => todo.id === id);
    if (!todo || !user || todo.user_id !== user.id) return;

    const { error } = await supabase.from('todos').delete().eq('id', id);
    if (error) console.error('Error deleting task:', error);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) router.push('/login');
  };

  const handleSaveTask = async (taskData: Omit<Todo, 'id' | 'inserted_at' | 'user_id'> & { id?: string }) => {
    if (!user) return;

    if (taskData.id) {
      const todo = todos.find(todo => todo.id === taskData.id);
      if (!todo || todo.user_id !== user.id) return;

      const { error } = await supabase
        .from('todos')
        .update(taskData)
        .eq('id', taskData.id);

      if (error) console.error('Error updating task:', error);
    } else {
      const { error } = await supabase
        .from('todos')
        .insert({
          ...taskData,
          user_id: user.id,
          is_completed: false,
        });

      if (error) console.error('Error adding task:', error);
    }
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const getFilteredTodos = () => {
    if (filter === 'completed') return todos.filter(t => t.is_completed);
    if (filter === 'pending') return todos.filter(t => !t.is_completed);
    return todos;
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gradient-to-br from-blue-50 to-purple-50 text-gray-800 dark:text-white">
      <div className="md:hidden p-4">
        {sidebarOpen ? (
          <X className="w-8 h-8 cursor-pointer" onClick={() => setSidebarOpen(false)} />
        ) : (
          <Menu className="w-8 h-8 cursor-pointer" onClick={() => setSidebarOpen(true)} />
        )}
      </div>

      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-white dark:bg-gray-800 p-4">
          <Sidebar
            userEmail={user?.email}
            onLogout={handleLogout}
            onNewTaskClick={() => {
              setIsModalOpen(true);
              setSidebarOpen(false);
            }}
            onFilterChange={(f) => {
              setFilter(f);
              setSidebarOpen(false);
            }}
          />
        </div>
      )}

      <div className="hidden md:block">
        <Sidebar
          userEmail={user?.email}
          onLogout={handleLogout}
          onNewTaskClick={() => setIsModalOpen(true)}
          onFilterChange={setFilter}
        />
      </div>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="flex justify-center items-center mb-6 md:mb-10">
          <Clock />
        </div>

        <h1 className="text-4xl font-extrabold mb-8 text-center text-indigo-700 dark:text-indigo-400">مهامك اليومية</h1>

        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
          <div className="relative w-full md:max-w-md">
            <input
              type="text"
              placeholder="ابحث عن مهمة..."
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-white border border-gray-300 text-gray-800 placeholder-gray-400 shadow-sm
                dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-500"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
          <div className="flex space-x-2">
            {['all', 'completed', 'pending'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as typeof filter)}
                className={`px-4 py-2 rounded-full font-medium shadow-sm transition-all
                  ${filter === f ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}
                  dark:${filter === f ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
              >
                {f === 'all' ? 'الكل' : f === 'completed' ? 'المُنجزة' : 'المعلقة'}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {getFilteredTodos().length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-10">
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
                onEdit={(id) => setEditingTask(todos.find(t => t.id === id) || null) || setIsModalOpen(true)}
                onDelete={handleDeleteTask}
              />
            ))
          )}
        </div>

        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-16 h-16 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white rounded-full flex items-center justify-center text-3xl shadow-lg hover:scale-110 transition"
            title="إضافة مهمة جديدة"
          >
            <Plus className="h-8 w-8" />
          </button>
        </div>

        {isModalOpen && (
          <TaskModal
            task={editingTask}
            onClose={() => {
              setIsModalOpen(false);
              setEditingTask(null);
            }}
            onSave={handleSaveTask}
          />
        )}
      </main>
    </div>
  );
}
