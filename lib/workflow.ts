import { Client as WorkflowClient } from "@upstash/workflow";
import { Client as QStashClient, resend } from "@upstash/qstash";
import config from "./config";

export const workflowClient = new WorkflowClient({
  baseUrl: config.env.upstash.qstashUrl,
  token: config.env.upstash.qstashToken,
});

const qstashClient = new QStashClient({ 
  token: config.env.upstash.qstashToken 
});

export const sendEmail = async({email, subject, message}: {email: string; subject: string; message: string;}) => {
  try {
    console.log("📧 Sending email via QStash:", {
      to: email,
      subject: subject.substring(0, 50) + "...",
      hasToken: !!config.env.resendToken,
      hasQStashToken: !!config.env.upstash.qstashToken
    });

    const result = await qstashClient.publishJSON({
      api: {
        name: "email",
        provider: resend({ token: config.env.resendToken }),
      },
      body: {
        from: "Smart Library <contact@lemoroquias.online>",
        to: [email],
        subject,
        html: message,
      },
    });
    
    console.log("✅ Email queued successfully:", {
      messageId: result.messageId,
      to: email
    });
    
    return result;
  } catch (error) {
    console.error("❌ Email sending failed:", {
      error: error instanceof Error ? error.message : 'Unknown error',
      email,
      subject
    });
    throw error;
  }
};

 