// app/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';
import Clock from '../components/Clock';
import { Plus, Menu, X } from 'lucide-react';
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
    const fetchData = async () => {
      const { data: { user: currentUser }, error } = await supabase.auth.getUser();
      if (error || !currentUser) {
        router.push('/login');
        return;
      }
      setUser(currentUser);
      const { data: todosData, error: todosError } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('inserted_at', { ascending: false });
      if (todosError) console.error(todosError);
      else setTodos(todosData || []);
    };
    fetchData();

    const channel = supabase
      .channel('todos_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'todos' }, (payload) => {
        if (!user) return;
        if (payload.eventType === 'INSERT' && payload.new.user_id === user.id) {
          setTodos(prev => [payload.new as Todo, ...prev]);
        }
        if (payload.eventType === 'UPDATE') {
          setTodos(prev => prev.map(t => t.id === (payload.new as Todo).id ? (payload.new as Todo) : t));
        }
        if (payload.eventType === 'DELETE') {
          setTodos(prev => prev.filter(t => t.id !== (payload.old as Todo).id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, router, user]);

  const handleToggleComplete = async (id: string) => {
    const todo = todos.find(t => t.id === id);
    if (!todo || !user) return;
    await supabase.from('todos').update({ is_completed: !todo.is_completed }).eq('id', id);
  };

  const handleDeleteTask = async (id: string) => {
    if (!user) return;
    await supabase.from('todos').delete().eq('id', id);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const openAddModal = () => {
    setEditingTask(null);
    setIsModalOpen(true);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const onEdit = (todo: Todo) => {
    setEditingTask(todo);
    setIsModalOpen(true);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleSaveTask = async (data: Omit<Todo, 'id' | 'inserted_at' | 'user_id'> & { id?: string }) => {
    if (!user) return;
    if (data.id) {
      await supabase.from('todos').update(data).eq('id', data.id);
    } else {
      await supabase.from('todos').insert({ ...data, user_id: user.id, is_completed: false });
    }
    closeModal();
  };

  const filteredTodos = () => {
    if (filter === 'completed') return todos.filter(t => t.is_completed);
    if (filter === 'pending') return todos.filter(t => !t.is_completed);
    return todos;
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:bg-gray-800">
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-20" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      <aside className={`fixed top-0 left-0 z-30 h-full w-64 bg-white dark:bg-gray-900 transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static`}>
        <Sidebar
          userEmail={user?.email}
          onLogout={handleLogout}
          onNewTaskClick={openAddModal}
          onFilterChange={(f) => {
            setFilter(f);
            if (window.innerWidth < 768) setIsSidebarOpen(false);
          }}
        />
      </aside>

      <main className="flex-1 flex flex-col overflow-auto relative">
        <header className="md:hidden flex items-center justify-between bg-white dark:bg-gray-900 p-4 shadow">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            {isSidebarOpen ? <X className="w-6 h-6 text-gray-800 dark:text-white" /> : <Menu className="w-6 h-6 text-gray-800 dark:text-white" />}
          </button>
          <h1 className="text-xl font-bold text-indigo-700 dark:text-indigo-300">مهامك</h1>
          <div style={{ width: 24 }} />
        </header>

        <div className="p-4 flex justify-center">
          <Clock />
        </div>

        <h2 className="text-2xl md:text-4xl font-extrabold text-center text-indigo-700 dark:text-indigo-300 p-4">
          مهامك اليومية
        </h2>

        <div className="flex-1 p-4 space-y-4">
          {filteredTodos().length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400">لا توجد مهام</p>
          ) : (
            filteredTodos().map(todo => (
              <TaskCard
                key={todo.id}
                id={todo.id}
                title={todo.task}
                isCompleted={todo.is_completed}
                dueDate={todo.dueDate}
                priority={todo.priority}
                onToggleComplete={handleToggleComplete}
                onEdit={() => onEdit(todo)}
                onDelete={() => handleDeleteTask(todo.id)}
              />
            ))
          )}
        </div>

        <button
          onClick={openAddModal}
          className="fixed bottom-6 right-6 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg z-10"
        >
          <Plus className="w-6 h-6" />
        </button>

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
