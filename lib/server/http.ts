import { NextResponse } from "next/server";

export const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });

export async function body<T>(req: Request): Promise<Partial<T>> {
  try {
    return (await req.json()) as Partial<T>;
  } catch {
    return {};
  }
}

/** Turns thrown errors into JSON responses; unexpected ones are logged and hidden. */
export async function handle(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (e) {
    const err = e as Error & { status?: number; extra?: Record<string, unknown> };
    if (err.status) return json({ error: err.message, ...(err.extra ?? {}) }, err.status);
    console.error(e);
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
}
