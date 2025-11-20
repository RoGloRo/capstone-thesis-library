import config from "@/lib/config";
import ImageKit from "imagekit";
import { NextResponse } from "next/server";

const {
  env: {
    imagekit: { publicKey, privateKey, urlEndpoint },
  },
} = config;

const imagekit = new ImageKit({
  publicKey,
  privateKey,
  urlEndpoint,
});

// --------------------------
// Allowed Origins (Safe CORS)
// --------------------------
const allowedOrigins = [
  "https://capstone-thesis-library.vercel.app", // production
  "http://localhost:3000",                      // local dev
  // you may add more here if needed
];

function createCorsResponse(body: any, origin: string | null) {
  return new NextResponse(JSON.stringify(body), {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": origin ? origin : "",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

// --------------------------
// OPTIONS (CORS Preflight)
// --------------------------
export async function OPTIONS(request: Request) {
  const origin = request.headers.get("origin");

  if (origin && allowedOrigins.includes(origin)) {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  return new Response("Origin not allowed", { status: 403 });
}

// --------------------------
// GET Handler
// --------------------------
export async function GET(request: Request) {
  const origin = request.headers.get("origin");

  if (!origin || !allowedOrigins.includes(origin)) {
    return new Response("Origin not allowed", { status: 403 });
  }

  const authParams = imagekit.getAuthenticationParameters();
  return createCorsResponse(authParams, origin);
}
