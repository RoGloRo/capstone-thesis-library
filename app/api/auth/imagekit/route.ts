import config from "@/lib/config";
import ImageKit from "imagekit";
import { NextResponse } from "next/server";

const {
  env: {
    imagekit: { publicKey, privateKey, urlEndpoint },
  },
} = config;

// Initialize ImageKit SDK
const imagekit = new ImageKit({
  publicKey,
  privateKey,
  urlEndpoint,
});

// --------------------------
// Allowed Origins
// --------------------------
const allowedOrigins = [
  "https://capstone-thesis-library.vercel.app", // production
  "http://localhost:3000",                      // local development
];

const vercelPreviewRegex = /\.vercel\.app$/;

// Utility to build CORS response
function createCorsResponse(body: unknown, origin: string | null) {
  return new NextResponse(JSON.stringify(body), {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": origin || "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

// --------------------------
// OPTIONS (Preflight)
// --------------------------
export async function OPTIONS(request: Request) {
  const origin = request.headers.get("origin") || "";

  const isAllowed =
    origin === "" ||
    allowedOrigins.includes(origin) ||
    vercelPreviewRegex.test(origin);

  if (!isAllowed) {
    return new Response("Origin not allowed", { status: 403 });
  }

  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": origin || "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

// --------------------------
// GET (ImageKit Auth)
// --------------------------
export async function GET(request: Request) {
  const origin = request.headers.get("origin") || "";

  const isAllowed =
    origin === "" ||
    allowedOrigins.includes(origin) ||
    vercelPreviewRegex.test(origin);

  if (!isAllowed) {
    return new Response("Origin not allowed", { status: 403 });
  }

  // Generate ImageKit auth parameters
  const authParams = imagekit.getAuthenticationParameters();

  return createCorsResponse(authParams, origin);
}
