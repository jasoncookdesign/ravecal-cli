// src/parser/ra.ts
import axios from "axios";
import * as cheerio from "cheerio";
import { Event } from "../models/event";
import { fetchHtml } from "../utils/fetch";
import {
  defaultDateTimes,
  defaultStartFromDate,
  defaultEndFromDate,
  isValidDate,
  parseDateFromText,
  parseTimeRangeFromText,
} from "../utils/time";

/**
 * Parse a Resident Advisor event page into a normalized Event object.
 * NOTE: RA's HTML structure can change; you may need to tweak selectors
 * after inspecting a real event page in your browser's dev tools.
 */
export async function parseRaEvent(url: string): Promise<Event> {
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);

  const title = extractTitle($) || "Untitled Event";
  const { start, end } = extractDateTimes($) || defaultDateTimes();
  const venue = extractVenue($);
  const city = extractCity($);
  const description = extractDescription($);

  return {
    title,
    start,
    end,
    venue,
    city,
    url,
    description,
  };
}

/**
 * Try a few different ways of getting the event title.
 */
function extractTitle($: cheerio.CheerioAPI): string | undefined {
  const candidates = [
    "h1",
    'h1[data-test="event-title"]',
    'meta[property="og:title"]',
  ];

  for (const selector of candidates) {
    if (selector.startsWith("meta")) {
      const content = $(selector).attr("content");
      if (content && content.trim()) return content.trim();
    } else {
      const text = $(selector).first().text().trim();
      if (text) return text;
    }
  }

  return undefined;
}

/**
 * Try to extract a date and time range. If we fail, return undefined so we can fall back to defaults.
 */
function extractDateTimes(
  $: cheerio.CheerioAPI
): { start: Date; end: Date } | undefined {
  const timeEls = $("time");

  if (timeEls.length > 0) {
    const first = timeEls.first();
    const dt = first.attr("datetime");
    if (dt) {
      const start = new Date(dt);

      // Try to find an explicit end time (second <time> or itemprop=endDate)
      let end: Date | undefined;

      const second = timeEls.eq(1);
      const endAttr =
        second.attr("datetime") ||
        $('time[itemprop="endDate"]').attr("datetime");

      if (endAttr) {
        end = new Date(endAttr);
      }

      if (!isValidDate(start)) return undefined;
      if (!end || !isValidDate(end)) {
        end = defaultEndFromDate(start);
      }

      return { start, end };
    }
  }

  const dateText =
    $('[data-test="event-date"]').text().trim() ||
    $('[class*="EventDate"]').first().text().trim() ||
    $("body").text();

  const parsedBase = parseDateFromText(dateText);
  if (!parsedBase) return undefined;

  const timeRange = parseTimeRangeFromText(dateText, parsedBase);
  if (timeRange) return timeRange;

  return {
    start: defaultStartFromDate(parsedBase),
    end: defaultEndFromDate(parsedBase),
  };
}

/**
 * Extract venue name from commonly used selectors.
 */
function extractVenue($: cheerio.CheerioAPI): string | undefined {
  const candidates = [
    '[data-test="event-venue"]',
    '[class*="Venue"]',
    'a[href*="/clubs/"]',
  ];

  for (const selector of candidates) {
    const text = $(selector).first().text().trim();
    if (text) return text;
  }

  return undefined;
}

/**
 * Extract city/location. Might be in a location block near venue.
 */
function extractCity($: cheerio.CheerioAPI): string | undefined {
  const candidates = [
    '[data-test="event-location"]',
    '[class*="Location"]',
    '[class*="Region"]',
  ];

  for (const selector of candidates) {
    const text = $(selector).first().text().trim();
    if (text) return text;
  }

  return undefined;
}

/**
 * Extract a longer description for the notes field.
 */
function extractDescription($: cheerio.CheerioAPI): string | undefined {
  // Try specific description containers first:
  const candidates = [
    '[data-test="event-description"]',
    '[class*="EventDescription"]',
    '[class*="Copy"]',
  ];

  for (const selector of candidates) {
    const text = $(selector).text().trim();
    if (text) return text;
  }

  // Fallback to meta description
  const metaDesc = $('meta[name="description"]').attr("content");
  if (metaDesc && metaDesc.trim()) return metaDesc.trim();

  return undefined;
}
