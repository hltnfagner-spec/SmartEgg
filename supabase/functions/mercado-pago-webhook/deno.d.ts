// Deno types for Supabase Edge Functions
declare namespace Deno {
  export interface Env {
    get(key: string): string | undefined;
  }
}

declare const Deno: typeof globalThis.Deno & {
  env: {
    get(key: string): string | undefined;
  };
};
