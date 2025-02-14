'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loading } from '@/components/shared/loading';
import { useApi } from '@/hooks/useApi';
import { Question } from '@/types';
import { Trophy, Timer, Target, Award, Pause, Play, CheckCircle, XCircle } from 'lucide-react';
import { useUserContext } from '@/components/providers/user-provider';
import { toast } from 'react-hot-toast';

interface Stats {
  questions: number;
  accuracy: number;
  streak: number;
  bestStreak: number;
  avgTime: number;
}

export default function PracticeSession() {
  const searchParams = useSearchParams();
  const topic = searchParams.get('topic');
  const { getQuestion, isLoading } = useApi();
  const { userContext } = useUserContext();
  
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentQuestionTime, setCurrentQuestionTime] = useState<number>(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);

  const [stats, setStats] = useState<Stats>({
    questions: 0,
    accuracy: 0,
    streak: 0,
    bestStreak: 0,
    avgTime: 0,
  });

  const startQuestionTimer = () => {
    if (timerInterval) clearInterval(timerInterval);
    const interval = setInterval(() => {
      setCurrentQuestionTime((prev) => prev + 1);
    }, 1000);
    setTimerInterval(interval);
  };

  const stopQuestionTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
  };

  const fetchNewQuestion = async () => {
    if (!topic || !userContext) return;

    try {
      const question = await getQuestion(topic, 1, userContext);
      setCurrentQuestion(question);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setCurrentQuestionTime(0);
      startQuestionTimer();
    } catch (error) {
      console.error('Error fetching question:', error);
      toast.error('Failed to fetch question');
    }
  };

  const updateStats = (isCorrect: boolean) => {
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
  };

  const handleAnswer = async (index: number) => {
    if (selectedAnswer !== null || !currentQuestion) return;
    
    setSelectedAnswer(index);
    setShowExplanation(true);
    stopQuestionTimer();
    updateStats(index === currentQuestion.correctAnswer);
    
    if (!isPaused) {
      setTimeout(fetchNewQuestion, 3000);
    }
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  useEffect(() => {
    fetchNewQuestion();
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [topic]);

  if (!topic) {
    return <div>No topic selected</div>;
  }

  if (isLoading && !currentQuestion) {
    return <Loading />;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in">
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span className="stats-value">{Math.round(stats.accuracy)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <Timer className="w-5 h-5 text-blue-500" />
              <span className="stats-value">{Math.round(stats.avgTime)}s</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-green-500" />
              <span className="stats-value">{stats.streak}</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-500" />
              <span className="stats-value">{stats.bestStreak}</span>
            </div>
          </div>
          <button
            onClick={togglePause}
            className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            {isPaused ? (
              <Play className="w-5 h-5" />
            ) : (
              <Pause className="w-5 h-5" />
            )}
          </button>
        </div>

        {currentQuestion && (
          <div className="question-card animate-slide-up">
            <h2 className="text-xl font-medium mb-4">{currentQuestion.text}</h2>
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(index)}
                  disabled={selectedAnswer !== null}
                  className={`option-button ${
                    selectedAnswer === null
                      ? 'bg-gray-700 hover:bg-gray-600'
                      : selectedAnswer === index
                      ? index === currentQuestion.correctAnswer
                        ? 'correct'
                        : 'incorrect'
                      : index === currentQuestion.correctAnswer
                      ? 'correct'
                      : 'bg-gray-700'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>

            {showExplanation && (
              <div className="mt-6 p-4 bg-gray-700 rounded-lg animate-fade-in">
                <div className="flex items-start gap-2 mb-2">
                  {selectedAnswer === currentQuestion.correctAnswer ? (
                    <CheckCircle className="w-5 h-5 text-green-500 mt-1" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500 mt-1" />
                  )}
                  <p>{currentQuestion.explanation.correct}</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-yellow-500">★</span>
                  <p>{currentQuestion.explanation.key_point}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 