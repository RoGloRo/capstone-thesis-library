import {
  Body,
  Container,
  Column,
  Head,
  Html,
  Link,
  Preview,
  Row,
  Section,
  Text,
  Hr,
} from "@react-email/components";
import * as React from "react";

interface AccountRejectionEmailProps {
  userName: string;
  userEmail: string;
  supportEmail?: string;
}

export const AccountRejectionEmail = ({
  userName = "John Doe",
  userEmail = "john@example.com",
  supportEmail = "contact@lemoroquias.online",
}: AccountRejectionEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Your Smart Library account registration was not approved</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Row>
              <Column>
                <Text style={headerText}>📚 Smart Library</Text>
              </Column>
            </Row>
          </Section>

          <Section style={content}>
            <Text style={title}>Account Registration Update</Text>
            
            <Text style={greeting}>Hi {userName},</Text>
            
            <Text style={paragraph}>
              Thank you for your interest in joining Smart Library. After reviewing your registration request, 
              we regret to inform you that we are unable to approve your account at this time.
            </Text>

            <Section style={rejectionSection}>
              <Text style={rejectionTitle}>🔒 Registration Status: Not Approved</Text>
              <Text style={rejectionText}>
                Your account registration for <strong>{userEmail}</strong> has not been approved. 
                This may be due to various factors including verification requirements or administrative policies.
              </Text>
            </Section>

            <Hr style={divider} />

            <Section style={nextStepsSection}>
              <Text style={sectionTitle}>What can you do next?</Text>
              
              <Text style={stepText}>
                <strong>📝 Review and Reapply:</strong> You may submit a new registration request ensuring all information is accurate and complete.
              </Text>
              
              <Text style={stepText}>
                <strong>📞 Contact Support:</strong> If you believe this was an error or have questions, please contact our support team.
              </Text>
              
              <Text style={stepText}>
                <strong>📋 Check Requirements:</strong> Ensure you meet all registration requirements and have provided valid documentation.
              </Text>
            </Section>

            <Section style={supportSection}>
              <Text style={supportTitle}>Need Help?</Text>
              <Text style={supportText}>
                If you have any questions or would like to discuss your application, please don&apos;t hesitate 
                to contact our support team at{" "}
                <Link href={`mailto:${supportEmail}`} style={supportLink}>
                  {supportEmail}
                </Link>
              </Text>
            </Section>

            <Text style={paragraph}>
              We appreciate your understanding and interest in Smart Library. We encourage you to 
              reapply if you believe you meet the requirements.
            </Text>

            <Text style={signature}>
              Best regards,<br />
              The Smart Library Team
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              You&apos;re receiving this email because you submitted a registration request to Smart Library. 
              If you have any questions, please contact us at {supportEmail}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default AccountRejectionEmail;

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  maxWidth: "580px",
};

const header = {
  padding: "0 48px",
  marginBottom: "32px",
};

const headerText = {
  fontSize: "24px",
  fontWeight: "bold",
  color: "#1f2937",
  margin: "0",
};

const content = {
  padding: "0 48px",
};

const title = {
  fontSize: "28px",
  fontWeight: "bold",
  color: "#dc2626", // Red color for rejection
  marginBottom: "16px",
};

const greeting = {
  fontSize: "16px",
  color: "#374151",
  marginBottom: "16px",
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "26px",
  color: "#374151",
  marginBottom: "16px",
};

const rejectionSection = {
  backgroundColor: "#fef2f2",
  borderRadius: "8px",
  padding: "24px",
  marginBottom: "24px",
  border: "1px solid #fecaca",
};

const rejectionTitle = {
  fontSize: "18px",
  fontWeight: "bold",
  color: "#991b1b",
  margin: "0 0 12px 0",
};

const rejectionText = {
  fontSize: "14px",
  color: "#b91c1c",
  margin: "0",
  lineHeight: "20px",
};

const divider = {
  borderColor: "#e5e7eb",
  marginTop: "24px",
  marginBottom: "24px",
};

const nextStepsSection = {
  marginBottom: "24px",
};

const sectionTitle = {
  fontSize: "18px",
  fontWeight: "bold",
  color: "#1f2937",
  marginBottom: "16px",
};

const stepText = {
  fontSize: "14px",
  color: "#374151",
  marginBottom: "12px",
  lineHeight: "20px",
  paddingLeft: "8px",
};

const supportSection = {
  backgroundColor: "#f0f9ff",
  borderRadius: "8px",
  padding: "20px",
  marginBottom: "24px",
  border: "1px solid #bae6fd",
};

const supportTitle = {
  fontSize: "16px",
  fontWeight: "bold",
  color: "#0c4a6e",
  margin: "0 0 12px 0",
};

const supportText = {
  fontSize: "14px",
  color: "#0369a1",
  margin: "0",
  lineHeight: "20px",
};

const supportLink = {
  color: "#0369a1",
  textDecoration: "underline",
  fontWeight: "600",
};

const signature = {
  fontSize: "16px",
  color: "#374151",
  marginTop: "32px",
  lineHeight: "24px",
};

const footer = {
  borderTop: "1px solid #e5e7eb",
  padding: "32px 48px 0",
  marginTop: "32px",
};

const footerText = {
  fontSize: "12px",
  color: "#6b7280",
  textAlign: "center" as const,
  lineHeight: "18px",
};