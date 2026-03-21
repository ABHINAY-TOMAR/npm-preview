declare module 'portfinder' {
  interface PortFinderOptions {
    port?: number;
    host?: string;
    stopPort?: number;
  }

  interface PortFinder {
    getPort(options: PortFinderOptions, callback: (err: Error | null | undefined, port: number) => void): void;
  }

  const portfinder: PortFinder;
  export = portfinder;
}
