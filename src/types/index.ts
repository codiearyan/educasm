export interface UserContext {
  age: number;
}

export interface Question {
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: {
    correct: string;
    key_point: string;
  };
  difficulty: number;
  topic: string;
}

export interface ExploreResponse {
  content: string;
  relatedTopics: Array<{
    topic: string;
    type: string;
    reason: string;
  }>;
  relatedQuestions: Array<{
    question: string;
    type: string;
    context: string;
  }>;
}

export interface MarkdownComponentProps {
  children: React.ReactNode;
  [key: string]: any;
} 