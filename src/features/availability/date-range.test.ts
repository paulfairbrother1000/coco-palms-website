import { describe, expect, it } from "vitest";
import { canSelectRange, isDateUnavailable } from "./date-range";

const blocked = [{ start_date: "2027-06-05", end_date: "2027-06-09" }];

describe("availability date ranges", () => {
  it("marks nights inside a half-open booking range as unavailable", () => {
    expect(isDateUnavailable(new Date("2027-06-05T00:00:00Z"), blocked)).toBe(true);
    expect(isDateUnavailable(new Date("2027-06-08T00:00:00Z"), blocked)).toBe(true);
    expect(isDateUnavailable(new Date("2027-06-09T00:00:00Z"), blocked)).toBe(false);
  });

  it("allows departure on the first date of a following booking", () => {
    expect(canSelectRange(new Date("2027-06-01T00:00:00Z"), new Date("2027-06-05T00:00:00Z"), blocked)).toBe(true);
  });

  it("rejects a stay that crosses an unavailable night", () => {
    expect(canSelectRange(new Date("2027-06-01T00:00:00Z"), new Date("2027-06-07T00:00:00Z"), blocked)).toBe(false);
  });

  it("rejects a departure that is not after arrival", () => {
    expect(canSelectRange(new Date("2027-06-05T00:00:00Z"), new Date("2027-06-05T00:00:00Z"), [])).toBe(false);
  });
});
