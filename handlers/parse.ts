import type { Context, Payload, Resp, ResponseProps } from "../main.ts";
import { parseRef as parseRefServer } from "@jakeave/scripture-ref/server";
import { parseRef } from "@jakeave/scripture-ref/client";

export default function parse(context: Context, resp: ResponseProps): Payload {
  const ref = context.url.searchParams.get("ref");
  const content = context.url.searchParams.get("content");

  if (!ref) {
    return resp.respond({ results: [], input: "" });
  }

  if (content === "true") {
    const result = parseRefServer(ref) as unknown as Resp;
    return resp.respond({ result, input: ref });
  }

  const result = parseRef(ref) as unknown as Resp;
  return resp.respond({ result, input: ref });
}
