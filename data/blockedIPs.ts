import "@std/dotenv/load";

const kv = await Deno.openKv(Deno.env.get("KV_PATH"));

export interface BlockedIp {
  ip: string;
  created_at: Date;
  updated_at: Date | null;
  requests: number;
}

export async function blockIp(ip: string): Promise<BlockedIp | undefined> {
  try {
    const data = {
      ip,
      created_at: new Date(),
      updated_at: null,
      requests: 1,
    };

    const key = ["blocked", "ip", ip];

    const getIp = await kv.get<BlockedIp>(key);
    const val = getIp.value;

    if (!val) {
      await kv.set(key, data);
    } else {
      await kv.set(key, {
        ...val,
        requests: val.requests + 1,
        updated_at: new Date(),
      });
    }
    return val || data;
  } catch (e) {
    console.error(`Could not add blocked ip, ${e}`);
  }
}

export async function getBlockedIps(): Promise<Record<string, true>> {
  const entries = kv.list<BlockedIp>({ prefix: ["blocked"] });

  const ips: Record<string, true> = {};

  for await (const entry of entries) {
    if (entry.value) {
      ips[entry.value.ip] = true;
    }
  }

  return ips;
}
