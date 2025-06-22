// src/components/TaskModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Tag as TagIcon } from 'lucide-react';
import DatePicker from 'react-datepicker';

interface Task {
  id?: string;
  task: string;
  is_completed: boolean;
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high';
}

interface TaskModalProps {
  task: Task | null;
  onClose: () => void;
  onSave: (task: Omit<Task, 'id' | 'inserted_at'> & { id?: string }) => void;
}

export default function TaskModal({ task, onClose, onSave }: TaskModalProps) {
  const [title, setTitle] = useState(task?.task || '');
  const [dueDate, setDueDate] = useState<Date | null>(task?.dueDate ? new Date(task.dueDate) : null);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(task?.priority || 'medium');

  useEffect(() => {
    if (task) {
      setTitle(task.task);
      setDueDate(task.dueDate ? new Date(task.dueDate) : null);
      setPriority(task.priority || 'medium');
    } else {
      setTitle('');
      setDueDate(null);
      setPriority('medium');
    }
  }, [task]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() === '') return;

    const savedTask: Omit<Task, 'id' | 'inserted_at'> & { id?: string } = {
      task: title,
      is_completed: task?.is_completed || false,
      dueDate: dueDate ? dueDate.toISOString().split('T')[0] : undefined,
      priority: priority,
    };

    if (task?.id) {
      savedTask.id = task.id;
    }
    onSave(savedTask);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50"> {/* Slightly less opaque overlay */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative
                     dark:bg-gray-800 transition-colors duration-300 ease-in-out transform scale-100 opacity-100 animate-fade-in-scale"> {/* More rounded, deeper shadow, subtle animation */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
        > {/* Rounded close button with hover */}
          <X className="h-6 w-6" />
        </button>
        <h2 className="text-3xl font-extrabold mb-6 text-gray-800 dark:text-white text-center"> {/* Larger, bolder title */}
          {task ? 'تعديل المهمة' : 'إضافة مهمة جديدة'}
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Task Title Input */}
          <div className="mb-4">
            <label htmlFor="taskTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              عنوان المهمة:
            </label>
            <input
              type="text"
              id="taskTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-400
                         dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500
                         focus:ring-blue-500 focus:border-blue-500 outline-none shadow-sm transition-colors duration-200"
              placeholder="اكتب مهمتك هنا..."
              required
            /> {/* Brighter background, subtle shadow, better focus */}
          </div>

          {/* Due Date Picker */}
          <div className="mb-4">
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              تاريخ الاستحقاق:
            </label>
            <div className="relative">
              <DatePicker
                selected={dueDate}
                onChange={(date: Date | null) => setDueDate(date)}
                dateFormat="yyyy/MM/dd"
                className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-400
                           dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500
                           focus:ring-blue-500 focus:border-blue-500 outline-none shadow-sm transition-colors duration-200"
                placeholderText="اختر تاريخاً"
                isClearable
              />
              <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Priority Selection */}
          <div className="mb-6">
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              الأولوية:
            </label>
            <div className="flex space-x-3 justify-center md:justify-start"> {/* Centered on mobile, left-aligned on desktop */}
              {['low', 'medium', 'high'].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p as 'low' | 'medium' | 'high')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 shadow-sm
                    ${p === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200' :
                      p === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'}
                    ${priority === p ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-blue-400' : ''}`}
                >
                  <TagIcon className="inline-block h-4 w-4 mr-1" />
                  {p === 'high' ? 'عالية' : p === 'medium' ? 'متوسطة' : 'منخفضة'}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse md:flex-row justify-end space-y-3 space-y-reverse md:space-y-0 md:space-x-3"> {/* Stacked on mobile, side-by-side on desktop */}
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 shadow-sm
                         dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 transition-colors duration-200"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-md
                         transition-colors duration-200 transform hover:scale-105"
            > {/* Vibrant blue, subtle transform on hover */}
              {task ? 'حفظ التعديلات' : 'إضافة المهمة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}