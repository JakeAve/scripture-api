import { blockIp } from "../data/blockedIPs.ts";
import type { Context, Payload, ResponseProps } from "../main.ts";

export default async function timeout(
  context: Context,
  resp: ResponseProps
): Promise<Payload> {
  await blockIp(context.ip);
  console.log("Blocking IP:", context.ip);

  return new Promise((res) => {
    setTimeout(() => {
      res(resp.respond({ blocked: context.ip }, { status: 404 }));
    }, 600000);
  });
}
