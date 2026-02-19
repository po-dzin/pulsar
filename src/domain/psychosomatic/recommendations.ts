import type { PsychoLevel, RecommendationBlock, RiskFlag, ZoneScore } from "@/domain/psychosomatic/model";

const levelPlans: Record<PsychoLevel, RecommendationBlock[]> = {
  resource: [
    {
      title: "Daily rhythm (10-15 min)",
      items: [
        "Morning body scan",
        "Conscious breathing 5-10 min",
        "Light mobility or yoga",
        "Outdoor walk",
      ],
    },
    {
      title: "Focus",
      items: ["Keep resource stable and improve subtle body awareness"],
    },
  ],
  background_tension: [
    {
      title: "Daily regulation (15-20 min)",
      items: [
        "Diaphragmatic breathing with longer exhale",
        "Self-release for neck, shoulders, jaw",
        "Track stress triggers in short notes",
      ],
    },
    {
      title: "Focus",
      items: ["Reduce chronic background tension and restore relaxation response"],
    },
  ],
  persistent_clamps: [
    {
      title: "Priority: nervous system regulation",
      items: [
        "Box or 4-7-8 breathing",
        "Grounding exercises",
        "Slow decompression for key body zones",
      ],
    },
    {
      title: "Focus",
      items: ["Shift from survival activation to recoverable baseline"],
    },
  ],
  defense_mode: [
    {
      title: "Priority: safety and stabilization",
      items: [
        "Start with 5-10 min gentle grounding",
        "Non-forcing breath observation",
        "Reduce high-intensity stressors",
      ],
    },
    {
      title: "Focus",
      items: ["Restore basic felt-safety before performance goals"],
    },
  ],
};

const zoneTips: Record<string, string> = {
  head_control: "Reduce cognitive overload and jaw/head tension with short release cycles",
  neck_upper: "Unload neck/shoulders and rebalance responsibility load",
  back_support: "Support spinal endurance and perceived safety/opora",
  breathing_abdomen: "Improve breathing depth and reduce abdominal holding",
  sleep_recovery: "Rebuild sleep window and nightly downregulation",
  pelvis_safety: "Work with grounding, pelvis mobility, and safety perception",
  emotional_marker: "Decrease emotional suppression and increase safe expression",
};

export const deriveRecommendations = (
  level: PsychoLevel,
  zonesGrowth: ZoneScore[],
  riskFlags: RiskFlag[]
): RecommendationBlock[] => {
  const base = levelPlans[level];
  const growth = zonesGrowth.slice(0, 2).map((zone) => zoneTips[zone.zone] ?? zone.zone);

  const riskNotes: string[] = [];
  if (riskFlags.includes("trauma_history")) {
    riskNotes.push("Trauma history flag present: keep progression gradual and safety-oriented");
  }
  if (riskFlags.includes("sleep_disruption")) {
    riskNotes.push("Sleep disruption flag present: prioritize sleep rhythm before load increase");
  }
  if (riskFlags.includes("chronic_tension_pattern")) {
    riskNotes.push("Chronic tension pattern detected: avoid sharp intensity spikes");
  }

  const dynamicBlocks: RecommendationBlock[] = [];
  if (growth.length > 0) {
    dynamicBlocks.push({
      title: "Priority growth zones",
      items: growth,
    });
  }

  if (riskNotes.length > 0) {
    dynamicBlocks.push({
      title: "Risk-aware notes",
      items: riskNotes,
    });
  }

  return [...base, ...dynamicBlocks];
};
