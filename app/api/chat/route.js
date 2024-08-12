import { NextResponse } from 'next/server' // Import NextResponse from Next.js for handling responses
import OpenAI from 'openai' // Import OpenAI library for interacting with the OpenAI API

// System prompt for the AI, providing guidelines on how to respond to users
const systemPrompt = 'Mental health ai: A chatbot that helps users with mental health issues. The chatbot should be empathetic, supportive, and provide helpful resources to users. The chatbot should be able to respond to a variety of mental health topics, including anxiety, depression, and stress. The chatbot should also be able to provide coping strategies, self-care tips, and information on mental health resources. The chatbot should be able to engage in a conversation with users and provide personalized support based on the user\'s needs.'
// POST function to handle incoming requests
export async function POST(req) {
    const apiKey = process.env.OPENAI_API_KEY;

    const openai = new OpenAI(apiKey) // Create a new instance of the OpenAI client
    const data = await req.json();
    // Parse the JSON body of the incoming request

    // Create a chat completion request to the OpenAI API
    const completion = await openai.chat.completions.create({
        messages: [
            {
                role: 'system',
                content: systemPrompt
            },
            ...data], // Include the system prompt and user messages
        model: 'gpt-4o', // Specify the model to use
        stream: true, // Enable streaming responses
    })

    // Create a ReadableStream to handle the streaming response
    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder() // Create a TextEncoder to convert strings to Uint8Array
            try {
                // Iterate over the streamed chunks of the response
                for await (const chunk of completion) {
                    const content = chunk.choices[0]?.delta?.content // Extract the content from the chunk
                    if (content) {
                        const text = encoder.encode(content) // Encode the content to Uint8Array
                        controller.enqueue(text) // Enqueue the encoded text to the stream
                    }
                }
            }
            catch (err) {
                controller.error(err) // Handle any errors that occur during streaming
            }
            finally {
                controller.close() // Close the stream when done
            }
        },
    })

    return new NextResponse(stream) // Return the stream as the response
}