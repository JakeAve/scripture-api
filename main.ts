import "@std/dotenv/load";
import routes from "./routes.ts";
import { ReqLog } from "./lib/ReqLog.ts";

export interface JSONObj {
  [key: string]: string | number | string[] | number[] | JSONObj;
}

export type ResponseOptions = {
  status?: number;
  type?: "application/json" | "image/png" | "image/x-icon";
};

export type Payload = {
  status: number;
  data: JSONObj | Promise<JSONObj> | Uint8Array | Promise<Uint8Array>;
  type: "application/json" | "image/png" | "image/x-icon";
};

export type ResponseProps = {
  respond: (data: JSONObj | Uint8Array, options?: ResponseOptions) => Payload;
};

export type Context = {
  req: Request;
  url: URL;
  params: Record<string, string | number>;
  data: JSONObj;
};

async function handler(req: Request): Promise<Response> {
  const start = new Date();
  const url = new URL(req.url);
  const pathname = url.pathname;

  const reqLog = new ReqLog().start({ created_at: start, url });
  console.log("Request", url.href);

  const ip =
    req.headers.get("x-forwarded-for") ||
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
    respond: (data: JSONObj | Uint8Array, options?: ResponseOptions) => {
      return {
        data,
        status: options?.status || 200,
        type: options?.type || "application/json",
      };
    },
  };

  let result: undefined | Payload;

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
      result = await route.handler({ req, url, params, data: {} }, resp);
      break;
    }
  }

  if (!result) {
    result = {
      status: 404,
      data: { error: "Not Found" },
      type: "application/json",
    };
  }

  if (result.data instanceof Promise) {
    await result.data;
  }

  const processingTime = new Date().getTime() - start.getTime();

  const headers = {
    "Content-Type": result.type,
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  let payload: string | Uint8Array;

  if (result.data instanceof Uint8Array) {
    payload = result.data;
  } else {
    const meta: JSONObj = {
      path: pathname,
      search: url.search,
      processingTime: `${processingTime}ms`,
      status: result.status,
    };
    (result.data as JSONObj).meta = meta;
    payload = JSON.stringify(result.data);
  }

  const response = new Response(payload, {
    status: result.status,
    headers,
  });
  
  reqLog.end({ time: processingTime, status: result.status });
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
