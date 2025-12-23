"use server";

import { signIn } from "@/auth";
import { db } from "@/database/drizzle";
import { users } from "@/database/schema";
import { hash } from "bcryptjs";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import ratelimit from "../ratelimit";
import { redirect } from "next/navigation";
import { workflowClient } from "../workflow";
import config from "../config";


export const signInWithCredentials = async (params: Pick<AuthCredentials, "email" | "password">,
) => {
  const {email, password} = params;

  const ip = (await headers()).get("x-forwarded-for") || "127.0.0.1";
  const {success} = await ratelimit.limit(ip);

  if(!success) return redirect("/too-fast");

  try {
    const result =  await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if(result?.error) {
      return {success: false, error: result.error};
    }
    return {success: true};
  } catch (error) {
     console.log(error, "Signup error");
     return { success: false, error: "Signup error"};
  }
};

export const signUp = async (params: AuthCredentials) => {
  const {fullName, email, universityId, password, universityCard} = params;

  const ip = (await headers()).get("x-forwarded-for") || "127.0.0.1";
  const {success} = await ratelimit.limit(ip);

  if(!success) return redirect("/too-fast");

  // Check if the user exist already
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser.length > 0) {
    return {success: false, error: "User already exist"};
  }

  const hashedPassword = await hash(password, 10);

  try {
    await db.insert(users).values({
      fullName,
      email,
      universityId,
      password: hashedPassword,
      universityCard,
    });

    // Trigger onboarding workflow (use different approaches for dev vs prod)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    const isProduction = process.env.NODE_ENV === "production";
    const hasExternalUrl = baseUrl && !baseUrl.includes("localhost") && !baseUrl.includes("127.0.0.1");
    
    if (isProduction || hasExternalUrl) {
      // Use workflow client for production
      await workflowClient.trigger({
        url: `${baseUrl}/api/workflows/onboarding`,
        body: {
          email,
          fullName,
        },
      });
    } else {
      // Send welcome email directly in development
      try {
        const { sendWelcomeEmail } = await import("@/lib/email-with-logging");
        const { render } = await import("@react-email/render");
        const WelcomeEmail = (await import("@/emails/WelcomeEmail")).default;
        
        const profileUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/my-profile`;
        
        const emailHtml = await render(
          WelcomeEmail({
            userName: fullName,
            profileUrl,
          })
        );

        await sendWelcomeEmail(email, fullName, emailHtml);
        
        console.log("✅ Welcome email sent successfully to:", email);
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
      }
    }

    await signInWithCredentials({email, password});
    return{success: true};
  } catch (error) {
    console.log(error, "Signup error");
    return { success: false, error: "Signup error"};
  }
};