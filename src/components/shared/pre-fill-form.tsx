import React, { useState } from "react";
import { UserContext } from "../../types";
import Image from "next/image";
interface PreFillFormProps {
  onSubmit: (context: UserContext) => void;
}

export const PreFillForm: React.FC<PreFillFormProps> = ({ onSubmit }) => {
  const [age, setAge] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const ageNumber = parseInt(age);
    if (isNaN(ageNumber) || ageNumber < 1 || ageNumber > 100) {
      return;
    }

    onSubmit({
      age: ageNumber,
    });
  };

  const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty string or valid numbers
    if (value === "" || /^\d{1,3}$/.test(value)) {
      setAge(value);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="max-w-md w-full m-4 space-y-8 bg-gray-800/90 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-gray-700/50 animate-fade-in">
        {/* Logo and Title */}
        <div className="text-center">
          <div className="flex items-center  justify-center mb-2 w-full gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white text-xl">
                {" "}
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" />
                  <path d="M2 17L12 22L22 17" />
                  <path d="M2 12L12 17L22 12" />
                </svg>
              </span>
            </div>
            <span className="text-white text-xl font-semibold">educasm</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Welcome to Educasm
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">
            Tap into Curiosity - Let's personalize your experience
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label
                htmlFor="age"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Your Age
              </label>
              <div className="relative">
                <input
                  id="age"
                  type="text"
                  value={age}
                  onChange={handleAgeChange}
                  placeholder="Enter your age"
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg
                    text-white placeholder-gray-400 focus:outline-none focus:ring-2 
                    focus:ring-primary focus:border-transparent transition-all duration-200"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={!age || parseInt(age) < 1 || parseInt(age) > 100}
              className="group relative w-full flex justify-center py-3 px-4 border 
                border-transparent text-sm sm:text-base font-medium rounded-lg text-white 
                bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 
                focus:ring-offset-2 focus:ring-primary disabled:opacity-50 
                disabled:cursor-not-allowed transition-all duration-200"
            >
              Start Exploring
            </button>
          </div>
        </form>

        {/* Footer Text */}
        <p className="mt-4 text-center text-xs sm:text-sm text-gray-400">
          We use this to provide age-appropriate explanations
        </p>
      </div>
    </div>
  );
};
