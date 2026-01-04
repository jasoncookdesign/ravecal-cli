# RaveCal CLI

A command-line tool to parse electronic music event listings from **EDMTrain** and **Resident Advisor (RA)** and generate calendar files (`.ics`) that you can import into any calendar application.

## Features

- 🎵 **EDMTrain Integration**: Fetch event details via the official EDMTrain API
- 🎧 **Resident Advisor Support**: Parse event pages from RA using web scraping
- 📅 **ICS Generation**: Create standard calendar files compatible with Google Calendar, Apple Calendar, Outlook, etc.
- 📝 **Batch Processing**: Process multiple events at once from a text file
- ✨ **Rich Event Data**: Includes artist names, venue information, dates/times, and descriptions
- ⚡ **TypeScript**: Fully typed for reliability and maintainability

## Installation

### Prerequisites

- **Node.js** (v18 or higher recommended)
- **npm** (comes with Node.js)
- **EDMTrain API Key** (for EDMTrain events) - [Get one here](https://edmtrain.com/api)

### Setup

1. Clone this repository:
   ```bash
   git clone <your-repo-url>
   cd ravecal-cli
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the project root:
   ```bash
   touch .env
   ```

4. Add your EDMTrain API key to `.env`:
   ```
   EDMTRAIN_API_KEY=your_api_key_here
   ```

## Usage

### Basic Syntax

```bash
npm run dev <url | file> [options]
```

### Arguments

- **`<url | file>`** (required): Either a single event URL or path to a text file containing URLs
- **`--out <filename>`** (optional): Output filename (default: `events.ics`)
- **`--verbose`** (optional): Enable detailed logging
- **`--google-calendar`** (optional): Not yet implemented

### Supported Event URLs

#### EDMTrain
- Single events: `https://edmtrain.com/dallas-tx/odesza-433488`
- Festival events: `https://edmtrain.com/festivals/decadence-419678`

#### Resident Advisor
- Event pages: `https://ra.co/events/123456`

### Examples

#### Parse a single event
```bash
npm run dev https://edmtrain.com/dallas-tx/odesza-433488
```

#### Parse multiple events from a file
Create a text file (`events.txt`) with one URL per line:
```
https://edmtrain.com/dallas-tx/odesza-433488
https://edmtrain.com/austin-tx/disclosure-422218
https://ra.co/events/123456
```

Then run:
```bash
npm run dev events.txt
```

#### Specify custom output file
```bash
npm run dev events.txt --out my-rave-calendar.ics
```

#### Enable verbose logging
```bash
npm run dev events.txt --verbose
```

### Output

The tool generates an `.ics` file that includes:
- **Event Title**: Artist names and city (e.g., "ODESZA – Dallas")
- **Date & Time**: Automatically extracted from API/webpage
  - Defaults to 9:00 PM - 2:00 AM if specific times aren't available
- **Location**: Venue name and city
- **Description**: Artist lineup, venue details, and original event URL
- **URL**: Link back to the original event page

### Importing to Your Calendar

#### Google Calendar
1. Open [Google Calendar](https://calendar.google.com)
2. Click the **+** next to "Other calendars"
3. Select **Import**
4. Choose your `.ics` file
5. Select destination calendar and click **Import**

#### Apple Calendar
1. Double-click the `.ics` file
2. Choose which calendar to add events to
3. Click **OK**

#### Outlook
1. Open Outlook
2. Go to **File** > **Open & Export** > **Import/Export**
3. Select **Import an iCalendar (.ics) or vCalendar file**
4. Browse to your `.ics` file and click **OK**

## Architecture

```
src/
├── index.ts              # Main entry point
├── cli/
│   └── args.ts          # Command-line argument parsing
├── parser/
│   ├── index.ts         # URL dispatcher
│   ├── edmtrain.ts      # EDMTrain API integration
│   └── ra.ts            # Resident Advisor scraper
├── calendar/
│   ├── ics.ts           # ICS file generation
│   └── google.ts        # (Future) Google Calendar API
├── models/
│   └── event.ts         # Event data model
├── config/
│   └── env.ts           # Environment configuration
└── utils/
    ├── fetch.ts         # HTTP request wrapper
    ├── file.ts          # File I/O helpers
    └── time.ts          # Date/time utilities
```

## How It Works

### EDMTrain Events

1. **Extract Event ID**: Parses the numeric ID from the URL (e.g., `433488`)
2. **API Request**: Fetches all events from `https://edmtrain.com/api/events?client={apiKey}`
3. **Filter & Parse**: Finds the matching event by ID and extracts:
   - Artist list
   - Venue name and location
   - Date and time (defaults to 9 PM - 2 AM if not specified)
4. **Format**: Creates a formatted event with title like "Artist 1, Artist 2 – City"

### Resident Advisor Events

1. **Fetch HTML**: Downloads the event page
2. **Parse DOM**: Uses Cheerio to extract data from HTML elements:
   - Title from `<h1>` or meta tags
   - Date/time from `<time>` elements
   - Venue and city from page structure
3. **Format**: Creates a standardized event object

### ICS Generation

- Uses the `ics` npm package to create RFC 5545-compliant calendar files
- Converts JavaScript `Date` objects to ICS date-time format
- Includes all event metadata in proper ICS fields

## Default Date/Time Behavior

If an event doesn't specify exact times (common for club events), the tool applies sensible defaults:
- **Start Time**: 9:00 PM (21:00) on the event date
- **End Time**: 2:00 AM (02:00) the following day

These defaults are defined in [`src/utils/time.ts`](src/utils/time.ts) and can be customized.

## Error Handling

The tool gracefully handles failures:
- ✔ Successfully parsed events are included in the output
- ✖ Failed events are logged with error messages
- If **all** events fail to parse, the tool exits with an error
- Individual URL parsing errors don't stop batch processing

## Development

### Run in development mode
```bash
npm run dev <args>
```

### Build for production
```bash
npm run build
```

The compiled JavaScript will be in the `dist/` folder.

### Run built version
```bash
node dist/index.js <args>
```

## Troubleshooting

### "EDMTRAIN_API_KEY is not set"
Make sure you've created a `.env` file in the project root with your API key:
```
EDMTRAIN_API_KEY=your_actual_key_here
```

### "No event with id X found in EDMTrain API response"
The EDMTrain API returns all available events, and the tool filters by ID. This error means:
- The event ID might be incorrect
- The event might not be in the API's current dataset
- Try fetching the URL manually to verify it exists

### "Failed to parse URL"
- Verify the URL is from a supported site (EDMTrain or Resident Advisor)
- Check that the URL is properly formatted
- Use `--verbose` to see detailed error messages

### Events have wrong times
- Check if the source website has explicit times
- If not, the tool uses defaults (9 PM - 2 AM)
- You can adjust these in [`src/utils/time.ts`](src/utils/time.ts)

## Limitations

- **Google Calendar Integration**: Not yet implemented (use `.ics` import instead)
- **EDMTrain API**: Fetches all events to find specific ones (no direct event lookup)
- **RA Scraping**: May break if Resident Advisor changes their HTML structure
- **Timezones**: Events use local machine timezone; no explicit timezone handling

## Future Enhancements

- [ ] Direct Google Calendar API integration
- [ ] Spotify playlist generation from artist lineups
- [ ] Support for additional event sites (e.g., Bandsintown, Songkick)
- [ ] Automatic timezone detection and conversion
- [ ] Event updates/sync (detect changes in existing events)
- [ ] Web interface for non-technical users

## License

This project is intended for personal use. Respect the terms of service of EDMTrain and Resident Advisor when using this tool.

## Credits

Built for ravers who want to keep their calendars organized 🎉

### Dependencies

- [axios](https://axios-http.com/) - HTTP client
- [cheerio](https://cheerio.js.org/) - HTML parsing
- [ics](https://www.npmjs.com/package/ics) - ICS file generation
- [googleapis](https://www.npmjs.com/package/googleapis) - Google Calendar API (future)
- [dotenv](https://www.npmjs.com/package/dotenv) - Environment variable management