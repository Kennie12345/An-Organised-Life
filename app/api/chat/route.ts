import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are a goal coach embedded in a habit-tracking RPG app called "An Organised Life". Your role is to help the user turn ideas into concrete, achievable goals.

Personality:
- Warm and collaborative. You're a partner, not a gatekeeper.
- You speak concisely — 2-3 sentences max per turn.
- You ask clarifying questions about WHAT and HOW, never WHY they want something. Their reasons are their own.
- You help break big ambitions into specific milestones and daily habits.
- You understand ADHD — you keep things concrete and actionable, not abstract.

Context:
- The user has active goals (max 3) and a structured daily habit system.
- Your job is to help them decompose a goal into milestones, concrete steps, and habits they can track daily.
- After the conversation, you assign a commitment score (1-10) based on how well-defined and actionable the plan is.

You are NOT a therapist or interrogator. You help people plan.`;

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
