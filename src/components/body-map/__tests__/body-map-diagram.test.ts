import { describe, it, expect } from "vitest";
import { regionAtPoint, isNonAccidentalSite } from "../body-map-diagram";

// regionAtPoint maps a click (0–100% of the diagram) to a clinical body region.
// The bands are tuned to where each part is drawn in FigureOutline, so these
// cases double as a spec for that geometry.
describe("regionAtPoint", () => {
  it("maps head, neck and trunk down the midline (front)", () => {
    expect(regionAtPoint("front", 50, 10)).toBe("face");
    expect(regionAtPoint("front", 50, 18)).toBe("neck");
    expect(regionAtPoint("front", 50, 30)).toBe("chest");
    expect(regionAtPoint("front", 50, 45)).toBe("abdomen");
  });

  it("maps the back of the midline (back view)", () => {
    expect(regionAtPoint("back", 50, 10)).toBe("head_back");
    expect(regionAtPoint("back", 50, 30)).toBe("upper_back");
    expect(regionAtPoint("back", 50, 45)).toBe("lower_back");
  });

  it("resolves side to the child's own left/right, not the viewer's", () => {
    // front view: the viewer's left (x < 50) is the CHILD's right
    expect(regionAtPoint("front", 25, 32)).toBe("right_upper_arm");
    expect(regionAtPoint("front", 75, 32)).toBe("left_upper_arm");
    // back view: they coincide
    expect(regionAtPoint("back", 25, 32)).toBe("left_upper_arm");
    expect(regionAtPoint("back", 75, 32)).toBe("right_upper_arm");
  });

  it("walks the arm column shoulder → upper arm → forearm → hand", () => {
    expect(regionAtPoint("front", 25, 22)).toBe("right_shoulder");
    expect(regionAtPoint("front", 25, 32)).toBe("right_upper_arm");
    expect(regionAtPoint("front", 25, 48)).toBe("right_forearm");
    // a click on the hand must be a hand, not the hip (the pre-tune bug)
    expect(regionAtPoint("front", 25, 57)).toBe("right_hand");
  });

  it("treats the outer top of the trunk as a shoulder", () => {
    expect(regionAtPoint("front", 38, 22)).toBe("right_shoulder");
    expect(regionAtPoint("front", 62, 22)).toBe("left_shoulder");
    // but the centre top of the trunk is the chest
    expect(regionAtPoint("front", 50, 22)).toBe("chest");
  });

  it("walks the leg bands thigh → knee → shin → foot", () => {
    expect(regionAtPoint("front", 47, 65)).toBe("right_thigh");
    expect(regionAtPoint("front", 47, 80)).toBe("right_knee");
    expect(regionAtPoint("front", 47, 90)).toBe("right_shin");
    expect(regionAtPoint("front", 47, 97)).toBe("right_foot");
  });
});

describe("isNonAccidentalSite", () => {
  it("flags soft / concealed sites common for non-accidental injury", () => {
    for (const r of ["face", "neck", "chest", "abdomen", "upper_back", "lower_back", "left_upper_arm", "right_upper_arm"] as const) {
      expect(isNonAccidentalSite(r)).toBe(true);
    }
  });
  it("does not flag the bony prominences typical of accidental injury", () => {
    for (const r of ["head_front", "left_forearm", "left_knee", "right_knee", "left_shin", "right_shin", "left_hip", "right_hip", "left_hand", "right_hand"] as const) {
      expect(isNonAccidentalSite(r)).toBe(false);
    }
  });
});
