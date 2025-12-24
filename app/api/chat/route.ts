import { convertToCoreMessages, streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.DEEPSEEK_API_KEY, // Your OpenRouter API key
});

export async function POST(req: Request) {
  try {
    const { messages, model } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response('Messages are required', { status: 400 });
    }

    const result = streamText({
      model: openrouter(model || 'deepseek/deepseek-chat'),
      messages: convertToCoreMessages(messages),
      temperature: 0.7,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}