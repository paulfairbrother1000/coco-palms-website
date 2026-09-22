import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AvailabilityCalendar } from "./availability-calendar";
import { QuotationCalendar } from "./quotation-calendar";

const blocked = [{ start_date: "2027-06-05", end_date: "2027-06-06" }];

describe("unavailable calendar dates", () => {
  it("keeps the date number visible in the quotation calendar", () => {
    render(<QuotationCalendar ranges={blocked} arrival="2027-06-01" departure="" onChange={vi.fn()} />);
    const day = screen.getByRole("button", { name: "June 5, 2027, unavailable" });
    expect(day).toBeDisabled();
    expect(day).toHaveTextContent("5");
  });

  it("keeps the date number visible in the availability calendar", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2027-06-01T12:00:00Z"));
    render(<AvailabilityCalendar ranges={blocked} />);
    const day = screen.getByRole("button", { name: "June 5, 2027, unavailable" });
    expect(day).toBeDisabled();
    expect(day).toHaveTextContent("5");
    vi.useRealTimers();
  });

  it("shows today and the following four Antigua dates as unavailable", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2027-06-01T12:00:00Z"));
    render(<QuotationCalendar ranges={[]} arrival="" departure="" onChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: "June 1, 2027, unavailable" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "June 5, 2027, unavailable" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "June 6, 2027, available" })).toBeEnabled();
    vi.useRealTimers();
  });

  it("prevents choosing a departure before the five-night minimum", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2027-06-01T12:00:00Z"));
    render(<QuotationCalendar ranges={[]} arrival="2027-06-10" departure="" onChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: "June 14, 2027, unavailable" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "June 15, 2027, available" })).toBeEnabled();
    vi.useRealTimers();
  });
});
