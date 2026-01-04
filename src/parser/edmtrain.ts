// src/parser/edmtrain.ts
import axios from "axios";
import { Event } from "../models/event";
import {
  defaultStartFromDate,
  defaultEndFromDate,
  isValidDate,
} from "../utils/time";

/**
 * Parse an EDMTrain event URL using the official EDMTrain API.
 * URL examples:
 *  - https://edmtrain.com/dallas-tx/odesza-433488
 *  - https://edmtrain.com/austin-tx/opiuo-parkbreezy-422218
 *  - https://edmtrain.com/festivals/decadence-419678
 */
export async function parseEdmtrainEvent(url: string): Promise<Event> {
  const apiKey = process.env.EDMTRAIN_API_KEY;
  if (!apiKey) {
    throw new Error(
      "EDMTRAIN_API_KEY is not set. Add it to your .env file."
    );
  }

  const eventIdStr = extractEventIdFromUrl(url);
  if (!eventIdStr) {
    throw new Error(`Could not extract event id from URL: ${url}`);
  }
  const eventId = Number(eventIdStr);

  // NOTE: The EDMTrain API does NOT support an "eventId" parameter.
  // We must fetch events and filter client-side on the "id" field.
  const apiUrl = `https://edmtrain.com/api/events?client=${encodeURIComponent(
    apiKey
  )}`;

  const response = await axios.get(apiUrl);
  const data = response.data;

  if (!data || !Array.isArray(data.data)) {
    throw new Error("Unexpected EDMTrain API response format.");
  }

  const apiEvent = data.data.find((e: any) => e.id === eventId);
  if (!apiEvent) {
    throw new Error(`No event with id ${eventId} found in EDMTrain API response.`);
  }

  const title = buildTitle(apiEvent);
  const { start, end } = resolveDateTimes(apiEvent);

  const venueName: string | undefined = apiEvent.venue?.name || undefined;
  const city: string | undefined = apiEvent.venue?.location || undefined;

  const description = buildDescription(apiEvent, url);

  return {
    title,
    start,
    end,
    venue: venueName,
    city,
    url,
    description,
  };
}

/**
 * Extract the numeric id from the tail of an EDMTrain URL.
 * e.g. https://edmtrain.com/dallas-tx/odesza-433488 -> "433488"
 */
function extractEventIdFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const segments = u.pathname.split("/").filter(Boolean);
    const last = segments[segments.length - 1];
    if (!last) return null;
    const match = last.match(/(\d+)$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Build a human-friendly title.
 * If the event has artists, use them (e.g. "ODESZA – Dallas").
 * Otherwise fall back to name or a generic title.
 */
function buildTitle(apiEvent: any): string {
  const artists =
    Array.isArray(apiEvent.artistList) && apiEvent.artistList.length > 0
      ? apiEvent.artistList
          .map((a: any) => a.name)
          .filter(Boolean)
      : [];

  const city = apiEvent.venue?.location;

  if (artists.length > 0 && city) {
    return `${artists.join(", ")} – ${city}`;
  }

  if (artists.length > 0) {
    return artists.join(", ");
  }

  if (apiEvent.name) {
    return apiEvent.name;
  }

  return "Untitled Event";
}

/**
 * Build description: artists, venue info, and the EDMTrain URL.
 */
function buildDescription(apiEvent: any, url: string): string {
  const parts: string[] = [];

  if (Array.isArray(apiEvent.artistList) && apiEvent.artistList.length > 0) {
    const artistNames = apiEvent.artistList
      .map((a: any) => a.name)
      .filter(Boolean);
    if (artistNames.length > 0) {
      parts.push(`Artists: ${artistNames.join(", ")}`);
    }
  }

  if (apiEvent.venue) {
    const venueBits: string[] = [];
    if (apiEvent.venue.name) venueBits.push(apiEvent.venue.name);
    if (apiEvent.venue.address) venueBits.push(apiEvent.venue.address);
    if (apiEvent.venue.location) venueBits.push(apiEvent.venue.location);
    if (venueBits.length > 0) {
      parts.push(`Venue: ${venueBits.join(" • ")}`);
    }
  }

  parts.push(url);

  return parts.join("\n");
}

/**
 * Resolve start/end Date from EDMTrain event data.
 * EDMTrain gives local date (YYYY-MM-DD) and may give startTime/endTime
 * for some events (especially live streams). For others, we use your
 * default window of 21:00–02:00.
 */
function resolveDateTimes(apiEvent: any): { start: Date; end: Date } {
  const dateStr: string | undefined = apiEvent.date;
  const startTimeStr: string | undefined =
    apiEvent.startTime || apiEvent.startTimeUtc;
  const endTimeStr: string | undefined =
    apiEvent.endTime || apiEvent.endTimeUtc;

  if (!dateStr) {
    const now = new Date();
    return {
      start: defaultStartFromDate(now),
      end: defaultEndFromDate(now),
    };
  }

  const [yearStr, monthStr, dayStr] = dateStr.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr) - 1; // JS Date months are 0-based
  const day = Number(dayStr);

  const baseDate = new Date(year, month, day);
  if (!isValidDate(baseDate)) {
    const now = new Date();
    return {
      start: defaultStartFromDate(now),
      end: defaultEndFromDate(now),
    };
  }

  if (startTimeStr) {
    const start = applyTimeToDate(baseDate, startTimeStr);
    let end: Date;

    if (endTimeStr) {
      end = applyTimeToDate(baseDate, endTimeStr);
      if (end <= start) {
        end.setDate(end.getDate() + 1);
      }
    } else {
      end = defaultEndFromDate(baseDate);
    }

    return { start, end };
  }

  // No explicit times -> default 9pm–2am window.
  return {
    start: defaultStartFromDate(baseDate),
    end: defaultEndFromDate(baseDate),
  };
}

/**
 * Apply "HH:mm:ss" or "HH:mm" to a given base date.
 */
function applyTimeToDate(base: Date, timeStr: string): Date {
  const [hStr, mStr = "0", sStr = "0"] = timeStr.split(":");
  const hours = Number(hStr);
  const minutes = Number(mStr);
  const seconds = Number(sStr);

  const result = new Date(base);
  result.setHours(hours, minutes, seconds, 0);
  return result;
}
