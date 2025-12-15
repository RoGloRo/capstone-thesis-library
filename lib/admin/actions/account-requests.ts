// lib/admin/actions/account-requests.ts
"use server";

import { db } from "@/database/drizzle";
import { users } from "@/database/schema";
import { eq, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { sendEmail } from "@/lib/workflow";
import { render } from "@react-email/render";
import AccountApprovalEmail from "@/emails/AccountApprovalEmail";

export const getAccountRequests = async (): Promise<AccountRequest[]> => {
  try {
    const accountRequests = await db
      .select()
      .from(users)
      .where(
        or(
          eq(users.status, "PENDING"),
          eq(users.status, "REJECTED")
        )
      )
      .orderBy(users.createdAt);

    return accountRequests.map(user => ({
      id: user.id,
      fullName: user.fullName || "",
      email: user.email || "",
      universityId: user.universityId || 0,
      universityCard: user.universityCard || "",
      status: user.status as "PENDING" | "REJECTED",
      createdAt: user.createdAt || new Date()
    }));
  } catch (error) {
    console.error("Error fetching account requests:", error);
    throw new Error("Failed to fetch account requests");
  }
};

export interface AccountRequest {
  id: string;
  fullName: string;
  email: string;
  universityId: number;
  universityCard: string;
  status: "PENDING" | "REJECTED";
  createdAt: Date;
}

export const approveAccountRequest = async (userId: string) => {
  try {
    // First, get user details before updating
    const [user] = await db
      .select({
        fullName: users.fullName,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return { 
        success: false, 
        error: "User not found" 
      };
    }

    // Update the user status to approved
    await db
      .update(users)
      .set({ status: "APPROVED" })
      .where(eq(users.id, userId));
    
    // Send approval notification email
    try {
      const profileUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/my-profile`;
      
      // Check if we have the necessary environment variables for email
      const hasResendToken = !!process.env.RESEND_TOKEN;
      const hasQstashToken = !!process.env.QSTASH_TOKEN;
      
      if (hasResendToken && hasQstashToken) {
        // Render the React Email template to HTML
        const emailHtml = await render(
          AccountApprovalEmail({
            userName: user.fullName,
            userEmail: user.email,
            profileUrl,
          })
        );

        await sendEmail({
          email: user.email,
          subject: "🎉 Your Smart Library account has been approved!",
          message: emailHtml,
        });

        console.log(`✅ Account approval email sent to: ${user.email}`);
      } else {
        // Log what would be sent in development
        console.log("📧 Account approval email (dev mode):", {
          to: user.email,
          subject: "🎉 Your Smart Library account has been approved!",
          userName: user.fullName,
          userEmail: user.email,
        });
      }
    } catch (emailError) {
      // Log email error but don't fail the approval process
      console.error("Failed to send approval email:", emailError);
    }
    
    revalidatePath("/admin/account-requests");
    return { success: true };
  } catch (error) {
    console.error("Error approving account request:", error);
    return { 
      success: false, 
      error: "Failed to approve account request" 
    };
  }
};

export const rejectAccountRequest = async (userId: string) => {
  try {
    await db
      .update(users)
      .set({ status: "REJECTED" })
      .where(eq(users.id, userId));
    
    revalidatePath("/admin/account-requests");
    return { success: true };
  } catch (error) {
    console.error("Error rejecting account request:", error);
    return { 
      success: false, 
      error: "Failed to reject account request" 
    };
  }
};