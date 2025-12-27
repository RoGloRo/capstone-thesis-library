import { NextRequest, NextResponse } from "next/server";
import config from "@/lib/config";
import { workflowClient } from "@/lib/workflow";

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Email Configuration Diagnostics");
    
    // Check environment variables
    const envCheck = {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
      hasQStashUrl: !!process.env.QSTASH_URL,
      hasQStashToken: !!process.env.QSTASH_TOKEN,
      hasResendToken: !!process.env.RESEND_TOKEN,
      qstashUrl: process.env.QSTASH_URL,
      resendTokenPrefix: process.env.RESEND_TOKEN?.substring(0, 8) + "...",
    };
    
    console.log("📋 Environment Variables:", envCheck);
    
    // Test configuration access
    const configCheck = {
      hasUpstashQstashUrl: !!config.env.upstash.qstashUrl,
      hasUpstashQstashToken: !!config.env.upstash.qstashToken,
      hasResendToken: !!config.env.resendToken,
      baseUrl: config.env.apiEndpoint,
    };
    
    console.log("⚙️ Config Access:", configCheck);
    
    // Check workflow client initialization
    let workflowClientCheck;
    try {
      workflowClientCheck = {
        initialized: !!workflowClient,
        canTrigger: typeof workflowClient.trigger === 'function',
      };
    } catch (error) {
      workflowClientCheck = {
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
    
    console.log("🔧 Workflow Client:", workflowClientCheck);
    
    return NextResponse.json({
      status: "Email diagnostics completed",
      environment: envCheck,
      config: configCheck,
      workflowClient: workflowClientCheck,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error("❌ Diagnostics failed:", error);
    return NextResponse.json(
      {
        error: "Diagnostics failed",
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, fullName } = await request.json();
    
    if (!email || !fullName) {
      return NextResponse.json(
        { error: "Email and fullName are required" },
        { status: 400 }
      );
    }
    
    console.log("🧪 Testing email workflow for:", email);
    
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    
    // Test workflow trigger
    const workflowResult = await workflowClient.trigger({
      url: `${baseUrl}/api/workflows/onboarding`,
      body: {
        email,
        fullName,
      },
    });
    
    console.log("✅ Test workflow triggered successfully:", workflowResult);
    
    return NextResponse.json({
      status: "Test email workflow triggered successfully",
      workflowResult,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error("❌ Test email workflow failed:", error);
    return NextResponse.json(
      {
        error: "Test workflow failed",
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}