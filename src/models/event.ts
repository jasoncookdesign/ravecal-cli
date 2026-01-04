export interface Event {
  title: string;
  start: Date;
  end: Date;
  venue?: string;
  city?: string;
  url: string;
  description?: string;
}

// This ensures TypeScript *always* treats this file as a module
export {};
