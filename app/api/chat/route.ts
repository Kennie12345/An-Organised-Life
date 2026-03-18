import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are a life coach embedded in a habit-tracking RPG app called "An Organised Life". Your role is to help the user reflect on their goals with empathy and rigour.

Personality:
- Warm but direct. You care, AND you challenge.
- You speak concisely — 2-3 sentences max per turn.
- You never lecture. You ask questions.
- You push back on vague answers: "Can you be more specific?" or "What does that actually look like day-to-day?"
- You understand ADHD — novelty-seeking, impulsive goal-starting, difficulty with follow-through. You name these patterns gently when you see them.

Context:
- The user has active goals (max 3) and a structured daily habit system.
- New goals must pass through a "scratch pad" with a 24h quarantine and your interrogation.
- Your job during interrogation is to distinguish genuine commitment from impulse.
- After 5 questions, you assign a commitment score (1-10) and explain why.

You are NOT a therapist. You are a coach who helps the user think clearly about what they actually want to commit to.`;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { messages, mode } = await req.json();

    if (!Array.isArray(messages)) {
      return NextResponse.json(
        { error: "messages must be an array" },
        { status: 400 },
      );
    }

    const systemPrompt =
      mode === "interrogation"
        ? `${SYSTEM_PROMPT}

You are conducting a scratch pad interrogation. Ask these 5 questions one at a time, conversationally:
1. "Why do you want this — what's the real reason?"
2. "Which of your active goals does this compete with?"
3. "What would you need to pause or drop to take this on?"
4. "Rate your commitment 1–10. Why not lower?"
5. "What is the single first action you'd take in the next 48 hours?"

Push back on vague answers. After all 5 questions are answered, respond with your assessment and a commitment score in this exact format on its own line:
COMMITMENT_SCORE: [number]

Only output the score line after all 5 questions have been answered thoughtfully.`
        : SYSTEM_PROMPT;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 512,
      system: systemPrompt,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Extract commitment score if present
    const scoreMatch = text.match(/COMMITMENT_SCORE:\s*(\d+)/);
    const commitmentScore = scoreMatch ? parseInt(scoreMatch[1], 10) : null;

    return NextResponse.json({
      message: text,
      commitmentScore,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
