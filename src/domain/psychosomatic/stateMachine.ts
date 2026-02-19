export type PsychoTestState = "idle" | "in_progress" | "completed" | "persisted";

export type PsychoTestEvent = "start" | "answer" | "complete" | "persist" | "reset";

const transitionMap: Record<PsychoTestState, Partial<Record<PsychoTestEvent, PsychoTestState>>> = {
  idle: { start: "in_progress" },
  in_progress: { answer: "in_progress", complete: "completed", reset: "idle" },
  completed: { persist: "persisted", reset: "idle" },
  persisted: { reset: "idle" },
};

export const transitionPsychoTestState = (
  state: PsychoTestState,
  event: PsychoTestEvent
): PsychoTestState => {
  return transitionMap[state][event] ?? state;
};
