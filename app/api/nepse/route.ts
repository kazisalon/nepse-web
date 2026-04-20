import { NextRequest, NextResponse } from "next/server";

const PYTHON_API_BASE = "http://127.0.0.1:8001";

async function proxyToPython(
  request: NextRequest,
  options: { method: string; body?: string }
) {
  try {
    if (process.env.NODE_ENV !== "development") {
      throw new Error("Python proxy is for development only; on Vercel use the serverless Python function.");
    }

    const searchParams = request.nextUrl.searchParams.toString();
    const upstreamPath = "/api/nepse" + (searchParams ? "?" + searchParams : "");
    const upstreamUrl = PYTHON_API_BASE + upstreamPath;

    const res = await fetch(upstreamUrl, {
      method: options.method,
      headers: {
        "User-Agent": "NEPSELab (Next.js proxy)",
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
      },
      ...(options.body ? { body: options.body } : {}),
    });

    if (!res.ok) {
      throw new Error(`Python API failed: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    const response = NextResponse.json(data);
    const cacheControl = res.headers.get("Cache-Control");
    if (cacheControl) {
      response.headers.set("Cache-Control", cacheControl);
    }
    return response;
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: { message: (err as Error)?.message ?? "Proxy error", type: (err as Error)?.name ?? "Error" } },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }
}

export async function GET(request: NextRequest) {
  return proxyToPython(request, { method: "GET" });
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  return proxyToPython(request, { method: "POST", body });
}
