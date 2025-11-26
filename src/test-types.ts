// Additional types for test utilities
export type DoneCallback = (err?: unknown) => void;
export type ErrorCallback = (msg: string) => void;
export type ValidationFunction<T = unknown> = (value: T) => boolean | string[] | number[];
