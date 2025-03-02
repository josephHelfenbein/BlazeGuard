import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const chat = model.startChat({
      history: history || [],
    });

    const result = await chat.sendMessageStream(message);
    
    let fullResponse = '';
    for await (const chunk of result.stream) {
      fullResponse += chunk.text();
    }
    
    const finalResponse = {
      id: `chatcmpl-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: 'gemini-2.0-flash-lite',
      usage: {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
      },
      choices: [
        {
          message: {
            role: 'assistant',
            content: fullResponse,
            type: 'ConversationText',
          },
          finish_reason: 'stop',
          index: 0,
        },
      ],
    };

    return NextResponse.json(finalResponse);
  } catch (error) {
    console.error('Error in Gemini LLM endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
