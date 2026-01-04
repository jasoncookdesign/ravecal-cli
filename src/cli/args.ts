// src/cli/args.ts
import { getUrlsFromInput } from "../utils/file";

export interface CliOptions {
  input: string;            // URL or file path
  urls: string[];           // resolved URL list
  outFile: string;          // output ICS filename
  googleCalendar: boolean;  // whether to use Google Calendar API
  verbose: boolean;         // log more details
}

export async function parseCliArgs(
  argv: string[] = process.argv.slice(2)
): Promise<CliOptions> {
  if (argv.length === 0) {
    throw new Error(
      "Usage: events-cli <url | file> [--out events.ics] [--google-calendar] [--verbose]"
    );
  }

  // First non-flag argument: URL or file
  const input = argv.find(arg => !arg.startsWith("--"));
  if (!input) {
    throw new Error("Missing input. Provide a URL or a path to a text file.");
  }

  // Flags
  const outIndex = argv.indexOf("--out");
  const outFile =
    outIndex !== -1 && argv[outIndex + 1]
      ? argv[outIndex + 1]
      : "events.ics";

  const googleCalendar = argv.includes("--google-calendar");
  const verbose = argv.includes("--verbose");

  // Resolve URLs using the shared helper
  const urls = await getUrlsFromInput(input);

  if (urls.length === 0) {
    throw new Error(`No URLs found from input: ${input}`);
  }

  return {
    input,
    urls,
    outFile,
    googleCalendar,
    verbose,
  };
}
