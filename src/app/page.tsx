'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SearchBar } from '@/components/shared/search-bar';
import { useUserContext } from '@/components/providers/user-provider';
import { toast } from 'react-hot-toast';

const SUGGESTED_TOPICS = [
  { name: 'Quantum Physics', icon: '⚛️', color: 'bg-purple-500/20 text-purple-400' },
  { name: 'Machine Learning', icon: '🤖', color: 'bg-blue-500/20 text-blue-400' },
  { name: 'World History', icon: '🌍', color: 'bg-green-500/20 text-green-400' },
];

export default function Home() {
  const router = useRouter();
  const { userContext } = useUserContext();
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = (query: string) => {
    if (!query.trim()) return;
    
    if (!userContext?.age) {
      toast.error('Please complete your profile first');
      return;
    }

    router.push(`/explore?q=${encodeURIComponent(query)}`);
  };

  const handleTopicClick = (topic: string) => {
    handleSearch(topic);
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 animate-fade-in">
      <div className="w-full max-w-3xl space-y-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-center text-white mb-8">
          What do you want to explore?
        </h1>

        <div className="space-y-2">
          <SearchBar
            onSearch={handleSearch}
            placeholder="Enter what you want to explore..."
          />
          <p className="text-sm text-gray-400 text-center">
            Press Enter to search
          </p>
        </div>

        <div className="flex flex-col items-center space-y-3">
          <p className="text-sm text-gray-400">Try:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {SUGGESTED_TOPICS.map((topic) => (
              <button
                key={topic.name}
                onClick={() => handleTopicClick(topic.name)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full 
                  ${topic.color} transition-all hover:opacity-80`}
              >
                <span>{topic.icon}</span>
                <span>{topic.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
