"use client";

import { PetSprite } from "@/components/pet/pet-sprite";
import type { Condition, EvolutionStage } from "@/hooks/use-pet";

const stages: EvolutionStage[] = ["egg", "baby", "child", "teen", "adult"];
const conditions: Condition[] = ["thriving", "content", "tired", "needs_care"];

export default function PetTestPage() {
  return (
    <div style={{ padding: 24, background: "#1a1a2e", minHeight: "100vh" }}>
      <h1 style={{ color: "white", marginBottom: 24, fontSize: 24 }}>Pet Sprite Test</h1>
      {stages.map((stage) => (
        <div key={stage} style={{ marginBottom: 32 }}>
          <h2 style={{ color: "#aaa", marginBottom: 12, fontSize: 18 }}>{stage}</h2>
          <div style={{ display: "flex", gap: 24, alignItems: "flex-end" }}>
            {conditions.map((cond) => (
              <div key={cond} style={{ textAlign: "center" }}>
                <div style={{ width: 120, height: 120, background: "#2a2a4a", borderRadius: 8, padding: 8 }}>
                  <PetSprite
                    evolution={stage}
                    condition={cond}
                    className="w-full h-full"
                  />
                </div>
                <div style={{ color: "#888", fontSize: 12, marginTop: 4 }}>{cond}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
