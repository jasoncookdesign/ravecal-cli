// src/utils/file.ts

import * as fs from "fs";
import * as path from "path";

/**
 * Resolve input into URLs:
 * - If input starts with http/https, treat it as a single URL.
 * - Otherwise treat it as a file path and read URLs from it.
 */
export async function getUrlsFromInput(input: string): Promise<string[]> {
  const trimmed = input.trim();

  // Case 1: It's a URL
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return [trimmed];
  }

  // Case 2: It's a file path
  const fullPath = path.resolve(trimmed);

  if (!fs.existsSync(fullPath)) {
    throw new Error(`Input is not a URL and file does not exist: ${input}`);
  }

  const text = await fs.promises.readFile(fullPath, "utf8");

  const urls = text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.startsWith("http://") || line.startsWith("https://"));

  if (urls.length === 0) {
    throw new Error(`No URLs found in file: ${input}`);
  }

  return urls;
}

// Ensure this file is always treated as a module
export {};
