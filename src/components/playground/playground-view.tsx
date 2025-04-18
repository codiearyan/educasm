'use client';

import { useState, useEffect, useCallback, useRef } from "react";
import { SearchBar } from "@/components/shared/search-bar";
import { LoadingAnimation } from "@/components/shared/loading-animation";
import { Trophy, Timer, Target, Award, Pause, Play, CheckCircle, XCircle, Lightbulb } from "lucide-react";
import { useRouter } from "next/navigation";

interface Question {
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: {
    correct: string;
    key_point: string;
  };
  difficulty?: number;
}

interface UserContext {
  age?: number;
  education_level?: string;
  interests?: string[];
}

interface PlaygroundViewProps {
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
  userContext: UserContext;
}

interface Stats {
  questions: number;
  accuracy: number;
  streak: number;
  bestStreak: number;
  avgTime: number;
}

interface TopicProgress {
  totalAttempts: number;
  successRate: number;
  averageTime: number;
  lastLevel: number;
  masteryScore: number;
}

export const PlaygroundView = ({
  onError,
  onSuccess,
  userContext
}: PlaygroundViewProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentQuestionTime, setCurrentQuestionTime] = useState<number>(0);
  const [timerInterval, setTimerInterval] = useState<ReturnType<typeof setInterval> | null>(null);
  const [nextQuestionCountdown, setNextQuestionCountdown] = useState<number | null>(null);
  const [preloadedQuestion, setPreloadedQuestion] = useState<Question | null>(null);
  const [shouldShowNext, setShouldShowNext] = useState(false);

  const [sessionStats, setSessionStats] = useState({
    totalQuestions: 0,
    sessionLimit: 25,
    isSessionComplete: false,
  });

  const [stats, setStats] = useState<Stats>({
    questions: 0,
    accuracy: 0,
    streak: 0,
    bestStreak: 0,
    avgTime: 0,
  });

  const [topicProgress, setTopicProgress] = useState<TopicProgress>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`topic-progress-${query}`);
      return saved ? JSON.parse(saved) : {
        totalAttempts: 0,
        successRate: 0,
        averageTime: 0,
        lastLevel: 1,
        masteryScore: 0,
      };
    }
    return {
      totalAttempts: 0,
      successRate: 0,
      averageTime: 0,
      lastLevel: 1,
      masteryScore: 0,
    };
  });

  const [countdownInterval, setCountdownInterval] = useState<NodeJS.Timeout | null>(null);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [lastPerformance, setLastPerformance] = useState<{
    timeTaken: number;
    wasCorrect: boolean;
    previousLevel: number;
  } | null>(null);

  const [questionHistory, setQuestionHistory] = useState<string[]>([]);

  const COUNTDOWN_DURATION = 5;

  const fetchNewQuestion = async () => {
    if (!query) return;

    if (sessionStats.totalQuestions >= sessionStats.sessionLimit) {
      setSessionStats((prev) => ({ ...prev, isSessionComplete: true }));
      stopQuestionTimer();
      onSuccess("Congratulations! You've completed your practice session! 🎉");
      return;
    }

    try {
      const response = await fetch('/api/playground', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          topic: query, 
          level: currentLevel, 
          userContext,
          performance: lastPerformance,
          questionHistory
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch question');
      }

      const question = await response.json();
      setPreloadedQuestion(question);
    } catch (error) {
      console.error("Error fetching question:", error);
      onError("Failed to generate question. Please try again.");
    }
  };

  const updateStats = useCallback((isCorrect: boolean): void => {
    setStats((prev) => {
      const newQuestions = prev.questions + 1;
      const newAccuracy = (prev.accuracy * prev.questions + (isCorrect ? 100 : 0)) / newQuestions;
      const newStreak = isCorrect ? prev.streak + 1 : 0;
      
      return {
        questions: newQuestions,
        accuracy: newAccuracy,
        streak: newStreak,
        bestStreak: Math.max(prev.bestStreak, newStreak),
        avgTime: (prev.avgTime * prev.questions + currentQuestionTime) / newQuestions,
      };
    });
  }, [currentQuestionTime]);

  const startQuestionTimer = useCallback(() => {
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    
    const interval = setInterval(() => {
      setCurrentQuestionTime(prev => prev + 1);
    }, 1000);
    setTimerInterval(interval);
  }, []);

  const stopQuestionTimer = useCallback(() => {
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
  }, [timerInterval]);

  const startCountdown = useCallback(() => {
    if (isPaused) return;

    // Clear any existing countdown
    if (countdownInterval) {
      clearInterval(countdownInterval);
      setCountdownInterval(null);
    }

    setNextQuestionCountdown(COUNTDOWN_DURATION);
    
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsedTime = (Date.now() - startTime) / 1000;
      const remainingTime = COUNTDOWN_DURATION - elapsedTime;
      
      if (remainingTime <= 0) {
        clearInterval(interval);
        setCountdownInterval(null);
        setNextQuestionCountdown(null);
        setShouldShowNext(true);
      } else {
        setNextQuestionCountdown(Math.max(0, Number(remainingTime.toFixed(1))));
      }
    }, 100);

    setCountdownInterval(interval);
  }, [isPaused, countdownInterval]);

  const stopCountdown = useCallback(() => {
    if (countdownInterval) {
      clearInterval(countdownInterval);
      setCountdownInterval(null);
      setNextQuestionCountdown(null);
      setShouldShowNext(false);
    }
  }, [countdownInterval]);

  const togglePause = useCallback(() => {
    setIsPaused(prev => {
      if (!prev) { // If we're pausing
        stopQuestionTimer();
        stopCountdown();
      }
      return !prev;
    });
  }, [stopQuestionTimer, stopCountdown]);

  const handleAnswer = useCallback((index: number) => {
    if (selectedAnswer !== null || !currentQuestion || isPaused) return;
    
    setSelectedAnswer(index);
    setShowExplanation(true);
    stopQuestionTimer();
    const isCorrect = index === currentQuestion.correctAnswer;
    updateStats(isCorrect);
    
    setLastPerformance({
      timeTaken: currentQuestionTime,
      wasCorrect: isCorrect,
      previousLevel: currentLevel
    });
    
    if (!isPaused) {
      setPreloadedQuestion(null);
      fetchNewQuestion();
      stopCountdown(); // Stop any existing countdown
      startCountdown(); // Start a new countdown
    }
  }, [
    currentQuestion,
    isPaused,
    selectedAnswer,
    stopQuestionTimer,
    updateStats,
    fetchNewQuestion,
    startCountdown,
    stopCountdown,
    currentQuestionTime,
    currentLevel
  ]);

  const handleSearch = async (newQuery: string) => {
    try {
      if (!newQuery.trim()) return;
      
      if (!userContext?.age) {
        onError('Please complete your profile first');
        return;
      }

      setIsLoading(true);
      setCurrentQuestion(null);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setQuery(newQuery);
      setCurrentLevel(1);
      setLastPerformance(null);
      // Reset question history for new topic
      setQuestionHistory([]);

      const response = await fetch('/api/playground', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          topic: newQuery, 
          level: 1, 
          userContext,
          questionHistory: []
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch question');
      }

      const firstQuestion = await response.json();
      setCurrentQuestion(firstQuestion);
      setSelectedAnswer(null);
      setCurrentQuestionTime(0);
      startQuestionTimer();

      const isSameTopic = newQuery === query;
      if (!isSameTopic) {
        setStats({
          questions: 0,
          accuracy: 0,
          streak: 0,
          bestStreak: 0,
          avgTime: 0,
        });
        setSessionStats({
          totalQuestions: 0,
          sessionLimit: 25,
          isSessionComplete: false,
        });
      }
    } catch (error) {
      console.error("Search error:", error);
      onError("Failed to start practice session");
    } finally {
      setIsLoading(false);
    }
  };

  // Single effect to manage timers based on state
  useEffect(() => {
    if (!isPaused && currentQuestion) {
      if (selectedAnswer === null) {
        if (!timerInterval) {
          startQuestionTimer();
        }
      } else if (showExplanation && !sessionStats.isSessionComplete) {
        if (!countdownInterval) {
          startCountdown();
        }
      }
    }

    // Cleanup function
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    };
  }, [
    isPaused,
    currentQuestion,
    selectedAnswer,
    showExplanation,
    sessionStats.isSessionComplete,
    timerInterval,
    countdownInterval,
    startQuestionTimer,
    startCountdown
  ]);

  useEffect(() => {
    if (shouldShowNext && preloadedQuestion && !isPaused) {
      stopCountdown();
      setCurrentQuestion(preloadedQuestion);
      if (preloadedQuestion.text) {
        setQuestionHistory(prev => [...prev, preloadedQuestion.text]);
      }
      if (preloadedQuestion.difficulty) {
        setCurrentLevel(preloadedQuestion.difficulty);
      }
      setPreloadedQuestion(null);
      setShouldShowNext(false);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setCurrentQuestionTime(0);
      startQuestionTimer();
      setSessionStats(prev => ({
        ...prev,
        totalQuestions: prev.totalQuestions + 1
      }));
    }
  }, [shouldShowNext, preloadedQuestion, isPaused, stopCountdown, startQuestionTimer]);

  const formatAccuracy = (accuracy: number): number => {
    return Math.round(accuracy);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingAnimation />
      </div>
    );
  }

  return (
    <div className="w-full">
      {!currentQuestion || sessionStats.isSessionComplete ? (
        <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 animate-fade-in">
          <div className="w-full max-w-3xl space-y-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-center text-white mb-8">
              What do you want to practice?
            </h1>
            
            <div className="space-y-2">
              <SearchBar
                onSearch={handleSearch}
                placeholder="Enter what you want to practice..."
              />
              <p className="text-sm text-gray-400 text-center">
                Press Enter to search
              </p>
            </div>

            <div className="flex flex-col items-center space-y-3">
              <p className="text-sm text-gray-400">Try:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  onClick={() => handleSearch("Quantum Physics")}
                  className="flex items-center gap-2 px-4 py-2 rounded-full 
                    bg-purple-500/20 text-purple-400 transition-all hover:opacity-80"
                >
                  <span>⚛️</span>
                  <span>Quantum Physics</span>
                </button>
                <button
                  onClick={() => handleSearch("Machine Learning")}
                  className="flex items-center gap-2 px-4 py-2 rounded-full 
                    bg-blue-500/20 text-blue-400 transition-all hover:opacity-80"
                >
                  <span>🤖</span>
                  <span>Machine Learning</span>
                </button>
                <button
                  onClick={() => handleSearch("World History")}
                  className="flex items-center gap-2 px-4 py-2 rounded-full 
                    bg-green-500/20 text-green-400 transition-all hover:opacity-80"
                >
                  <span>🌍</span>
                  <span>World History</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-3xl mx-auto px-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-2">
            <div className="card">
              <div className="flex items-center gap-2 text-primary">
                <Trophy className="w-5 h-5" />
                <span className="text-sm font-medium">Score</span>
              </div>
              <div className="mt-1 text-xl font-semibold">
                {formatAccuracy(stats.accuracy)}%
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <span className="stats-value text-xs sm:text-base text-primary">
                  {stats.questions}
                </span>
                <Target className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <span className="stats-label text-xs sm:text-sm">Questions</span>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <span className="stats-value text-yellow-500">
                  {stats.streak}
                </span>
                <Award className="w-5 h-5 text-yellow-500" />
              </div>
              <span className="stats-label">Streak</span>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <span className="stats-value text-purple-500">
                  {currentQuestionTime}s
                </span>
                <Timer className="w-5 h-5 text-purple-500" />
              </div>
              <span className="stats-label">Time</span>
            </div>
          </div>

          <div className="card flex-1 flex flex-col mt-4">
            <div className="flex justify-between items-start">
              <h2 className="text-xs sm:text-base font-medium leading-relaxed 
                text-gray-200 max-w-3xl whitespace-pre-line tracking-wide">
                {currentQuestion?.text}
              </h2>
              <button
                onClick={togglePause}
                className="p-2 rounded-lg hover:bg-gray-800 transition-colors flex-shrink-0"
              >
                {isPaused ? (
                  <Play className="w-5 h-5 text-primary" />
                ) : (
                  <Pause className="w-5 h-5 text-primary" />
                )}
              </button>
            </div>

            <div className="space-y-2">
              {currentQuestion?.options?.map((option: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  disabled={selectedAnswer !== null}
                  className={`w-full text-left px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg 
                    text-xs sm:text-sm leading-relaxed ${
                      selectedAnswer === null
                        ? "bg-card hover:bg-gray-600"
                        : idx === currentQuestion.correctAnswer
                        ? "bg-green-500/20 text-green-500"
                        : selectedAnswer === idx
                        ? "bg-red-500/20 text-red-500"
                        : "bg-card"
                    }`}
                >
                  <span className="inline-block w-5 sm:w-6 font-medium">
                    {String.fromCharCode(65 + idx)}.
                  </span>
                  {option}
                </button>
              ))}
            </div>

            {showExplanation && (
              <div className="mt-3 space-y-2 text-sm">
                {!isPaused && nextQuestionCountdown !== null && (
                  <div className="mb-2">
                    <div className="relative h-1 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 bg-primary transition-all duration-100"
                        style={{
                          width: `${(nextQuestionCountdown / COUNTDOWN_DURATION) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="mt-1 text-xs text-gray-400 text-center">
                      Next question in {nextQuestionCountdown.toFixed(0)}s
                    </div>
                  </div>
                )}

                <div className={`px-3 py-2 rounded-lg ${
                  selectedAnswer === currentQuestion.correctAnswer
                    ? "bg-green-500/20 text-green-500"
                    : "bg-red-500/20 text-red-500"
                }`}>
                  <div className="flex items-start gap-2">
                    <div className={`p-1 rounded-full ${
                      selectedAnswer === currentQuestion.correctAnswer
                        ? "bg-green-500/20"
                        : "bg-red-500/20"
                    }`}>
                      {selectedAnswer === currentQuestion.correctAnswer ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        {selectedAnswer === currentQuestion.correctAnswer
                          ? "Correct!"
                          : `Incorrect. The right answer is ${String.fromCharCode(65 + currentQuestion.correctAnswer)}`}
                      </p>
                      <p className="text-xs mt-1 opacity-90">
                        {currentQuestion.explanation.correct}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-blue-400" />
                    <p className="text-xs text-blue-400">
                      {currentQuestion.explanation.key_point}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}; 