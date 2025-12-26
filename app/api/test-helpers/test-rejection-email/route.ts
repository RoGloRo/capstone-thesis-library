import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/workflow";
import { render } from "@react-email/render";
import AccountRejectionEmail from "@/emails/AccountRejectionEmail";

export async function POST(request: Request) {
  try {
    const { email, fullName } = await request.json();
    
    if (!email || !fullName) {
      return NextResponse.json(
        { error: "email and fullName are required" },
        { status: 400 }
      );
    }

    // Test sending rejection email directly
    const supportEmail = "contact@lemoroquias.online";
    
    const emailHtml = await render(
      AccountRejectionEmail({
        userName: fullName,
        userEmail: email,
        supportEmail,
      })
    );

    const hasResendToken = !!process.env.RESEND_TOKEN;
    const hasQstashToken = !!process.env.QSTASH_TOKEN;
    
    if (hasResendToken && hasQstashToken) {
      await sendEmail({
        email,
        subject: "🧪 [TEST] Smart Library Account Registration Update",
        message: emailHtml,
      });

      return NextResponse.json({
        success: true,
        message: `Test rejection email sent to ${email}`,
        details: {
          email,
          fullName,
          supportEmail,
        },
      });
    } else {
      return NextResponse.json({
        success: true,
        message: "Test mode - rejection email would be sent with these details",
        details: {
          email,
          fullName,
          supportEmail,
          subject: "🧪 [TEST] Smart Library Account Registration Update",
        },
        missingTokens: {
          resendToken: !hasResendToken,
          qstashToken: !hasQstashToken,
        },
      });
    }

  } catch (error) {
    console.error("Error in test rejection email:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}