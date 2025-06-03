import { monotonicUlid } from "@std/ulid";
import { addLog, finishLog, type RequestLog } from "../data/logs.ts";

export class ReqLog {
  #id: string;
  #addingPromise?: Promise<RequestLog>;

  constructor() {
    this.#id = monotonicUlid();
  }

  start({ created_at, url }: { created_at: Date; url: URL }) {
    const id = this.#id;
    const log: RequestLog = {
      created_at,
      id,
      path: url.pathname,
      search: url.search,
    };

    this.#addingPromise = addLog(log);

    return this;
  }

  async end({ time, status }: { time: number; status: number }) {
    await this.#addingPromise;

    return finishLog({ id: this.#id, time, status });
  }
}
