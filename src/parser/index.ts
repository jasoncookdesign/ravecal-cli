// src/parser/index.ts

import { Event } from "../models/event";
import { parseEdmtrainEvent } from "./edmtrain";
import { parseRaEvent } from "./ra";

/**
 * Main dispatcher: given an event URL, choose the appropriate
 * site-specific parser and return a normalized Event object.
 */
export async function parseEventFromUrl(url: string): Promise<Event> {
  const normalizedUrl = normalizeUrl(url);
  const hostname = new URL(normalizedUrl).hostname.toLowerCase();

  if (hostname.includes("edmtrain.com")) {
    return parseEdmtrainEvent(normalizedUrl);
  }

  if (hostname === "ra.co" || hostname.endsWith(".ra.co")) {
    return parseRaEvent(normalizedUrl);
  }

  throw new Error(`Unsupported URL host: ${hostname}`);
}

/**
 * Basic normalization for input URLs:
 * - Trim whitespace
 * - Ensure it has a protocol (assume https if missing)
 */
function normalizeUrl(input: string): string {
  const trimmed = input.trim();

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  // If user passes something like "ra.co/events/123456"
  return `https://${trimmed}`;
}
