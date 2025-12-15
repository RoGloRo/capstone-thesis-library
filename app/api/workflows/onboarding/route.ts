import { db } from "@/database/drizzle";
import { users } from "@/database/schema";
import { sendEmail } from "@/lib/workflow";
import { serve } from "@upstash/workflow/nextjs"
import { eq } from "drizzle-orm";
import { render } from "@react-email/render";
import WelcomeEmail from "@/emails/WelcomeEmail";
import UserInactiveEmail from "@/emails/UserInactiveEmail";
import UserActiveEmail from "@/emails/UserActiveEmail";

type UserState = "non-active" | "active";
type InitialData = {
  email: string;
  fullName: string;
}

const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000; // Fixed: was 100, should be 1000
const THREE_DAY_IN_MS = 3 * ONE_DAY_IN_MS;
const THIRTY_DAY_IN_MS = 30 * ONE_DAY_IN_MS;

const getUserState = async(email: string): Promise<UserState> => {
  const user =  await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

      if(user.length === 0) return "non-active";

      const lastActivityDate =  new Date(user[0].lastActivityDate!);
      const now = new Date();
      const timeDifference = now.getTime() - lastActivityDate.getTime();

      if(timeDifference > THREE_DAY_IN_MS && timeDifference <= THIRTY_DAY_IN_MS) {
        return "non-active";
      } {
        return "active";
      }
}

export const { POST } = serve<InitialData>(async (context) => {
  const { email, fullName } = context.requestPayload

  // Welcome Email
  await context.run("new-signup", async () => {
    const profileUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/my-profile`;
    
    const emailHtml = await render(
      WelcomeEmail({
        userName: fullName,
        profileUrl,
      })
    );

    await sendEmail({
      email,
      subject: "Welcome to Smart Library! 👋 Your reading journey begins now",
      message: emailHtml,
    })
  })

  await context.sleep("wait-for-3-days", 60 * 60 * 24 * 3)

  while (true) {
    const state = await context.run("check-user-state", async () => {
      return await getUserState(email);
    })

    if (state === "non-active") {
      await context.run("send-email-non-active", async () => {
        const profileUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/my-profile`;
        
        // Get user data to calculate last activity days
        const user = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        const lastActivityDays = user.length > 0 && user[0].lastActivityDate
          ? Math.floor((Date.now() - new Date(user[0].lastActivityDate).getTime()) / (1000 * 60 * 60 * 24))
          : 7;
        
        const emailHtml = await render(
          UserInactiveEmail({
            userName: fullName,
            profileUrl,
            lastActivityDays,
          })
        );

        await sendEmail({
          email,
          subject: "We miss you at Smart Library! 🥺 Come back and discover new books",
          message: emailHtml,
        })
      })
    } else if (state === "active") {
      await context.run("send-email-active", async () => {
        const profileUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/my-profile`;
        
        const emailHtml = await render(
          UserActiveEmail({
            userName: fullName,
            profileUrl,
            streakDays: 1, // Could be calculated based on activity pattern
          })
        );

        await sendEmail({
          email,
          subject: "You're back and on fire! 🔥 Keep your reading momentum going",
          message: emailHtml,
        })
      })
    }

    await context.sleep("wait-for-1-month", 60 * 60 * 24 * 30)
  }
})

// async function sendEmail(message: string, email: string) {
//   // Implement email sending logic here
//   console.log(`Sending ${message} email to ${email}`)
// }

// type UserState = "non-active" | "active"

// const getUserState = async (): Promise<UserState> => {
//   // Implement user state logic here
//   return "non-active"
// }