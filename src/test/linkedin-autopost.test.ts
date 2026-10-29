import { describe, expect, it } from "vitest";
import { articleTopics, POSTING_TARGET } from "../../supabase/functions/linkedin-autopost/content";

describe("LinkedIn article publishing", () => {
  it("uses only the personal profile", () => {
    expect(POSTING_TARGET).toBe("personal");
  });
  it("includes relevant keywords and hashtags", () => {
    const topics = articleTopics("Forex", "Gold technical analysis");
    expect(topics.keywords).toContain("forex trading");
    expect(topics.keywords).toContain("gold trading");
    expect(topics.hashtags).toContain("#ForexTrading");
    expect(topics.hashtags).toContain("#TechnicalAnalysis");
    expect(topics.hashtags).not.toContain("#Crypto");
  });
});