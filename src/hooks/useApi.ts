import { useState } from 'react';
import { Question, UserContext, ExploreResponse } from '@/types';

export const useApi = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getExploreContent = async (
    query: string,
    userContext: UserContext
  ): Promise<ExploreResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/explore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, userContext }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch explore content');
      }

      const data = await response.json();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getQuestion = async (
    topic: string,
    level: number,
    userContext: UserContext
  ): Promise<Question> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/playground', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic, level, userContext }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch question');
      }

      const data = await response.json();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    getExploreContent,
    getQuestion,
    isLoading,
    error,
  };
}; 