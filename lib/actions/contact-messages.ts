"use server";

/**
 * lib/actions/contact-messages.ts
 *
 * Public submission handler for the Contact Us form on the About page.
 * Any visitor (authenticated or guest) can submit â€” authentication is never
 * required and a client-provided userId is never trusted. The userId, when a
 * session exists, is resolved SERVER-SIDE from next-auth.
 */

import { auth } from "@/auth";
import { z } from "zod";
import { db } from "@/database/drizzle";
import { contactMessages } from "@/database/schema";
import { contactMessageSchema } from "@/lib/validations";
import rateLimiter from "@/lib/ratelimit";
import { createNotification } from "@/lib/notifications";

const zUuid = z.string().uuid();
const ZERO_UUID = "00000000-0000-0000-0000-000000000000";

type SubmitResult =
  | { success: boolean }
  | { success: false; error: string };

export async function submitContactMessage(
  values: unknown,
): Promise<SubmitResult> {
  // 1) Light rate limiting to deter spam on this unauthenticated endpoint.
  const session = await auth().catch(() => null);

  if (rateLimiter) {
    // Prefer a stable per-user key, fall back to a coarse shared bucket for
    // guests ("guest" â€” intentionally conservative so public spam is capped).
    const identifier = session?.user?.id ? `user-${session.user.id}` : "guest";

    const { success } = await rateLimiter.limit(identifier);
    if (!success) {
      return {
        success: false,
        error: "Too many messages sent recently. Please try again later.",
      };
    }
  }

  // 2) Re-validate on the server with the SAME schema used by the form.
  const parsed = contactMessageSchema.safeParse(values);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message;
    return {
      success: false,
      error:
        firstError ||
        "Please check your details and try again.",
    };
  }

  // 3) Resolve the submitting user SERVER-SIDE (never trust client userId).
  let userId: string | null = null;
  if (session?.user?.id) {
    const candidate = zUuid.safeParse(session.user.id);
    if (candidate.success && candidate.data !== ZERO_UUID) {
      userId = candidate.data;
    }
  }

  const { name, email, message } = parsed.data;

  // 4) Persist. name/email are stored exactly as submitted regardless of auth.
  try {
    const [saved] = await db
      .insert(contactMessages)
      .values({
        ...(userId !== null ? { userId } : {}),
        name,
        email,
        message,
      })
      .returning({ id: contactMessages.id });

    // Emit an admin notification (auxiliary; a failure here is logged and
    // swallowed so it can never break the message submission itself).
    await createNotification({
      userId,
      category: "MESSAGE",
      type: "NEW_MESSAGE",
      title: "New Message",
      message: `${name} (${email}) sent a message through Contact Us.`,
      entityType: "CONTACT_MESSAGE",
      entityId: saved.id,
    });

    return { success: true };
  } catch (error) {
    console.error("[submitContactMessage] Failed to save message:", error);
    return {
      success: false,
      error: "Unable to send your message right now. Please try again.",
    };
  }
}
