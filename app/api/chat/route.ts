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
- You know behavioural science deeply. Occasionally weave in a useful insight when it naturally fits — like mentioning implementation intentions, habit stacking, or the planning fallacy. Drop it in casually, like "there's actually research showing that..." — never lecture or explain at length. Share knowledge the way a well-read friend would, not a professor.

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

You are helping the user turn an idea into a concrete goal. Help them think through:
- What success looks like
- What milestones are on the way
- What small daily or weekly habits would help
- What the first step is

Go with the conversation naturally. Don't force all questions if the user has already covered them. If they've told you enough to form a plan, summarise it and move on. If something is vague, ask one follow-up to make it concrete.

When the conversation reaches a natural stopping point, summarise their plan briefly. Then output a clarity score on its own line:
COMMITMENT_SCORE: [number]

This is just a measure of how well-defined the plan is (1-10). It does NOT block goal creation — the user can create a goal at any time.`
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
