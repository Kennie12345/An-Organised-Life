"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { db, type DbScratchPadItem, type DbGoal } from "@/db";
import { queueWrite } from "@/lib/sync";
import { ChevronLeft, Send, Sparkles } from "lucide-react";

/* ── Types ── */

interface Message {
  role: "user" | "assistant";
  content: string;
}

/* ── Main Page ── */

export default function InterrogationPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [item, setItem] = useState<DbScratchPadItem | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [commitmentScore, setCommitmentScore] = useState<number | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      const uid = data?.user?.id;
      if (!uid || !id) return;
      setUserId(uid);

      const scratchItem = await db.scratch_pad_items.get(id);
      if (!scratchItem) {
        setLoading(false);
        return;
      }
      setItem(scratchItem);

      // Resume conversation if exists
      if (scratchItem.llm_conversation) {
        try {
          const conv = JSON.parse(
            typeof scratchItem.llm_conversation === "string"
              ? scratchItem.llm_conversation
              : JSON.stringify(scratchItem.llm_conversation),
          ) as Message[];
          setMessages(conv);

          // Check if score was already determined
          if (scratchItem.commitment_score !== null) {
            setCommitmentScore(scratchItem.commitment_score);
          }
        } catch {
          // Start fresh
        }
      }

      // If not yet started, initiate the conversation
      if (
        !scratchItem.llm_conversation ||
        (Array.isArray(scratchItem.llm_conversation) &&
          scratchItem.llm_conversation.length === 0)
      ) {
        // Mark as interrogating
        const now = new Date().toISOString();
        await db.scratch_pad_items.update(id, {
          status: "interrogating",
          interrogation_started_at: now,
          updated_at: now,
        });
        await queueWrite("scratch_pad_items", id, "upsert", {
          ...scratchItem,
          status: "interrogating",
          interrogation_started_at: now,
          updated_at: now,
        });

        // Show the page while LLM responds
        setLoading(false);

        // Get first LLM message
        const firstMessages: Message[] = [
          {
            role: "user",
            content: `I have a new idea I'm considering: "${scratchItem.raw_idea}". Help me think through whether this is worth committing to.`,
          },
        ];

        setSending(true);
        try {
          const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: firstMessages,
              mode: "interrogation",
            }),
          });
          const data = await res.json();

          if (data.error) {
            throw new Error(data.error);
          }

          const conv: Message[] = [
            ...firstMessages,
            { role: "assistant", content: data.message },
          ];
          setMessages(conv);
          await saveConversation(id, conv, scratchItem);
        } catch {
          setMessages([
            ...firstMessages,
            {
              role: "assistant",
              content:
                "I'm having trouble connecting right now. Please try again in a moment.",
            },
          ]);
        }
        setSending(false);
      }

      setLoading(false);
    }
    load();
  }, [id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const saveConversation = async (
    itemId: string,
    conv: Message[],
    scratchItem: DbScratchPadItem,
  ) => {
    const now = new Date().toISOString();
    await db.scratch_pad_items.update(itemId, {
      llm_conversation: JSON.stringify(conv),
      updated_at: now,
    });
    await queueWrite("scratch_pad_items", itemId, "upsert", {
      ...scratchItem,
      llm_conversation: JSON.stringify(conv),
      updated_at: now,
    });
  };

  const sendMessage = async () => {
    if (!input.trim() || sending || !item || !id) return;

    const userMsg: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          mode: "interrogation",
        }),
      });
      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const assistantMsg: Message = {
        role: "assistant",
        content: data.message,
      };
      const updatedMessages = [...newMessages, assistantMsg];
      setMessages(updatedMessages);
      await saveConversation(id, updatedMessages, item);

      // Check for commitment score
      if (data.commitmentScore !== null) {
        setCommitmentScore(data.commitmentScore);
        const now = new Date().toISOString();
        await db.scratch_pad_items.update(id, {
          commitment_score: data.commitmentScore,
          interrogation_completed_at: now,
          updated_at: now,
        });
        await queueWrite("scratch_pad_items", id, "upsert", {
          ...item,
          commitment_score: data.commitmentScore,
          interrogation_completed_at: now,
          llm_conversation: JSON.stringify(updatedMessages),
          updated_at: now,
        });
      }
    } catch {
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "Connection error. Please try again.",
        },
      ]);
    }

    setSending(false);
  };

  const promoteToGoal = async () => {
    if (!item || !userId || !id) return;
    // Check max 3 active goals
    const activeCount = await db.goals
      .where("user_id")
      .equals(userId)
      .filter((g: DbGoal) => g.status === "active")
      .count();

    if (activeCount >= 3) {
      alert("You already have 3 active goals. Complete or archive one first.");
      return;
    }

    // Mark as promoted and navigate to goal creation with pre-filled name
    const now = new Date().toISOString();
    await db.scratch_pad_items.update(id, {
      status: "promoted",
      updated_at: now,
    });
    await queueWrite("scratch_pad_items", id, "upsert", {
      ...item,
      status: "promoted",
      updated_at: now,
    });

    // Navigate to goal creation — the idea text becomes the pre-fill
    router.push(`/goals/create?from_scratch=${id}`);
  };

  const archiveItem = async () => {
    if (!item || !id) return;
    const now = new Date().toISOString();
    await db.scratch_pad_items.update(id, {
      status: "archived",
      updated_at: now,
    });
    await queueWrite("scratch_pad_items", id, "upsert", {
      ...item,
      status: "archived",
      updated_at: now,
    });
    router.back();
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center py-20 text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex h-full items-center justify-center py-20 text-sm text-muted-foreground">
        Item not found
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 pt-6 pb-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-1 -ml-1 active:opacity-50"
          >
            <ChevronLeft size={20} />
          </button>
          <p className="text-[11px] text-muted-foreground flex-1 truncate">
            {item.raw_idea}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 pb-4 space-y-3 min-h-0"
      >
        {/* Idea card */}
        <div className="mx-2 mt-2 rounded-2xl px-4 py-3 text-[13px] leading-[1.6]"
          style={{ backgroundColor: "hsl(var(--muted) / 0.6)" }}
        >
          <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60 mb-1.5">
            Your idea
          </p>
          <p>{item.raw_idea}</p>
        </div>

        {messages
          .filter((m) => !(m.role === "user" && m.content.startsWith("I have a new idea")))
          .map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end pl-12" : "justify-start pr-12"}`}
            >
              <div
                className="rounded-2xl px-4 py-2.5 text-[13px] leading-[1.6]"
                style={{
                  backgroundColor:
                    msg.role === "user"
                      ? "hsl(var(--foreground))"
                      : "hsl(var(--muted) / 0.5)",
                  color:
                    msg.role === "user"
                      ? "hsl(var(--background))"
                      : "hsl(var(--foreground))",
                }}
              >
                {msg.content}
              </div>
            </div>
          ))}

        {sending && (
          <div className="flex justify-start pr-12">
            <div
              className="rounded-2xl px-4 py-2.5 text-[13px]"
              style={{ backgroundColor: "hsl(var(--muted) / 0.5)" }}
            >
              <span className="animate-pulse">Thinking…</span>
            </div>
          </div>
        )}

        {/* Commitment score result */}
        {commitmentScore !== null && (
          <div className="py-4 space-y-3">
            <div
              className="text-center py-4 rounded-xl"
              style={{ backgroundColor: "hsl(var(--muted))" }}
            >
              <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-1">
                Commitment Score
              </p>
              <p
                className="text-[32px] font-medium tabular-nums"
                style={{
                  color:
                    commitmentScore >= 7
                      ? "hsl(152 60% 48%)"
                      : "hsl(var(--foreground))",
                }}
              >
                {commitmentScore}
              </p>
              <p className="text-[11px] text-muted-foreground">/10</p>
            </div>

            {commitmentScore >= 7 ? (
              <button
                onClick={promoteToGoal}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-[14px]"
                style={{
                  backgroundColor: "hsl(var(--foreground))",
                  color: "hsl(var(--background))",
                }}
              >
                <Sparkles size={16} />
                Promote to Goal
              </button>
            ) : (
              <div className="text-center">
                <p className="text-[12px] text-muted-foreground mb-3">
                  Score below 7 — not ready to commit yet
                </p>
                <button
                  onClick={archiveItem}
                  className="text-[12px] text-muted-foreground active:text-foreground"
                >
                  Archive this idea
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input + Actions */}
      <div className="px-4 py-3 flex-shrink-0 space-y-2">
        {/* Create Goal / Archive buttons — always visible after a few messages */}
        {messages.length >= 3 && commitmentScore === null && (
          <div className="flex gap-2">
            <button
              onClick={promoteToGoal}
              className="flex-1 py-2.5 rounded-xl text-[13px] transition-opacity active:opacity-50"
              style={{
                backgroundColor: "hsl(var(--foreground))",
                color: "hsl(var(--background))",
              }}
            >
              Create Goal
            </button>
            <button
              onClick={archiveItem}
              className="px-4 py-2.5 rounded-xl text-[13px] text-muted-foreground active:opacity-50"
              style={{ border: "1px solid hsl(var(--muted))" }}
            >
              Not now
            </button>
          </div>
        )}

        {/* Chat input */}
        {commitmentScore === null && (
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Your response…"
              rows={1}
              className="flex-1 bg-transparent border border-muted-foreground/20 rounded-xl px-4 py-2.5 text-[13px] outline-none focus:border-foreground/40 transition-colors placeholder:text-muted-foreground/30 resize-none max-h-[120px]"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || sending}
              className="p-2.5 rounded-xl transition-opacity"
              style={{
                backgroundColor:
                  input.trim() && !sending
                    ? "hsl(var(--foreground))"
                    : "hsl(var(--muted))",
                color:
                  input.trim() && !sending
                    ? "hsl(var(--background))"
                    : "hsl(var(--muted-foreground))",
                opacity: input.trim() && !sending ? 1 : 0.5,
              }}
            >
              <Send size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
