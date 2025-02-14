import { NextRequest } from 'next/server';
import { GPTService } from '@/lib/gpt';

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();
  const { query, userContext } = await req.json();

  if (!query || !userContext?.age) {
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
      }
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