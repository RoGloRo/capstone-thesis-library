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

  const GENERIC_SIGNIN_ERROR = "Sign-in failed. Please check your email and password and try again.";

  try {
    console.log("🔐 Attempting to sign in user:", email);
    
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    console.log("🔍 Sign in result:", result?.error ? `Error: ${result.error}` : "Success");

    if(result?.error) {
      console.error("❌ Sign in failed:", result.error);
      return {success: false, error: GENERIC_SIGNIN_ERROR};
    }
    
    console.log("✅ Sign in successful for:", email);
    return {success: true};
  } catch (error) {
    console.error("❌ Sign in exception:", error);
    
    return { success: false, error: GENERIC_SIGNIN_ERROR };
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
    // Insert user into database
    await db.insert(users).values({
      fullName,
      email,
      universityId,
      password: hashedPassword,
      universityCard,
    });

    console.log("✅ User created successfully:", email);

    // Handle welcome email - don't let it block the signup process
    const sendWelcomeEmailAsync = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
        const isProduction = process.env.NODE_ENV === "production";
        const hasExternalUrl = baseUrl && !baseUrl.includes("localhost") && !baseUrl.includes("127.0.0.1");
        
        // Always use correct production URL for Vercel deployments
        const workflowUrl = isProduction && process.env.VERCEL_URL 
          ? `https://${process.env.VERCEL_URL}/api/workflows/onboarding`
          : `${baseUrl || "http://localhost:3000"}/api/workflows/onboarding`;
        
        if (isProduction || hasExternalUrl) {
          // Use workflow client for production with timeout
          console.log("🚀 Triggering production workflow:", {
            url: workflowUrl,
            email,
            fullName,
            hasBaseUrl: !!baseUrl,
            hasVercelUrl: !!process.env.VERCEL_URL
          });
          
          const workflowPromise = workflowClient.trigger({
            url: workflowUrl,
            body: {
              email,
              fullName,
            },
          });
          
          // Add timeout for production workflow
          await Promise.race([
            workflowPromise,
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Workflow timeout')), 10000)
            )
          ]);
          
          console.log("✅ Production workflow triggered successfully for:", email);
        } else {
          // Send welcome email directly in development
          console.log("📧 Sending development welcome email to:", email);
          
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
          
          console.log("✅ Development welcome email sent successfully to:", email);
        }
      } catch (emailError) {
        console.error("⚠️ Welcome email failed (non-blocking):", emailError);
        // Log the error but don't propagate it
      }
    };

    // Start email process but don't wait for it in production
    if (process.env.NODE_ENV === "production") {
      // Fire and forget in production to avoid blocking
      sendWelcomeEmailAsync().catch(err => 
        console.error("Background email task failed:", err)
      );
    } else {
      // Wait for email in development for debugging
      await sendWelcomeEmailAsync();
    }

    // Sign in the user
    console.log("🔐 Signing in user:", email);
    const signInResult = await signInWithCredentials({email, password});
    
    if (!signInResult.success) {
      console.error("❌ Sign in failed after signup:", signInResult.error);
      return {
        success: false,
        error: "Sign-in failed. Please check your email and password and try again.",
      };
    }
    
    console.log("✅ Signup process completed successfully for:", email);
    return { success: true };
    
  } catch (error) {
    console.error("❌ Signup error:", error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('duplicate key value')) {
        return { success: false, error: "User already exists" };
      }
      if (error.message.includes('timeout')) {
        return { success: false, error: "Request timeout - please try again" };
      }
      return { success: false, error: `Signup failed: ${error.message}` };
    }
    
    return { success: false, error: "Signup error - please try again" };
  }
};