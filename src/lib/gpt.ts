import OpenAI from 'openai';
import { Question, UserContext, ExploreResponse } from '../types';

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

interface QuestionPerformance {
  timeTaken: number;
  wasCorrect: boolean;
  previousLevel: number;
}

interface QuestionHistory {
  text: string;
  similarity: number;
}

export class GPTService {
  private openai: OpenAI;
  private static readonly SIMILARITY_THRESHOLD = 0.8;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set in environment variables');
    }
    
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  private async makeRequest(systemPrompt: string, userPrompt: string, maxTokens: number = 2000) {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { 
            role: 'system', 
            content: `${systemPrompt} Provide your response in JSON format.` 
          },
          { 
            role: 'user', 
            content: userPrompt 
          }
        ],
        temperature: 0.7,
        max_tokens: maxTokens,
        response_format: { type: "json_object" }
      });

      return response.choices[0].message?.content || '';
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw new Error('Failed to generate content');
    }
  }

  async getExploreContent(query: string, userContext: UserContext): Promise<ExploreResponse> {
    try {
      const systemPrompt = `You are a Gen-Z tutor who explains complex topics concisely considering you are teaching someone with a low IQ.
        First, identify the domain of the topic from these categories:
        - SCIENCE: Physics, Chemistry, Biology
        - MATHEMATICS: Algebra, Calculus, Geometry
        - TECHNOLOGY: Computer Science, AI, Robotics
        - MEDICAL: Anatomy, Healthcare, Medicine
        - HISTORY: World History, Civilizations
        - BUSINESS: Economics, Finance, Marketing
        - LAW: Legal Systems, Rights
        - PSYCHOLOGY: Human Behavior, Development
        - CURRENT_AFFAIRS: Global Events, Politics
        - GENERAL: Any other topic

        Return your response in this EXACT JSON format:
        {
          "domain": "identified domain",
          "content": {
            "paragraph1": "Core concept in around 20-30 words - clear, simple, story-telling based introduction and definition",
            "paragraph2": "talk more detail about it in around 20-30 words - main ideas and examples",
            "paragraph3": "Real world applications in around 20-40 words - practical uses and relevance"
          },
          "relatedTopics": [
            {
              "topic": "Most fundamental prerequisite concept",
              "type": "prerequisite",
              "reason": "Brief explanation of why this is essential to understand first"
            },
            {
              "topic": "Most exciting advanced application",
              "type": "extension",
              "reason": "Why this advanced topic is fascinating"
            },
            {
              "topic": "Most impactful real-world use",
              "type": "application",
              "reason": "How this changes everyday life"
            },
            {
              "topic": "Most interesting related concept",
              "type": "parallel",
              "reason": "What makes this connection intriguing"
            },
            {
              "topic": "Most thought-provoking aspect",
              "type": "deeper",
              "reason": "Why this specific aspect is mind-bending"
            }
          ],
          "relatedQuestions": [
            {
              "question": "What if...? (speculative question)",
              "type": "curiosity",
              "context": "Thought-provoking scenario"
            },
            {
              "question": "How exactly...? (mechanism question)",
              "type": "mechanism",
              "context": "Fascinating process to understand"
            },
            {
              "question": "Why does...? (causality question)",
              "type": "causality",
              "context": "Surprising cause-effect relationship"
            },
            {
              "question": "Can we...? (possibility question)",
              "type": "innovation",
              "context": "Exciting potential development"
            },
            {
              "question": "What's the connection between...? (insight question)",
              "type": "insight",
              "context": "Unexpected relationship"
            }
          ]
        }`;

      const userPrompt = `Explain "${query}" in approximately three 20-30 word paragraphs:
        1. Basic definition without using words like imagine
        2. more details
        3. Real-world application examples without using the word real world application
        Make it engaging for someone aged ${userContext.age}.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { 
            role: 'system', 
            content: `${systemPrompt} Provide your response in JSON format.` 
          },
          { 
            role: 'user', 
            content: userPrompt 
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message?.content;
      
      if (!content) {
        throw new Error('Empty response from GPT');
      }

      const parsedContent = JSON.parse(content);

      // Validate the response structure
      if (!parsedContent.domain || !parsedContent.content || 
          !parsedContent.content.paragraph1 || 
          !parsedContent.content.paragraph2 || 
          !parsedContent.content.paragraph3) {
        throw new Error('Invalid response structure');
      }

      // Combine paragraphs into content
      const formattedContent = [
        parsedContent.content.paragraph1,
        parsedContent.content.paragraph2,
        parsedContent.content.paragraph3
      ].join('\n\n');

      return {
        content: formattedContent,
        relatedTopics: parsedContent.relatedTopics || [],
        relatedQuestions: parsedContent.relatedQuestions || []
      };
    } catch (error) {
      console.error('Explore content error:', error);
      throw new Error('Failed to generate explore content');
    }
  }

  async streamExploreContent(
    query: string, 
    userContext: UserContext,
    onChunk: (content: { text?: string, topics?: any[], questions?: any[] }) => void,
    previousMessages?: Message[]
  ): Promise<void> {
    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        // Build context from previous messages
        const contextString = previousMessages?.map(msg => 
          `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
        ).join('\n') || '';

        const systemPrompt = `You are a Gen-Z tutor who explains complex topics concisely for a ${userContext.age} year old.
          ${contextString ? '\nPrevious conversation context:\n' + contextString + '\n\nContinue the conversation naturally.' : ''}
          First provide the explanation in plain text, then provide related content in a STRICT single-line JSON format.
          
          Structure your response exactly like this:
          
          <paragraph 1>

          <paragraph 2>

          <paragraph 3>

          ---
          {"topics":[{"name":"Topic Name","type":"prerequisite|extension|application|parallel|deeper","detail":"Why"}],"questions":[{"text":"Q?","type":"curiosity","detail":"Context"}]}

          RULES:
          - ADAPT CONTENT FOR ${userContext.age} YEAR OLD
          - Consider the previous context when providing new information
          - Topic types MUST be one of: prerequisite, extension, application, parallel, deeper
          - STRICT LENGTH LIMITS:
            * Each paragraph around 20-25 words
            * Related questions maximum 12 words each
            * Topic details 1-2 words each
          - Keep paragraphs clear and simple
          - Use "---" as separator
          - JSON must be in a single line
          - No line breaks in JSON
          - MUST provide EXACTLY 5 related topics and 5 questions`;

        const userPrompt = `Explain "${query}" in three very concise paragraphs for a ${userContext.age} year old in genz style:
          1. Basic definition (15-20 words)
          2. Key details (15-20 words)
          3. Direct applications and facts (15-20 words)

          Then provide EXACTLY:
          - 5 related topics that help understand ${query} better (age-appropriate)
          - 5 mind-blowing questions (8-12 words each) that spark curiosity`;

        const stream = await this.openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          stream: true,
          temperature: 0.7
        });

        let mainContent = '';
        let jsonContent = '';
        let currentTopics: any[] = [];
        let currentQuestions: any[] = [];
        let isJsonSection = false;
        let buffer = '';

        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || '';
          buffer += content;
          
          if (buffer.includes('---')) {
            isJsonSection = true;
            const [textPart, jsonPart] = buffer.split('---');
            mainContent = textPart.trim();
            jsonContent = jsonPart ? jsonPart.trim() : '';
            buffer = jsonPart ? jsonPart.trim() : '';
            
            onChunk({ 
              text: mainContent,
              topics: currentTopics,
              questions: currentQuestions
            });
            continue;
          }

          if (isJsonSection) {
            // Only try to parse if we have a complete looking JSON object
            if (buffer.includes('{') && buffer.includes('}')) {
              try {
                // Extract everything between the first { and last }
                const jsonMatch = buffer.match(/{.*}/);
                if (jsonMatch) {
                  const jsonStr = jsonMatch[0];
                  const parsed = JSON.parse(jsonStr);

                  if (parsed.topics && Array.isArray(parsed.topics)) {
                    currentTopics = parsed.topics.map((topic: any) => ({
                      topic: topic.name,
                      type: topic.type.toLowerCase(),
                      reason: topic.detail
                    }));
                  }

                  if (parsed.questions && Array.isArray(parsed.questions)) {
                    currentQuestions = parsed.questions.map((question: any) => ({
                      question: question.text,
                      type: question.type,
                      context: question.detail
                    }));
                  }

                  // Send update with all current data
                  onChunk({
                    text: mainContent,
                    topics: currentTopics,
                    questions: currentQuestions
                  });
                }
              } catch (error) {
                // Ignore parse errors while accumulating JSON
              }
            }
          } else {
            mainContent = buffer.trim();
            onChunk({ 
              text: mainContent,
              topics: currentTopics,
              questions: currentQuestions
            });
          }
        }

        return;

      } catch (error) {
        retryCount++;
        console.error(`API attempt ${retryCount} failed:`, error);

        if (retryCount === maxRetries) {
          throw new Error(`Failed to stream content after ${maxRetries} attempts`);
        }

        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
      }
    }
  }

  private calculateNextLevel(performance: QuestionPerformance): number {
    const { timeTaken, wasCorrect, previousLevel } = performance;
    
    // Fast and correct: increase difficulty
    if (wasCorrect && timeTaken < 5) {
      return Math.min(5, previousLevel + 1);
    }
    
    // Slow and incorrect: decrease difficulty
    if (!wasCorrect && timeTaken > 20) {
      return Math.max(1, previousLevel - 1);
    }
    
    // Correct but slow: maintain level
    if (wasCorrect && timeTaken >= 10) {
      return previousLevel;
    }
    
    // Quick but incorrect: slight decrease
    if (!wasCorrect && timeTaken <= 20) {
      return Math.max(1, previousLevel - 0.5);
    }
    
    return previousLevel;
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const words1 = str1.toLowerCase().split(/\s+/);
    const words2 = str2.toLowerCase().split(/\s+/);
    
    const intersection = words1.filter(word => words2.includes(word));
    const union = new Set([...words1, ...words2]);
    
    return intersection.length / union.size;
  }

  private isQuestionSimilar(newQuestion: string, history: QuestionHistory[]): boolean {
    for (const item of history) {
      const similarity = this.calculateSimilarity(newQuestion, item.text);
      if (similarity > GPTService.SIMILARITY_THRESHOLD) {
        return true;
      }
    }
    return false;
  }

  async getQuestion(
    topic: string, 
    level: number, 
    userContext: UserContext,
    performance?: QuestionPerformance,
    questionHistory: string[] = []
  ): Promise<Question> {
    try {
      const adjustedLevel = performance 
        ? this.calculateNextLevel(performance)
        : level;

      const aspects = [
        'core_concepts',
        'applications',
        'problem_solving',
        'analysis',
        'current_trends'
      ];

      const selectedAspect = aspects[Math.floor(Math.random() * aspects.length)];
      
      const systemPrompt = `You are an expert tutor creating multiple-choice questions about ${topic}.
        Focus on: ${selectedAspect.replace('_', ' ')}

        Previous questions asked (DO NOT repeat similar questions):
        ${questionHistory.join('\n')}

        Return ONLY a JSON object in this EXACT format:
        {
          "text": "Clear, concise question text",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": 0,
          "explanation": {
            "correct": "Brief explanation of why the answer is correct",
            "key_point": "Key concept to remember"
          },
          "difficulty": number between 1-5
        }

        IMPORTANT RULES:
        1. Question text must be clear and specific
        2. EXACTLY 4 options required
        3. All options must be plausible but only one correct
        4. correctAnswer must be 0-3 (index of correct option)
        5. Explanation must be clear and concise
        6. Key point must be memorable
        7. Set difficulty to exactly ${adjustedLevel}
        8. Use age-appropriate language for age ${userContext.age}
        9. DO NOT repeat or create questions similar to the previous ones listed above`;

      const userPrompt = `Create a ${adjustedLevel}/5 difficulty question about ${topic} that is engaging for a ${userContext.age} year old.
        Make it practical and relatable.
        Ensure options are distinct but plausible.
        Keep explanations concise but clear.
        IMPORTANT: Create a completely different question from the previous ones.`;

      const content = await this.makeRequest(systemPrompt, userPrompt);
      
      if (!content) {
        throw new Error('Empty response received');
      }

      let parsedContent: Question;
      try {
        parsedContent = JSON.parse(content);
        parsedContent.difficulty = adjustedLevel;

        // Check if the new question is too similar to previous ones
        const questionHistoryObjects = questionHistory.map(q => ({ text: q, similarity: 0 }));
        if (this.isQuestionSimilar(parsedContent.text, questionHistoryObjects)) {
          // If too similar, try again with a different aspect
          return this.getQuestion(topic, level, userContext, performance, questionHistory);
        }

      } catch (error) {
        console.error('JSON Parse Error:', error);
        throw new Error('Invalid JSON response');
      }

      // Validate the question format
      if (!this.validateQuestionFormat(parsedContent)) {
        console.error('Invalid question format:', parsedContent);
        throw new Error('Invalid question format received');
      }

      return parsedContent;
    } catch (error) {
      console.error('Question generation error:', error);
      throw new Error('Failed to generate question');
    }
  }

  private validateQuestionFormat(question: Question): boolean {
    try {
      if (!question.text?.trim()) return false;
      if (!Array.isArray(question.options) || question.options.length !== 4) return false;
      if (question.options.some(opt => !opt?.trim())) return false;
      if (typeof question.correctAnswer !== 'number' || 
          question.correctAnswer < 0 || 
          question.correctAnswer > 3) return false;
      if (!question.explanation?.correct?.trim() || 
          !question.explanation?.key_point?.trim()) return false;
      if (question.text.length < 10) return false;
      if (question.options.length !== new Set(question.options).size) return false;
      if (question.explanation.correct.length < 5 || 
          question.explanation.key_point.length < 5) return false;

      return true;
    } catch (error) {
      console.error('Validation error:', error);
      return false;
    }
  }
} 