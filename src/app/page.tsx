// app/page.tsx
"use client"

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Todo | null>(null);
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const [showSidebar, setShowSidebar] = useState(false);

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

        if (!error) setTodos(data || []);
        else console.error('Error fetching todos:', error);
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
          if (!user) return;

          if (payload.eventType === 'INSERT' && payload.new.user_id === user.id) {
            setTodos(prev => [payload.new as Todo, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setTodos(prev =>
              prev.map(todo =>
                todo.id === (payload.old as Todo).id && (payload.new as Todo).user_id === user.id
                  ? (payload.new as Todo)
                  : todo
              )
            );
          } else if (payload.eventType === 'DELETE' && (payload.old as Todo).user_id === user.id) {
            setTodos(prev => prev.filter(todo => todo.id !== (payload.old as Todo).id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, router, user]);

  const handleToggleComplete = async (id: string) => {
    const todoToUpdate = todos.find(todo => todo.id === id);
    if (!todoToUpdate || !user || todoToUpdate.user_id !== user.id) return;

    const { error } = await supabase
      .from('todos')
      .update({ is_completed: !todoToUpdate.is_completed })
      .eq('id', id);

    if (error) console.error('Error updating task:', error);
  };

  const handleDeleteTask = async (id: string) => {
    const todoToDelete = todos.find(todo => todo.id === id);
    if (!todoToDelete || !user || todoToDelete.user_id !== user.id) return;

    const { error } = await supabase.from('todos').delete().eq('id', id);
    if (error) console.error('Error deleting task:', error);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) router.push('/login');
  };

  const openAddTaskModal = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const handleSaveTask = async (taskData: Omit<Todo, 'id' | 'inserted_at' | 'user_id'> & { id?: string }) => {
    if (!user) return;

    if (taskData.id) {
      const todoToUpdate = todos.find(todo => todo.id === taskData.id);
      if (!todoToUpdate || todoToUpdate.user_id !== user.id) return;

      const { error } = await supabase
        .from('todos')
        .update({ ...taskData })
        .eq('id', taskData.id);

      if (error) console.error('Error updating task:', error);
    } else {
      const { error } = await supabase.from('todos').insert({
        task: taskData.task,
        user_id: user.id,
        is_completed: false,
        dueDate: taskData.dueDate,
        priority: taskData.priority,
      });

      if (error) console.error('Error adding new task:', error);
    }

    closeModal();
  };

  const getFilteredTodos = () => {
    if (filter === 'completed') return todos.filter(t => t.is_completed);
    if (filter === 'pending') return todos.filter(t => !t.is_completed);
    return todos;
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 to-purple-50 text-gray-800 dark:text-white transition-colors">
      {/* Mobile toggle button */}
      <div className="md:hidden p-4">
        {showSidebar ? (
          <X onClick={() => setShowSidebar(false)} className="w-8 h-8" />
        ) : (
          <Menu onClick={() => setShowSidebar(true)} className="w-8 h-8" />
        )}
      </div>

      {/* Sidebar */}
      {showSidebar && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-30" onClick={() => setShowSidebar(false)}></div>
      )}
      <div
        className={`fixed top-0 left-0 z-40 h-full w-64 transition-transform transform bg-white dark:bg-gray-900 shadow-lg md:static md:translate-x-0
          ${showSidebar ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:flex`}
      >
        <Sidebar
          userEmail={user?.email}
          onLogout={handleLogout}
          onNewTaskClick={() => {
            openAddTaskModal();
            setShowSidebar(false);
          }}
          onFilterChange={setFilter}
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="flex justify-center mb-6">
          <Clock />
        </div>

        <h1 className="text-3xl md:text-5xl font-extrabold mb-8 text-center md:text-left text-indigo-700 dark:text-indigo-400">
          مهامك اليومية
        </h1>

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
                onEdit={(id) => {
                  const task = todos.find(t => t.id === id) || null;
                  setEditingTask(task);
                  setIsModalOpen(true);
                }}
                onDelete={handleDeleteTask}
              />
            ))
          )}
        </div>

        {/* Floating Action Button */}
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={openAddTaskModal}
            className="w-16 h-16 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white rounded-full flex items-center justify-center text-3xl shadow-lg transition-transform transform hover:scale-110"
            title="إضافة مهمة جديدة"
          >
            <Plus className="h-8 w-8" />
          </button>
        </div>

        {/* Task Modal */}
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
