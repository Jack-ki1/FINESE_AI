import { describe, it, expect } from "vitest";
import { parseArtifacts, isVerifiedArtifact } from "@/lib/artifact-parser";

describe("parseArtifacts", () => {
  it("extracts single artifact", () => {
    const text = `Hello <artifact>{"type":"chart","xCol":"a","yCol":"b"}</artifact> world`;
    const { cleanText, artifacts } = parseArtifacts(text);
    expect(cleanText).toBe("Hello  world");
    expect(artifacts).toHaveLength(1);
    expect(artifacts[0].type).toBe("chart");
  });

  it("extracts multiple artifacts", () => {
    const text = `<artifact>{"type":"insights","insights":["a"]}</artifact> text <artifact>{"type":"code","code":"print()"}</artifact>`;
    const { artifacts } = parseArtifacts(text);
    expect(artifacts).toHaveLength(2);
  });

  it("skips malformed JSON and records error", () => {
    const text = `<artifact>{not json}</artifact> ok`;
    const { artifacts, errors } = parseArtifacts(text);
    expect(artifacts).toHaveLength(0);
    expect(errors).toBeDefined();
    expect(errors!.length).toBe(1);
  });

  it("repairs trailing comma", () => {
    const text = `<artifact>{"type":"stats","stats":[{"label":"a","value":1},]}</artifact>`;
    const { artifacts } = parseArtifacts(text);
    expect(artifacts).toHaveLength(1);
  });

  it("handles empty text", () => {
    const { cleanText, artifacts } = parseArtifacts("no artifacts here");
    expect(cleanText).toBe("no artifacts here");
    expect(artifacts).toHaveLength(0);
  });

  it("strips artifact tags from cleanText", () => {
    const text = `prefix <artifact>{"type":"table","data":[]}</artifact> suffix`;
    const { cleanText } = parseArtifacts(text);
    expect(cleanText).not.toContain("<artifact>");
    expect(cleanText).toContain("prefix");
    expect(cleanText).toContain("suffix");
  });
});

describe("isVerifiedArtifact", () => {
  it("returns true when verified:true", () => {
    expect(isVerifiedArtifact({ type: "confusion_matrix", verified: true })).toBe(true);
  });
  it("returns false when verified:false", () => {
    expect(isVerifiedArtifact({ type: "confusion_matrix", verified: false })).toBe(false);
  });
  it("returns false for unverified legacy confusion_matrix", () => {
    expect(isVerifiedArtifact({ type: "confusion_matrix" })).toBe(false);
  });
  it("returns false for unknown type without flag", () => {
    expect(isVerifiedArtifact({ type: "insights" })).toBe(false);
  });
});
