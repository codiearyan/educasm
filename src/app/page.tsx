'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
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

const SUGGESTED_TOPICS = [
  { name: 'Quantum Physics', icon: '⚛️', color: 'bg-purple-500/20 text-purple-400' },
  { name: 'Machine Learning', icon: '🤖', color: 'bg-blue-500/20 text-blue-400' },
  { name: 'World History', icon: '🌍', color: 'bg-green-500/20 text-green-400' },
];

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
    <p className="text-sm sm:text-base text-gray-300 my-1.5 leading-relaxed break-words" {...props}>
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

export default function HomePage() {
  const { userContext } = useUserContext();
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showInitialSearch, setShowInitialSearch] = useState(true);
  const [chatThreads, setChatThreads] = useState<ChatThread[]>([]);
  const [currentThreadId, setCurrentThreadId] = useState<string>('');
  const messagesContainerRef = useRef<HTMLDivElement>(null);

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
      if (!query.trim()) return;
      
      if (!userContext?.age) {
        toast.error('Please complete your profile first');
        return;
      }

      if (window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }

      if (!isFollowUp) {
        scrollToTop(true);
      }

      setIsLoading(true);
      setShowInitialSearch(false);
      
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
        const errorData = await response.json();
        
        setMessages(prev => prev.slice(0, -2));
        updateThread(threadId, updatedMessages.slice(0, -2));

        if (response.status === 429) {
          // Rate limit error
          const resetTime = new Date(errorData.resetAt);
          const timeUntilReset = Math.ceil((resetTime.getTime() - Date.now()) / 1000);
          
          let timeMessage = '';
          if (timeUntilReset < 60) {
            timeMessage = `${timeUntilReset} seconds`;
          } else if (timeUntilReset < 3600) {
            timeMessage = `${Math.ceil(timeUntilReset / 60)} minutes`;
          } else {
            timeMessage = `${Math.ceil(timeUntilReset / 3600)} hours`;
          }

          toast.error(
            <div className="flex flex-col gap-1">
              <span className="font-medium">Rate limit exceeded</span>
              <span className="text-sm">Please try again in {timeMessage}</span>
            </div>,
            { duration: 5000 }
          );
        } else {
          throw new Error(errorData.error || 'Failed to fetch content');
        }
        setIsLoading(false);
        return;
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
    const savedThreads = localStorage.getItem('chatThreads');
    if (savedThreads) {
      const threads = JSON.parse(savedThreads);
      setChatThreads(threads);
    }
  }, []);

  useEffect(() => {
    if (chatThreads.length > 0) {
      localStorage.setItem('chatThreads', JSON.stringify(chatThreads));
    }
  }, [chatThreads]);

  return (
    <div className="flex h-[calc(100vh-8rem)]">
      {/* Left Sidebar */}
      <div className="hidden md:flex flex-col w-64 min-w-64 border-r border-gray-800  overflow-hidden">
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

      {/* Right Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {showInitialSearch ? (
          <div className="flex-1 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-2xl space-y-8">
              <h1 className="text-3xl sm:text-4xl font-bold text-center text-white">
                What do you want to explore?
              </h1>
              
              <div className="space-y-2">
                <SearchBar
                  onSearch={(query) => handleSearch(query, false)}
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
                      onClick={() => handleSearch(topic.name, false)}
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
        ) : (
          <div className="relative flex-1 flex flex-col overflow-hidden">
            <ScrollArea 
              ref={messagesContainerRef} 
              className="flex-1 pb-[120px]"
            >
              <div className="max-w-2xl mx-auto p-4 space-y-6">
                {messages.map((message, index) => (
                  <div key={index} className="relative">
                    {index > 0 && (
                      <div className="w-full h-px bg-gray-800/60 my-6" />
                    )}
                    {message.type === 'user' ? (
                      <div className="w-full">
                        <div className="flex items-center gap-2 mb-2">
    
                          <div className="flex-1 text-base sm:text-lg font-semibold text-gray-100">
                            {message.content}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <span className="text-xs">📚</span>
                          </div>
                          <span className="text-sm text-gray-400">Answer</span>
                        </div>
                        <div className="flex-1 min-w-0 pl-8">
                          {!message.content && isLoading && index === messages.length - 1 ? (
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

                              {isLoading && index === messages.length - 1 ? (
                                <TopicsSkeleton />
                              ) : message.topics && message.topics.length > 0 && (
                                <div className="mt-6 mb-4">
                                  <h3 className="text-sm font-medium text-gray-400 mb-3">Related Topics</h3>
                                  <RelatedTopics
                                    topics={message.topics}
                                    onTopicClick={(query) => handleRelatedQueryClick(query, false)}
                                  />
                                </div>
                              )}

                              {isLoading && index === messages.length - 1 ? (
                                <QuestionsSkeleton />
                              ) : message.questions && message.questions.length > 0 && (
                                <div className="mt-6">
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
                ))}
              </div>
            </ScrollArea>

            <div className="absolute bottom-0 left-0 right-0 bg-transparent">
              <div className="max-w-2xl mx-auto px-4">
                <div className="border-t border-gray-800 w-full my-4" />
                <div className="pb-4">
                  <SearchBar
                    key={messages.length}
                    onSearch={(query) => handleSearch(query, true)}
                    placeholder="Ask a follow-up question..."
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
