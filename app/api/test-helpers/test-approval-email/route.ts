import { NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { users } from "@/database/schema";
import { eq } from "drizzle-orm";
import { sendEmail } from "@/lib/workflow";
import { render } from "@react-email/render";
import AccountApprovalEmail from "@/emails/AccountApprovalEmail";

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // Get user details
    const [user] = await db
      .select({
        fullName: users.fullName,
        email: users.email,
        status: users.status,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Test sending approval email
    const profileUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/my-profile`;
    
    const emailHtml = await render(
      AccountApprovalEmail({
        userName: user.fullName,
        userEmail: user.email,
        profileUrl,
      })
    );

    const hasResendToken = !!process.env.RESEND_TOKEN;
    const hasQstashToken = !!process.env.QSTASH_TOKEN;
    
    if (hasResendToken && hasQstashToken) {
      await sendEmail({
        email: user.email,
        subject: "🎉 [TEST] Your Smart Library account has been approved!",
        message: emailHtml,
      });

      return NextResponse.json({
        success: true,
        message: `Test approval email sent to ${user.email}`,
        user: {
          name: user.fullName,
          email: user.email,
          status: user.status,
        },
      });
    } else {
      return NextResponse.json({
        success: true,
        message: "Test mode - email would be sent with these details",
        user: {
          name: user.fullName,
          email: user.email,
          status: user.status,
        },
        emailDetails: {
          to: user.email,
          subject: "🎉 [TEST] Your Smart Library account has been approved!",
          profileUrl,
        },
      });
    }

  } catch (error) {
    console.error("Error in test approval email:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}