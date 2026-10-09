import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

function resolveGatewayBase() {
  const candidates = [
    process.env.LOCAL_TAX_REFUND_API_URL,
    process.env.AUTH_GATEWAY_BASE_URL,
    process.env.NEXT_PUBLIC_TAX_REFUND_API_URL,
    process.env.STORE_API_BASE_URL,
  ];

  const value = candidates.find((candidate) => typeof candidate === "string" && candidate.trim().length > 0);

  if (!value) {
    return "https://api-gateway.delamibrands.com/api";
  }

  return value.trim().replace(/\/+$/, "");
}

function buildUpstreamUrl(baseUrl: string, segments: string[]) {
  const safeSegments = segments
    .filter((segment) => !!segment && segment !== "api")
    .map((segment) => {
      const normalized = segment.toLowerCase();
      if (normalized === "customer") {
        return "tax-refund-customer";
      }
      return segment;
    });

  if (safeSegments.length === 0) {
    return new URL(baseUrl);
  }

  const normalizedBase = baseUrl.replace(/localhost/gi, "127.0.0.1").replace(/\/+$/, "");
  const suffix = safeSegments.join("/");

  return new URL(`${normalizedBase}/${suffix}`);
}

async function proxy(request: NextRequest, context: RouteContext) {
  console.log("=================================");
  console.log("GW PROXY HIT");
  console.log("Method:", request.method);
  console.log("Incoming URL:", request.url);
  console.log("=================================");

  const { path } = await context.params;
  console.log("Path:", path);

  if (!path || path.length === 0) {
    return NextResponse.json(
      {
        success: false,
        message: "Path API tidak valid.",
      },
      { status: 400 }
    );
  }

  const firstSegment = path[0]?.toLowerCase();

  if (firstSegment === "auth") {
    return NextResponse.json(
      {
        success: false,
        message: "Rute auth tidak boleh dipanggil lewat /api/gw. Gunakan /api/auth/login atau endpoint auth yang benar.",
      },
      { status: 400 }
    );
  }

  const targetBase = resolveGatewayBase();
  const upstreamUrl = buildUpstreamUrl(targetBase, path);

  request.nextUrl.searchParams.forEach((value, key) => {
    upstreamUrl.searchParams.set(key, value);
  });

  console.log("===== PROXY UPSTREAM =====");
  console.log("Method:", request.method);
  console.log("URL:", upstreamUrl.toString());
  console.log("==========================");

  const headers = new Headers();
  const authorization = request.headers.get("authorization");
  if (authorization) {
    headers.set("Authorization", authorization);
  }

  const contentType = request.headers.get("content-type");
  if (contentType) {
    headers.set("Content-Type", contentType);
  }

  headers.set("Accept", request.headers.get("accept") ?? "application/json");

  const method = request.method.toUpperCase();
  const hasBody = method !== "GET" && method !== "HEAD";
  const body = hasBody ? await request.arrayBuffer() : undefined;

  try {
    const upstream = await fetch(upstreamUrl.toString(), {
      method,
      headers,
      body: body && body.byteLength > 0 ? body : undefined,
      cache: "no-store",
    });

    console.log("UPSTREAM STATUS:", upstream.status);

    const responseHeaders = new Headers();
    const upstreamContentType = upstream.headers.get("content-type");
    if (upstreamContentType) {
      responseHeaders.set("Content-Type", upstreamContentType);
    }

    const contentDisposition = upstream.headers.get("content-disposition");
    if (contentDisposition) {
      responseHeaders.set("Content-Disposition", contentDisposition);
    }

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (error) {
    const cause =
      error instanceof Error
        ? String((error as Error & { cause?: { code?: string } }).cause?.code ?? error.message)
        : "unknown";

    console.error("PROXY FETCH ERROR:", error);

    const isLocalApi =
      upstreamUrl.hostname === "127.0.0.1" || upstreamUrl.hostname === "localhost";

    return NextResponse.json(
      {
        success: false,
        message: isLocalApi
          ? `Tidak dapat terhubung ke tax-refund-api di ${upstreamUrl.origin}. Pastikan API berjalan.`
          : "Tidak dapat terhubung ke API Gateway.",
        detail: cause,
      },
      { status: 502 }
    );
  }
}

export function GET(request: NextRequest, context: RouteContext) {
  return proxy(request, context);
}

export function POST(request: NextRequest, context: RouteContext) {
  return proxy(request, context);
}

export function PUT(request: NextRequest, context: RouteContext) {
  return proxy(request, context);
}

export function PATCH(request: NextRequest, context: RouteContext) {
  return proxy(request, context);
}

export function DELETE(request: NextRequest, context: RouteContext) {
  return proxy(request, context);
}