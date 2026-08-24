interface JobHunterChromeApi {
  runtime: {
    sendMessage(message: unknown): Promise<unknown>;
    onMessage: { addListener(listener: (message: unknown, sender: unknown, sendResponse: (response: unknown) => void) => boolean | void): void };
  };
  storage: {
    local: {
      get(keys: string[]): Promise<Record<string, unknown>>;
      set(values: Record<string, unknown>): Promise<void>;
    };
  };
}
declare const chrome: JobHunterChromeApi;