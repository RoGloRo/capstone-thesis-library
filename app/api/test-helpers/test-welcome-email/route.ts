import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/workflow";
import { render } from "@react-email/render";
import WelcomeEmail from "@/emails/WelcomeEmail";

export async function POST(request: Request) {
  try {
    const { email, fullName } = await request.json();
    
    if (!email || !fullName) {
      return NextResponse.json(
        { error: "email and fullName are required" },
        { status: 400 }
      );
    }

    // Test sending welcome email directly
    const profileUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/my-profile`;
    
    const emailHtml = await render(
      WelcomeEmail({
        userName: fullName,
        profileUrl,
      })
    );

    const hasResendToken = !!process.env.RESEND_TOKEN;
    const hasQstashToken = !!process.env.QSTASH_TOKEN;
    
    if (hasResendToken && hasQstashToken) {
      await sendEmail({
        email,
        subject: "🧪 [TEST] Welcome to Smart Library! Your reading journey begins now",
        message: emailHtml,
      });

      return NextResponse.json({
        success: true,
        message: `Test welcome email sent to ${email}`,
        details: {
          email,
          fullName,
          profileUrl,
        },
      });
    } else {
      return NextResponse.json({
        success: true,
        message: "Test mode - welcome email would be sent with these details",
        details: {
          email,
          fullName,
          profileUrl,
          subject: "🧪 [TEST] Welcome to Smart Library! Your reading journey begins now",
        },
        missingTokens: {
          resendToken: !hasResendToken,
          qstashToken: !hasQstashToken,
        },
      });
    }

  } catch (error) {
    console.error("Error in test welcome email:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}