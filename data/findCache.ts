import "@std/dotenv/load";
import { ReferenceMatch } from "@jakeave/scripture-ref/types";

const kv = await Deno.openKv(Deno.env.get("KV_PATH"));

const EXPIRY = 3 * 60 * 60 * 1000;

const makeKey = (keyParams: string): Deno.KvKey => ["find-cache", keyParams];

export async function storeResults(
  keyParams: string,
  data: ReferenceMatch[]
): Promise<ReferenceMatch[]> {
  const transaction = data.reduce((tx, d, idx) => {
    const key = [...makeKey(keyParams), idx];
    return tx
      .check({ key, versionstamp: null })
      .set(key, d, { expireIn: EXPIRY });
  }, kv.atomic());

  await transaction.commit();

  return data;
}

export async function getResults(
  keyParams: string,
  { start, end }: { start: number; end: number }
): Promise<ReferenceMatch[] | null> {
  const list = kv.list<ReferenceMatch>({
    start: [...makeKey(keyParams), start],
    end: [...makeKey(keyParams), end],
  });

  const results: ReferenceMatch[] = [];
  for await (const { value } of list) {
    results.push(value);
  }

  return results;
}

export async function doesResultExist(keyParams: string): Promise<boolean> {
  const result = await kv.get<ReferenceMatch>([...makeKey(keyParams), 0]);
  return !!result.value;
}
