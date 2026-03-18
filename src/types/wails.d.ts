export {};

declare global {
  type DesktopFileFilter = {
    name: string;
    extensions: string[];
  };

  type WailsSaveFileRequest = {
    filename: string;
    data: string;
    isBinary: boolean;
    filters: DesktopFileFilter[];
  };

  interface Window {
    go?: {
      main?: {
        App?: {
          SaveFile: (request: WailsSaveFileRequest) => Promise<string>;
        };
      };
    };
    runtime?: Record<string, unknown>;
  }
}
