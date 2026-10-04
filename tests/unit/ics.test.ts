import { describe, expect, it } from "vitest";
import {
  assessDstLocalTime,
  buildIcs,
  escapeIcsText,
  foldIcsLine,
} from "../../worker/src/export/ics";

describe("EXPORT ICS (P18)", () => {
  it("EXPORT-01: CRLF and delimiter injection cannot create extra VEVENT", () => {
    const evil = "Dinner\r\nBEGIN:VEVENT\nSUMMARY:Hacked;FN=x,y";
    const result = buildIcs({
      uid: "test-uid",
      summary: evil,
      description: evil,
      location: evil,
      localStart: "2026-10-18T19:00",
      timezone: "America/New_York",
      dstStatus: "ok",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.reservationStatus).toBe("unconfirmed");
    expect(result.ics.split("\r\n").filter((l) => l === "BEGIN:VEVENT")).toHaveLength(1);
    // Folded lines may split words; unfold for assertion.
    const unfolded = result.ics.replace(/\r\n /g, "");
    expect(unfolded).toContain("Reservation: unconfirmed");
    expect(result.ics).not.toMatch(/\r\nBEGIN:VEVENT\r\nSUMMARY:Hacked/);
    expect(escapeIcsText("a;b,c\nd")).toBe("a\\;b\\,c\\nd");
    expect(foldIcsLine("A".repeat(80)).split("\r\n").length).toBeGreaterThan(1);
  });

  it("EXPORT-02: ambiguous/nonexistent DST prompts user", () => {
    expect(assessDstLocalTime("2026-03-08T02:30", "America/New_York")).toBe("nonexistent");
    expect(assessDstLocalTime("2026-11-01T01:30", "America/New_York")).toBe("ambiguous");
    const blocked = buildIcs({
      uid: "x",
      summary: "x",
      description: "x",
      location: "x",
      localStart: "2026-03-08T02:30",
      timezone: "America/New_York",
      dstStatus: "nonexistent",
    });
    expect(blocked.ok).toBe(false);
  });

  it("EXPORT-03: labels reservation unconfirmed and tentative status", () => {
    const result = buildIcs({
      uid: "uid-1",
      summary: "Team dinner",
      description: "Brief",
      location: "Synthetic Noodle Room",
      localStart: "2026-10-18T19:00",
      timezone: "America/New_York",
      dstStatus: "ok",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.ics).toContain("STATUS:TENTATIVE");
    expect(result.ics).toMatch(/Reservation: unconfirmed/i);
    expect(result.ics).not.toMatch(/booked|confirmed reservation/i);
  });
});
