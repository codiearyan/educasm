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
import { v4 as uuidv4 } from 'uuid';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  id: string;
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
  timestamp: number;
}

interface ChatThread {
  id: string;
  title: string;
  messages: Message[];
  lastUpdated: number;
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
  const [chatThreads, setChatThreads] = useState<ChatThread[]>([]);
  const [currentThreadId, setCurrentThreadId] = useState<string>('');

  const scrollToTop = useCallback((force: boolean = false) => {
    if (force) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }

      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }, 100);
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      const scrollHeight = messagesContainerRef.current.scrollHeight;
      messagesContainerRef.current.scrollTo({ 
        top: scrollHeight,
        behavior: 'smooth'
      });
    }
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

  const createNewThread = useCallback((query: string) => {
    const threadId = uuidv4();
    const newThread: ChatThread = {
      id: threadId,
      title: query,
      messages: [],
      lastUpdated: Date.now(),
    };
    
    setChatThreads(prev => [newThread, ...prev]);
    setCurrentThreadId(threadId);
    return threadId;
  }, []);

  const updateThread = useCallback((threadId: string, messages: Message[]) => {
    setChatThreads(prev => prev.map(thread => {
      if (thread.id === threadId) {
        return {
          ...thread,
          messages,
          lastUpdated: Date.now(),
        };
      }
      return thread;
    }));
  }, []);

  const loadThread = useCallback((threadId: string) => {
    const thread = chatThreads.find(t => t.id === threadId);
    if (thread) {
      setMessages(thread.messages);
      setCurrentThreadId(threadId);
      setShowInitialSearch(false);
    }
  }, [chatThreads]);

  const handleSearch = useCallback(async (query: string, isFollowUp: boolean = false) => {
    try {
      if (window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }

      if (!isFollowUp) {
        scrollToTop(true);
      }

      setIsLoading(true);
      
      const threadId = currentThreadId || createNewThread(query);
      
      const newMessage: Message = { 
        id: uuidv4(),
        type: 'user',
        content: query,
        timestamp: Date.now()
      };

      const aiMessage: Message = { 
        id: uuidv4(),
        type: 'ai',
        content: '',
        topics: [],
        questions: [],
        timestamp: Date.now()
      };

      const currentMessages = isFollowUp ? messages : [];
      const updatedMessages = [...currentMessages, newMessage, aiMessage];
      
      setMessages(updatedMessages);
      updateThread(threadId, updatedMessages);

      const response = await fetch('/api/explore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          query,
          userContext,
          threadId,
          previousMessages: updatedMessages.slice(0, -1)
        }),
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

          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split('\n').filter(Boolean);

          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage.type === 'ai') {
                  newMessages[newMessages.length - 1] = {
                    ...lastMessage,
                    content: data.text || lastMessage.content,
                    topics: data.topics || lastMessage.topics,
                    questions: data.questions || lastMessage.questions,
                  };
                }
                return newMessages;
              });
            } catch (error) {
              console.error('Error parsing chunk:', error);
            }
          }
        }
      } finally {
        reader.releaseLock();
        setIsLoading(false);
      }

      if (isFollowUp) {
        scrollToBottom();
      }

    } catch (error) {
      console.error('Search error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load content');
      setIsLoading(false);
    }
  }, [currentThreadId, messages, createNewThread, updateThread, scrollToTop, userContext]);

  const handleRelatedQueryClick = useCallback((query: string, isQuestion: boolean = false) => {
    handleSearch(query, true);
  }, [handleSearch]);

  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  useEffect(() => {
    const savedThreads = localStorage.getItem('chatThreads');
    if (savedThreads) {
      const threads = JSON.parse(savedThreads);
      setChatThreads(threads);
      
      if (currentThreadId) {
        const currentThread = threads.find((t: ChatThread) => t.id === currentThreadId);
        if (currentThread) {
          setMessages(currentThread.messages || []);
          setShowInitialSearch(false);
        }
      }
    }
  }, [currentThreadId]);

  useEffect(() => {
    if (chatThreads.length > 0) {
      localStorage.setItem('chatThreads', JSON.stringify(chatThreads));
    }
  }, [chatThreads]);

  useEffect(() => {
    if (currentThreadId) {
      const currentThread = chatThreads.find(t => t.id === currentThreadId);
      if (currentThread) {
        setMessages(currentThread.messages || []);
      }
    }
  }, [currentThreadId, chatThreads]);

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] flex">
      <div className="hidden md:flex flex-col w-64 border-r border-gray-800 bg-background">
        <div className="p-4 border-b border-gray-800">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => {
              setMessages([]);
              setShowInitialSearch(true);
              setCurrentThreadId('');
            }}
          >
            New Chat
          </Button>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-2">
            {chatThreads.map((thread) => (
              <button
                key={thread.id}
                onClick={() => loadThread(thread.id)}
                className={cn(
                  "w-full px-3 py-2 text-left rounded-lg hover:bg-gray-800/50 transition-colors",
                  currentThreadId === thread.id && "bg-gray-800/50"
                )}
              >
                <p className="text-sm font-medium truncate">{thread.title}</p>
                <p className="text-xs text-gray-400">
                  {new Date(thread.lastUpdated).toLocaleDateString()}
                </p>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div className="flex-1 flex flex-col">
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
                                    onTopicClick={(query) => handleRelatedQueryClick(query, false)}
                                  />
                                </div>
                              )}

                              {isLoading ? (
                                <QuestionsSkeleton />
                              ) : message.questions && message.questions.length > 0 && (
                                <div className="mt-3">
                                  <RelatedQuestions
                                    questions={message.questions}
                                    onQuestionClick={(query) => handleRelatedQueryClick(query, true)}
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

            <div className="fixed z-50 bottom-40 left-0 right-0 bg-gradient-to-t from-background 
              via-background to-transparent pb-1 pt-2 ">
              <div className="w-full px-2 sm:px-4 max-w-3xl mx-auto">
                <SearchBar
                  onSearch={(query) => handleSearch(query, true)}
                  placeholder="Ask a follow-up question..."
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 