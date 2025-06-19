import "@std/dotenv/load";
import routes from "./routes.ts";
import { ReqLog } from "./lib/ReqLog.ts";
import { getBlockedIps } from "./data/blockedIPs.ts";
import about from "./handlers/about.ts";

export interface JSONObj {
  [key: string]: string | number | string[] | number[] | JSONObj;
}

export type ResponseOptions = {
  status?: number;
  type?: "application/json" | "image/png" | "image/x-icon";
  headers?: HeadersInit;
};

export type Payload = {
  status: number;
  data: JSONObj | Promise<JSONObj> | Uint8Array | Promise<Uint8Array>;
  type: "application/json" | "image/png" | "image/x-icon";
  headers: HeadersInit;
};

export type ResponseProps = {
  respond: (data: JSONObj | Uint8Array, options?: ResponseOptions) => Payload;
};

export type Context = {
  req: Request;
  url: URL;
  params: Record<string, string | number>;
  data: JSONObj;
  ip: string;
};

async function handler(
  req: Request,
  info: Deno.ServeHandlerInfo
): Promise<Response> {
  const start = new Date();
  const url = new URL(req.url);
  const pathname = url.pathname;

  const ip =
    info.remoteAddr && info.remoteAddr.transport === "tcp"
      ? info.remoteAddr.hostname
      : "unknown";
  console.log("Client IP:", ip);

  const reqLog = new ReqLog().start({ created_at: start, url, ip });
  console.log("Request:", url.href);

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

  const staticEtag = Deno.env.get("STATIC_E_TAG");
  const requestEtag = req.headers.get("If-None-Match");

  if (requestEtag === staticEtag) {
    return new Response(null, {
      status: 304,
      headers: {
        ETag: staticEtag,
        "Cache-Control": "public, max-age=604800",
      },
    });
  }

  const resp: ResponseProps = {
    respond: (data: JSONObj | Uint8Array, options?: ResponseOptions) => {
      return {
        data,
        status: options?.status || 200,
        type: options?.type || "application/json",
        headers: options?.headers || {},
      };
    },
  };

  let result: undefined | Payload;

  if (blockedIps[ip]) {
    result = about({ req, url, params: {}, data: {}, ip }, resp);
  } else {
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
        result = await route.handler({ req, url, params, data: {}, ip }, resp);
        break;
      }
    }
  }

  if (!result) {
    result = {
      status: 404,
      data: { error: "Not Found" },
      type: "application/json",
      headers: {},
    };
  }

  if (result.data instanceof Promise) {
    await result.data;
  }

  const blockedIp = (result.data as JSONObj).blocked as string;

  if (blockedIp) {
    blockedIps[blockedIp] = true;
    delete (result.data as JSONObj).blocked;
    await new Promise((resolve) => {
      setTimeout(resolve, Number(Deno.env.get("BAD_TIMEOUT")) || 600000);
    });
  }

  const processingTime = new Date().getTime() - start.getTime();

  const headers = {
    "Content-Type": result.type,
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    ...result.headers,
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

const blockedIps = await getBlockedIps();

Deno.serve({
  port: Number(Deno.env.get("PORT")),
  hostname: Deno.env.get("HOSTNAME"),
  handler,
  onListen({ port, hostname }) {
    console.log(`Server started at http://[${hostname}]:${port}`);
  },
});
