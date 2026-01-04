import * as fs from "fs"
import "dotenv/config";
import { parseCliArgs } from "./cli/args";
import { parseEventFromUrl } from "./parser";
import { generateIcs } from "./calendar/ics";
import { Event } from "./models/event";

async function main() {
  try {
    const options = await parseCliArgs();

    if (options.googleCalendar) {
      console.error(
        "Google Calendar integration is not implemented yet. Omit --google-calendar to generate an ICS file instead."
      );
      process.exit(1);
    }

    if (options.verbose) {
      console.log("Input:", options.input);
      console.log("Output file:", options.outFile);
      console.log("URLs to process:", options.urls.length);
    }

    const events: Event[] = [];

    for (const url of options.urls) {
      if (options.verbose) {
        console.log(`Processing URL: ${url}`);
      }

      try {
        const event = await parseEventFromUrl(url);
        events.push(event);
        console.log(`✔ Parsed event: ${event.title}`);
      } catch (err) {
        console.warn(
          `✖ Failed to parse ${url}: ${(err as Error).message || err}`
        );
      }
    }

    if (events.length === 0) {
      console.error("No events were successfully parsed. Exiting.");
      process.exit(1);
    }

    const icsContent = generateIcs(events);

    fs.writeFileSync(options.outFile, icsContent, "utf8");

    console.log(
      `✅ Wrote ${events.length} event(s) to ${options.outFile}. Import this file into your calendar.`
    );
  } catch (err) {
    console.error(`Error: ${(err as Error).message || err}`);
    process.exit(1);
  }
}

main();
