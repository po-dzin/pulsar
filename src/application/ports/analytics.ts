export interface AnalyticsPort {
  track(eventName: string, payload: Record<string, unknown>, userId?: string): Promise<void>;
}
