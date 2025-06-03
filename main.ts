import "@std/dotenv/load";
import routes from "./routes.ts";
import { ReqLog } from "./lib/ReqLog.ts";

export interface Resp {
  [key: string]: string | number | string[] | number[] | Resp;
}

export type ResponseOptions = {
  status?: number;
};

export type Payload = {
  status: number;
  data: Resp | Promise<Resp>;
};

export type ResponseProps = {
  respond: (data: Resp, options?: ResponseOptions) => Payload;
};

export type Context = {
  req: Request;
  url: URL;
  params: Record<string, string | number>;
  data: Resp;
};

function handler(req: Request): Response | Promise<Response> {
  const start = new Date();
  const url = new URL(req.url);
  const pathname = url.pathname;

  const reqLog = new ReqLog().start({ created_at: start, url });
  console.log("Request", url.href);

  const ip = req.headers.get("x-forwarded-for") ||
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("remoteAddress");

  console.log("Client IP:", ip);

  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  const resp: ResponseProps = {
    respond: (data: Resp, options?: ResponseOptions) => {
      return { data, status: options?.status || 200 };
    },
  };

  let payload: undefined | Payload;

  for (const route of routes) {
    const match = pathname.match(route.pattern);
    if (match) {
      const params: Record<string, string | number> = {};
      route.paramNames.forEach((name, idx) => {
        let m: string | number = match[idx + 1];
        const num = Number(m);
        if (!isNaN(num)) {
          m = num;
        }
        params[name] = m;
      });
      payload = route.handler({ req, url, params, data: {} }, resp);
      break;
    }
  }

  if (!payload) {
    payload = {
      status: 404,
      data: { error: "Not Found" },
    };
  }

  if (payload.data instanceof Promise) {
    payload.data.then((res) => (payload.data = res));
  }

  const processingTime = new Date().getTime() - start.getTime();

  const meta: Resp = {
    path: pathname,
    search: url.search,
    processingTime: `${processingTime}ms`,
    status: payload.status,
  };

  (payload.data as Resp).meta = meta;

  const response = new Response(JSON.stringify(payload.data), {
    status: payload.status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
  reqLog.end({ time: processingTime, status: payload.status });
  return response;
}

Deno.serve({
  port: Number(Deno.env.get("PORT")),
  hostname: Deno.env.get("HOSTNAME"),
  handler,
  onListen({ port, hostname }) {
    console.log(`Server started at http://${hostname}:${port}`);
  },
});
