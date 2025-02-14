'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { SearchBar } from '@/components/shared/search-bar';
import { LoadingAnimation } from '@/components/shared/loading-animation';
import { TopicsSkeleton, QuestionsSkeleton } from '@/components/shared/skeleton';
import { RelatedTopics } from '@/components/explore/related-topics';
import { RelatedQuestions } from '@/components/explore/related-questions';
import { useUserContext } from '@/components/providers/user-provider';
import { toast } from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface Message {
  type: 'user' | 'ai';
  content?: string;
  topics?: Array<{
    topic: string;
    type: string;
    reason: string;
  }>;
  questions?: Array<{
    question: string;
    type: string;
    context: string;
  }>;
}

const MarkdownComponents = {
  h1: ({ children, ...props }: any) => (
    <h1 className="text-xl sm:text-2xl font-bold text-gray-100 mt-4 mb-2" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }: any) => (
    <h2 className="text-lg sm:text-xl font-semibold text-gray-100 mt-3 mb-2" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: any) => (
    <h3 className="text-base sm:text-lg font-medium text-gray-200 mt-2 mb-1" {...props}>
      {children}
    </h3>
  ),
  p: ({ children, ...props }: any) => (
    <p className="text-sm sm:text-base text-gray-300 my-1.5 leading-relaxed 
      break-words" {...props}>
      {children}
    </p>
  ),
  ul: ({ children, ...props }: any) => (
    <ul className="list-disc list-inside my-2 text-gray-300" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: any) => (
    <ol className="list-decimal list-inside my-2 text-gray-300" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }: any) => (
    <li className="my-1 text-gray-300" {...props}>
      {children}
    </li>
  ),
  code: ({ children, inline, ...props }: any) => (
    inline ? 
      <code className="bg-gray-700 px-1 rounded text-xs sm:text-sm" {...props}>{children}</code> :
      <code className="block bg-gray-700 p-2 rounded my-2 text-xs sm:text-sm overflow-x-auto" {...props}>
        {children}
      </code>
  ),
  blockquote: ({ children, ...props }: any) => (
    <blockquote className="border-l-4 border-gray-500 pl-4 my-2 text-gray-400 italic" {...props}>
      {children}
    </blockquote>
  ),
};

export default function ExplorePage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q');
  const [messages, setMessages] = useState<Message[]>([]);
  const [showInitialSearch, setShowInitialSearch] = useState(!initialQuery);
  const [isLoading, setIsLoading] = useState(false);
  const { userContext } = useUserContext();
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }

    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }, 100);
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToTop();
    }
  }, [messages.length, scrollToTop]);

  useEffect(() => {
    const handleReset = () => {
      setMessages([]);
      setShowInitialSearch(true);
    };

    window.addEventListener('resetExplore', handleReset);
    return () => window.removeEventListener('resetExplore', handleReset);
  }, []);

  const handleSearch = async (query: string) => {
    try {
      if (window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }

      scrollToTop();
      setIsLoading(true);
      
      // Initialize messages with empty AI content
      setMessages([
        { type: 'user', content: query },
        { type: 'ai', content: '', topics: [], questions: [] }
      ]);

      setShowInitialSearch(false);

      const response = await fetch('/api/explore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, userContext }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch content');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response stream available');
      }

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Convert the chunk to text
          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split('\n').filter(Boolean);

          // Process each line as a separate JSON object
          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              setMessages(prev => [
                prev[0],
                {
                  type: 'ai',
                  content: data.text || prev[1].content,
                  topics: data.topics || prev[1].topics,
                  questions: data.questions || prev[1].questions
                }
              ]);
            } catch (error) {
              console.error('Error parsing chunk:', error);
            }
          }
        }
      } finally {
        reader.releaseLock();
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load content');
      setIsLoading(false);
    }
  };

  const handleRelatedQueryClick = useCallback((query: string) => {
    handleSearch(query);
  }, []);

  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] flex flex-col">
      {showInitialSearch ? (
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-center mb-4">
            What do you want to explore?
          </h1>
          
          <div className="w-full max-w-xl mx-auto">
            <SearchBar
              onSearch={handleSearch}
              placeholder="Enter what you want to explore..."
            />
            
            <p className="text-sm text-gray-400 text-center mt-1">Press Enter to search</p>
            
            <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
              <span className="text-sm text-gray-400">Try:</span>
              <button
                onClick={() => handleSearch("Quantum Physics")}
                className="px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 
                  border border-purple-500/30 transition-colors text-xs sm:text-sm text-purple-300"
              >
                ⚛️ Quantum Physics
              </button>
              <button
                onClick={() => handleSearch("Machine Learning")}
                className="px-3 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 
                  border border-blue-500/30 transition-colors text-xs sm:text-sm text-blue-300"
              >
                🤖 Machine Learning
              </button>
              <button
                onClick={() => handleSearch("World History")}
                className="px-3 py-1.5 rounded-lg bg-green-500/20 hover:bg-green-500/30 
                  border border-green-500/30 transition-colors text-xs sm:text-sm text-green-300"
              >
                🌍 World History
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div ref={messagesContainerRef} className="relative flex flex-col w-full">
          <div className="space-y-2 pb-16">
            {messages.map((message, index) => (
              <div 
                key={index} 
                className="px-2 sm:px-4 w-full mx-auto"
              >
                <div className="max-w-3xl mx-auto">
                  {message.type === 'user' ? (
                    <div className="w-full">
                      <div className="flex-1 text-base sm:text-lg font-semibold text-gray-100">
                        {message.content}
                      </div>
                    </div>
                  ) : (
                    <div className="w-full">
                      <div className="flex-1 min-w-0">
                        {!message.content && isLoading ? (
                          <div className="flex items-center space-x-2 py-2">
                            <LoadingAnimation />
                            <span className="text-sm text-gray-400">Thinking...</span>
                          </div>
                        ) : message.content ? (
                          <>
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm, remarkMath]}
                              rehypePlugins={[rehypeKatex]}
                              components={MarkdownComponents}
                              className="whitespace-pre-wrap break-words space-y-1.5"
                            >
                              {message.content}
                            </ReactMarkdown>

                            {isLoading ? (
                              <TopicsSkeleton />
                            ) : message.topics && message.topics.length > 0 && (
                              <div className="mt-3">
                                <RelatedTopics
                                  topics={message.topics}
                                  onTopicClick={handleRelatedQueryClick}
                                />
                              </div>
                            )}

                            {isLoading ? (
                              <QuestionsSkeleton />
                            ) : message.questions && message.questions.length > 0 && (
                              <div className="mt-3">
                                <RelatedQuestions
                                  questions={message.questions}
                                  onQuestionClick={handleRelatedQueryClick}
                                />
                              </div>
                            )}
                          </>
                        ) : null}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="fixed bottom-12 left-0 right-0 bg-gradient-to-t from-background 
            via-background to-transparent pb-1 pt-2 z-50">
            <div className="w-full px-2 sm:px-4 max-w-3xl mx-auto">
              <SearchBar
                onSearch={handleSearch} 
                placeholder="Ask a follow-up question..."
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 