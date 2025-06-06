import "@std/dotenv/load";

import { blockIp } from "../data/blockedIPs.ts";
import type { Context, Payload, ResponseProps } from "../main.ts";

export default function about(context: Context, resp: ResponseProps): Payload {
  const { ip } = context;
  console.log("Blocking IP:", ip);
  blockIp(ip);

  return resp.respond({ blocked: ip }, { status: 404 });
}
