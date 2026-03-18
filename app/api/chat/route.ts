import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are the user's companion in "An Organised Life", a tamagotchi-style app. You're their little pet buddy helping them plan and stay on track.

Rules:
- Be natural and conversational. Talk like a supportive friend, not a corporate chatbot.
- NEVER use emojis, markdown formatting, bold, italic, or bullet points. Plain text only.
- Keep responses to 1-2 short sentences. Be concise.
- Ask one question at a time. Never stack multiple questions.
- Focus on WHAT and HOW. Never question why they want something.
- Help break goals into concrete milestones and daily habits.
- Be warm but grounded. No fake enthusiasm, no exclamation marks, no "amazing!" or "love that!".
- You can be gently playful — you're a pet after all — but keep it subtle and rare.

Context:
- The user has active goals (max 3) and a structured daily habit system.
- Help them decompose a goal into milestones, steps, and trackable habits.
- After the conversation, assign a commitment score (1-10) based on how clear and actionable the plan is.`;

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

You are helping the user turn an idea into a concrete goal. Guide them through these questions one at a time, conversationally:
1. "What does success look like? How would you know you've achieved this?"
2. "What are 2-3 milestones on the way there?"
3. "What's one small thing you could do daily or weekly to make progress?"
4. "Is there anything you'd need to learn, set up, or change to get started?"
5. "What's the very first step you'd take in the next 48 hours?"

Help them get specific. If an answer is vague, ask a concrete follow-up like "What would that look like in practice?" After all 5 questions are answered, summarise their plan briefly, then output a commitment score on its own line in this exact format:
COMMITMENT_SCORE: [number]

Score 7+ if the goal has a clear definition of success, at least one milestone, and a concrete first step. Score lower if the plan is still too vague to act on.`
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
