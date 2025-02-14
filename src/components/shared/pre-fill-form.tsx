'use client';

import { useState } from 'react';
import { UserContext } from '@/types';

interface PreFillFormProps {
  onSubmit: (context: UserContext) => void;
}

export const PreFillForm = ({ onSubmit }: PreFillFormProps) => {
  const [age, setAge] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (age) {
      onSubmit({ age: parseInt(age) });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-md p-6 space-y-6 
        bg-gray-800 rounded-lg">
        <h2 className="text-2xl font-bold text-center">Welcome to educasm</h2>
        <p className="text-gray-400 text-center">
          Please tell us a bit about yourself so we can personalize your experience.
        </p>
        
        <div className="space-y-2">
          <label htmlFor="age" className="block text-sm font-medium">
            Your Age
          </label>
          <input
            type="number"
            id="age"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            min="1"
            max="120"
            required
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 
              rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          className="w-full px-4 py-2 text-white bg-blue-600 rounded-md 
            hover:bg-blue-700 focus:outline-none focus:ring-2 
            focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
        >
          Get Started
        </button>
      </form>
    </div>
  );
}; 