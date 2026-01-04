// src/calendar/ics.ts
import { Event } from "../models/event";
import { createEvents, EventAttributes } from "ics";

export function generateIcs(events: Event[]): string {
  if (events.length === 0) {
    throw new Error("No events provided to generate ICS.");
  }

  const data: EventAttributes[] = events.map((e) => {
    const start: [number, number, number, number, number] = [
      e.start.getFullYear(),
      e.start.getMonth() + 1, // 1-based month
      e.start.getDate(),
      e.start.getHours(),
      e.start.getMinutes(),
    ];

    const end: [number, number, number, number, number] = [
      e.end.getFullYear(),
      e.end.getMonth() + 1,
      e.end.getDate(),
      e.end.getHours(),
      e.end.getMinutes(),
    ];

    const base: EventAttributes = {
      title: cleanTitle(e.title),
      start,
      end,
      description: buildDescription(e),
    };

    // Only add location if we actually have one (avoids undefined issues)
    const location = e.venue || e.city;
    if (location) {
      base.location = location;
    }

    return base;
  });

  const { error, value } = createEvents(data);

  if (error || !value) {
    throw new Error(
      `Failed to generate ICS: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }

  return value;
}

function buildDescription(e: Event): string {
  const parts = [e.url];

  if (e.description && e.description.trim().length > 0) {
    parts.push("", e.description.trim());
  }

  return parts.join("\n");
}

function cleanTitle(raw: string): string {
  if (!raw) return raw;
  const pipeSplit = raw.split("|")[0].trim();
  const dashSplit = (() => {
  // Normalize to a single dash style
  const normalized = pipeSplit.replace(/–/g, "-");

  // Split on " - "
  const parts = normalized.split(" - ").map(p => p.trim()).filter(Boolean);

  // Take first two segments, if available
  const firstTwo = parts.slice(0, 2);

  return firstTwo.join(" | ");
  })();

  return dashSplit;
}

