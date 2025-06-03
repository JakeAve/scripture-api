import type { Context, Payload, ResponseProps } from "../main.ts";

export default function home(context: Context, resp: ResponseProps): Payload {
  return resp.respond({ routes: context.data?.paths });
}
