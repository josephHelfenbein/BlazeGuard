import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const chat = model.startChat();

    const result = await chat.sendMessageStream(message);
    let fullResponse = '';
    for await (const chunk of result.stream) {
      fullResponse += chunk.text();
    }
    
    return NextResponse.json({ message: fullResponse });
  } catch (error) {
    console.error('Error in Gemini LLM endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
