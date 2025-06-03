import "@std/dotenv/load";

const kv = await Deno.openKv(Deno.env.get("KV_PATH"));

export interface RequestLog {
  id: string;
  path: string;
  search: string;
  time?: number;
  created_at: Date;
  status?: number;
}

const EXPIRY = 90 * 24 * 60 * 60 * 1000;

const logsById = (id: string): Deno.KvKey => ["id", id];
const logsByPath = (path: string, id: string): Deno.KvKey => ["path", path, id];
const logsByStatus = (status: number, id: string): Deno.KvKey => [
  "status",
  status,
  id,
];
const logsBySearch = (search: string, id: string): Deno.KvKey => [
  "search",
  search,
  id,
];

export async function addLog(log: RequestLog): Promise<RequestLog> {
  const idKey = logsById(log.id);
  const res = await kv
    .atomic()
    .check({ key: idKey, versionstamp: null })
    .set(idKey, log, { expireIn: EXPIRY })
    .set(logsByPath(log.path, log.id), idKey, { expireIn: EXPIRY })
    .set(logsBySearch(log.search, log.id), idKey, { expireIn: EXPIRY })
    .commit();

  if (!res.ok) {
    console.error(`Failed to create reqLog ${JSON.stringify(log)}`);
  }

  return log;
}

export async function finishLog({
  id,
  time,
  status,
}: {
  id: string;
  time: number;
  status: number;
}): Promise<RequestLog | void> {
  const idKey = logsById(id);
  const log = await kv.get<RequestLog>(idKey);

  if (!log.value) {
    console.error(`Could not find log ${id}`);
    return;
  }

  const updatedLog = { ...log.value, time, status } as RequestLog;

  const res = await kv
    .atomic()
    .set(idKey, updatedLog)
    .set(logsByStatus(status, id), idKey, { expireIn: EXPIRY })
    .commit();

  if (!res.ok) {
    console.error(`Failed to create reqLog ${JSON.stringify(updatedLog)}`);
  }

  return updatedLog;
}
