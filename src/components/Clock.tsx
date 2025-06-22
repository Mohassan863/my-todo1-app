// src/components/Clock.tsx
"use client";

import React, { useState, useEffect } from 'react';

export default function Clock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timerId);
  }, []);

  const formattedTime = time.toLocaleTimeString('ar-EG', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  return (
    <div className="flex items-center justify-center py-3 px-5 mb-6 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full shadow-lg transform hover:scale-105 transition-transform duration-300 ease-in-out md:max-w-xs mx-auto"> {/* Vibrant gradient, fully rounded, responsive width */}
      <p className="text-white text-4xl md:text-5xl font-extrabold tracking-wide drop-shadow-md font-mono"> {/* Smaller font on mobile */}
        {formattedTime}
      </p>
    </div>
  );
}