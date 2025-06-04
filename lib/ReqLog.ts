import { monotonicUlid } from "@std/ulid";
import { addLog, finishLog, type RequestLog } from "../data/logs.ts";

export class ReqLog {
  #id: string;
  #addingPromise?: Promise<RequestLog | null>;
  #endingPromise?: Promise<RequestLog | null>;

  constructor() {
    this.#id = monotonicUlid();
  }

  start({ created_at, url }: { created_at: Date; url: URL }): ReqLog {
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

  async end({
    time,
    status,
  }: {
    time: number;
    status: number;
  }): Promise<ReqLog> {
    const added = await this.getAddedLog();

    this.#endingPromise = added
      ? finishLog({ id: this.#id, time, status })
      : undefined;

    return this;
  }

  async getAddedLog(): Promise<RequestLog | null> {
    const added = await this.#addingPromise;
    return added || null;
  }

  async getEndedLog(): Promise<RequestLog | null> {
    const added = await this.getAddedLog();
    if (added) {
      const ended = await this.#endingPromise;
      return ended || null;
    }
    return null;
  }
}
