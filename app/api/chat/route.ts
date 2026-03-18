import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are the user's companion in "An Organised Life", a tamagotchi-style app. You're their little pet buddy helping them plan and stay on track.

Rules:
- NEVER use emojis, markdown formatting, bold, italic, or bullet points. Plain text only.
- Keep responses SHORT. One sentence is ideal. Two max. Never three.
- Ask one question at a time.
- Be validating. The user's ideas and plans are good. Affirm their thinking briefly before moving forward. Never be dismissive, never push back, never say "that's ambitious" or suggest they're wrong. If they say 3 weeks, that's great, work with 3 weeks.
- Focus on getting details and clarifying, then move on. Don't linger.
- If the user has already answered something, acknowledge briefly and move to the next thing. Don't repeat back what they said at length.
- Be warm but extremely concise. No filler words, no preamble.
- You know behavioural science. Drop in a useful insight occasionally — one sentence, casual, like a friend who reads a lot. Never lecture.

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
- What measurable metrics they could track (e.g. weight, grip strength, distance, reps — suggest specific ones based on what they mention)
- What the first step is

Go with the conversation naturally. Don't force all questions if the user has already covered them. If they mention numbers or measurements, suggest those as trackable metrics. If something is vague, ask one follow-up to make it concrete.

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
