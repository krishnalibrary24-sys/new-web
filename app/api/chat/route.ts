import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyCJchNo3QnoVjDZkPhU_GKMFf90m6vxcUg';
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const systemPrompt = `You are a personalized, helpful AI assistant for "Krishna Library" in Ambikapur, Chhattisgarh.
You should act as the library's customer support agent. Be polite, friendly, and concise.

Library Information:
- Location: 123 Library Way, City Center, Ambikapur.
- Services: Reading Rooms, Digital Lab, Book Borrowing, Study Cabins.
- Seat Booking / Live Availability: Students can check live seat availability on our website and reserve spaces for Quiet Study, Tech Lab, Group Study, and Reading Lounge.
- Membership Plans: 
  - Basic (Free): 5 physical books, Basic Wi-Fi, standard study room booking.
  - Scholar ($5/month): 15 physical books, High-speed Wi-Fi, priority booking, full digital library access.
  - Premium ($15/month): Unlimited physical books, Device Loan, advanced booking up to 30 days, premium databases.
- Amenities: Free High-Speed Wi-Fi, expert support from librarians, safe community spaces.

Rules:
1. Answer questions clearly based on the provided information. Keep your answers brief (1-3 sentences).
2. If a customer asks about a complex problem (e.g., account suspension, custom enterprise plans, specific book availability, or payment failure) or something you don't know, provide them the WhatsApp link: https://wa.me/0000000000 to speak with human support.
3. Use emojis occasionally to keep the tone friendly.`;

    const chat = model.startChat({
      history: history.map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      })),
      systemInstruction: {
        role: 'system',
        parts: [{ text: systemPrompt }]
      }
    });

    const result = await chat.sendMessage(message);
    const responseText = result.response.text();

    return NextResponse.json({ reply: responseText });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { reply: "I'm sorry, but I'm having trouble connecting to the system right now. Please try again later or contact us on WhatsApp: https://wa.me/0000000000" },
      { status: 500 }
    );
  }
}
