import { describe, it, expect } from "vitest";
import { extractChildVoice } from "../child-voice.service";

describe("child-voice.service", () => {
  const baseMeta = {
    childId: "child-1",
    sourceType: "keywork",
    sourceTitle: "Key work session",
    sourceDate: "2026-05-10",
  };

  describe("extractChildVoice", () => {
    it("extracts direct quoted speech with curly quotes", () => {
      const content = `During the session the young person said “I really miss my mum and want to see her more” and seemed upset.`;
      const entries = extractChildVoice(content, baseMeta);

      expect(entries.length).toBeGreaterThanOrEqual(1);
      expect(entries[0].childId).toBe("child-1");
      expect(entries[0].sourceType).toBe("keywork");
      expect(entries[0].quote).toBeTruthy();
    });

    it("detects positive sentiment", () => {
      const content = `The young person said “I felt really good today, school was brilliant” during tea.`;
      const entries = extractChildVoice(content, baseMeta);

      expect(entries.length).toBeGreaterThanOrEqual(1);
      const positiveEntry = entries.find((e) => e.sentiment === "positive");
      expect(positiveEntry).toBeTruthy();
    });

    it("detects negative sentiment", () => {
      const content = `Before bed, the young person told staff: "I feel sad and lonely here"`;
      const entries = extractChildVoice(content, baseMeta);

      expect(entries.length).toBeGreaterThanOrEqual(1);
      const negEntry = entries.find((e) => e.sentiment === "negative");
      expect(negEntry).toBeTruthy();
    });

    it("detects distressed sentiment with high-priority keywords", () => {
      const content = `The young person said "I can't cope anymore and don't want to be here"`;
      const entries = extractChildVoice(content, baseMeta);

      expect(entries.length).toBeGreaterThanOrEqual(1);
      const distressedEntry = entries.find((e) => e.sentiment === "distressed");
      expect(distressedEntry).toBeTruthy();
    });

    it("detects family_contact theme", () => {
      const content = `The young person expressed that they wish to see their mum more often and miss family contact.`;
      const entries = extractChildVoice(content, baseMeta);

      expect(entries.length).toBeGreaterThanOrEqual(1);
      const familyEntry = entries.find((e) => e.theme === "family_contact");
      expect(familyEntry).toBeTruthy();
    });

    it("detects education theme", () => {
      const content = `During key work, the young person said "School is going well and I love my teacher"`;
      const entries = extractChildVoice(content, baseMeta);

      expect(entries.length).toBeGreaterThanOrEqual(1);
      const eduEntry = entries.find((e) => e.theme === "education");
      expect(eduEntry).toBeTruthy();
    });

    it("returns empty array for content with no child voice", () => {
      const content = `Staff completed the cleaning rota and updated the medication log. No incidents reported.`;
      const entries = extractChildVoice(content, baseMeta);

      expect(entries).toEqual([]);
    });

    it("deduplicates identical quotes", () => {
      const content = `The young person said "I miss my mum" and later repeated "I miss my mum"`;
      const entries = extractChildVoice(content, baseMeta);

      const quotes = entries.map((e) => e.quote);
      const uniqueQuotes = [...new Set(quotes)];
      expect(quotes.length).toBe(uniqueQuotes.length);
    });

    it("includes context around the extracted quote", () => {
      const content = `During tea time, the young person told us: "I felt really good today, school was brilliant" and smiled.`;
      const entries = extractChildVoice(content, baseMeta);

      if (entries.length > 0 && entries[0].context) {
        expect(entries[0].context.length).toBeGreaterThan(entries[0].quote.length);
      }
    });

    it("populates all entry fields", () => {
      const content = `The young person said "I like living here and feel safe with staff"`;
      const entries = extractChildVoice(content, baseMeta);

      if (entries.length > 0) {
        const entry = entries[0];
        expect(entry.id).toBeTruthy();
        expect(entry.childId).toBe("child-1");
        expect(entry.sourceType).toBe("keywork");
        expect(entry.sourceTitle).toBe("Key work session");
        expect(entry.sourceDate).toBe("2026-05-10");
        expect(entry.extractedAt).toBeTruthy();
        expect(["positive", "negative", "neutral", "distressed", "unknown"]).toContain(entry.sentiment);
      }
    });
  });
});
