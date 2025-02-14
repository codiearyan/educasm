import { NextRequest, NextResponse } from 'next/server';
import { GPTService } from '@/lib/gpt';

export async function POST(req: NextRequest) {
  try {
    const { topic, level, userContext, performance, questionHistory } = await req.json();

    if (!topic || !level || !userContext?.age) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const gptService = new GPTService();
    const question = await gptService.getQuestion(
      topic, 
      level, 
      userContext, 
      performance,
      questionHistory || []
    );

    return NextResponse.json(question);
  } catch (error) {
    console.error('Playground API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate question' },
      { status: 500 }
    );
  }
} 