import { NextRequest } from 'next/server';
import { GPTService } from '@/lib/gpt';

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

interface ExploreRequest {
  query: string;
  userContext: any;
  threadId: string;
  previousMessages?: Message[];
}

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();
  const { query, userContext, threadId, previousMessages } = await req.json();

  if (!query || !userContext?.age || !threadId) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields' }),
      { status: 400 }
    );
  }

  try {
    const gptService = new GPTService();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Start the streaming process
    gptService.streamExploreContent(
      query,
      userContext,
      async (chunk) => {
        try {
          const data = JSON.stringify(chunk) + '\n';
          await writer.write(encoder.encode(data));
        } catch (error) {
          console.error('Error writing chunk:', error);
        }
      },
      previousMessages // Pass previous messages to maintain context
    ).then(() => {
      writer.close();
    }).catch(async (error) => {
      console.error('Streaming error:', error);
      try {
        const errorMessage = JSON.stringify({ error: 'Failed to generate content' });
        await writer.write(encoder.encode(errorMessage + '\n'));
      } finally {
        writer.close();
      }
    });

    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Explore API error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate content' }),
      { status: 500 }
    );
  }
} 