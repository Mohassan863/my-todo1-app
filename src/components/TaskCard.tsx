// src/components/TaskCard.tsx
import { CheckCircle, Circle, Edit, Trash2, Calendar, Tag } from 'lucide-react';
import React from 'react';

interface TaskCardProps {
  id: string;
  title: string;
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high';
  isCompleted: boolean;
  onToggleComplete: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function TaskCard({
  id,
  title,
  dueDate,
  priority,
  isCompleted,
  onToggleComplete,
  onEdit,
  onDelete,
}: TaskCardProps) {

  const getPriorityColor = (p?: 'low' | 'medium' | 'high') => {
    switch (p) {
      case 'high': return 'text-red-600 dark:text-red-400';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400';
      case 'low': return 'text-green-600 dark:text-green-400';
      default: return 'text-gray-500 dark:text-gray-400';
    }
  };

  return (
    <div className={`flex items-center justify-between p-5 bg-white rounded-xl shadow-md mb-4
                     dark:bg-gray-700 transition-all duration-200 ease-in-out
                     ${isCompleted ? 'opacity-60 line-through' : ''}`}> {/* Larger padding, more rounded, subtle shadow */}
      <div className="flex items-center flex-grow">
        {/* Toggle Completion Button */}
        <button
          onClick={() => onToggleComplete(id)}
          className="mr-4 text-gray-400 hover:text-indigo-500 transition-colors duration-200 transform hover:scale-110"
        > {/* Vibrant hover */}
          {isCompleted ? <CheckCircle className="h-7 w-7 text-indigo-500" /> : <Circle className="h-7 w-7" />}
        </button>

        <div className="flex-grow">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-1"> {/* Larger, bolder title */}
            {title}
          </h3>
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-300">
            {/* Due Date */}
            {dueDate && (
              <span className="flex items-center mr-3">
                <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                {dueDate}
              </span>
            )}
            {/* Priority */}
            {priority && (
              <span className={`flex items-center ${getPriorityColor(priority)}`}>
                <Tag className="h-4 w-4 mr-1" />
                {priority === 'high' ? 'عالية' : priority === 'medium' ? 'متوسطة' : 'منخفضة'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onEdit(id)}
          className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-blue-600
                     dark:hover:bg-gray-600 dark:hover:text-blue-400 transition-colors duration-200 transform hover:scale-110"
        > {/* Vibrant hover for edit */}
          <Edit className="h-5 w-5" />
        </button>
        <button
          onClick={() => onDelete(id)}
          className="p-2 rounded-full text-red-500 hover:bg-red-100 hover:text-red-700
                     dark:hover:bg-red-800 dark:hover:text-red-400 transition-colors duration-200 transform hover:scale-110"
        > {/* Vibrant hover for delete */}
          <Trash2 className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}