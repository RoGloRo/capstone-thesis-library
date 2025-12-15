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

interface AccountApprovalEmailProps {
  userName: string;
  userEmail: string;
  profileUrl?: string;
}

export const AccountApprovalEmail = ({
  userName = "John Doe",
  userEmail = "john@example.com",
  profileUrl = "http://localhost:3000/my-profile",
}: AccountApprovalEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>🎉 Your Smart Library account has been approved! Welcome aboard!</Preview>
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
            <Text style={title}>Congratulations! 🎉</Text>
            
            <Text style={greeting}>Hi {userName},</Text>
            
            <Text style={paragraph}>
              Fantastic news! Your Smart Library account has been reviewed and 
              <strong> approved by our administrators</strong>. You now have full access 
              to our library system and can start borrowing books immediately!
            </Text>

            <Section style={approvalSection}>
              <Row>
                <Column style={iconColumn}>
                  <Text style={successEmoji}>✅</Text>
                </Column>
                <Column style={textColumn}>
                  <Text style={approvalTitle}>Your Account is Now Active!</Text>
                  <Text style={approvalText}>
                    You can now access all features of Smart Library including browsing 
                    our collection, borrowing books, and managing your reading profile.
                  </Text>
                </Column>
              </Row>
            </Section>

            <Hr style={divider} />

            <Section style={featuresSection}>
              <Text style={sectionTitle}>🚀 What You Can Do Now</Text>
              
              <Row style={featureRow}>
                <Column style={featureIcon}>
                  <Text style={emoji}>📖</Text>
                </Column>
                <Column style={featureText}>
                  <Text style={featureTitle}>Browse & Borrow Books</Text>
                  <Text style={featureDescription}>
                    Explore thousands of books across all genres and borrow your favorites instantly
                  </Text>
                </Column>
              </Row>

              <Row style={featureRow}>
                <Column style={featureIcon}>
                  <Text style={emoji}>📊</Text>
                </Column>
                <Column style={featureText}>
                  <Text style={featureTitle}>Track Your Reading</Text>
                  <Text style={featureDescription}>
                    Monitor your borrowed books, due dates, and reading history
                  </Text>
                </Column>
              </Row>

              <Row style={featureRow}>
                <Column style={featureIcon}>
                  <Text style={emoji}>🔔</Text>
                </Column>
                <Column style={featureText}>
                  <Text style={featureTitle}>Get Notifications</Text>
                  <Text style={featureDescription}>
                    Receive email reminders for due dates and new book arrivals
                  </Text>
                </Column>
              </Row>

              <Row style={featureRow}>
                <Column style={featureIcon}>
                  <Text style={emoji}>⭐</Text>
                </Column>
                <Column style={featureText}>
                  <Text style={featureTitle}>Personalized Recommendations</Text>
                  <Text style={featureDescription}>
                    Discover new books tailored to your reading preferences
                  </Text>
                </Column>
              </Row>
            </Section>

            <Section style={actionSection}>
              <Link href={profileUrl} style={button}>
                Access Your Library Account
              </Link>
            </Section>

            <Hr style={divider} />

            <Section style={quickStartSection}>
              <Text style={sectionTitle}>🎯 Quick Start Guide</Text>
              
              <Text style={stepText}>
                <strong>1. Visit Your Profile:</strong> Click the button above to access your account
              </Text>
              
              <Text style={stepText}>
                <strong>2. Browse the Library:</strong> Explore our collection by genre, author, or title
              </Text>
              
              <Text style={stepText}>
                <strong>3. Borrow Books:</strong> Click &ldquo;Borrow Book&rdquo; on any available title
              </Text>
              
              <Text style={stepText}>
                <strong>4. Manage Loans:</strong> Track your borrowed books and due dates in your profile
              </Text>
            </Section>

            <Section style={accountInfoSection}>
              <Text style={accountInfoTitle}>📋 Your Account Details</Text>
              <Text style={accountInfo}>
                <strong>Email:</strong> {userEmail}
              </Text>
              <Text style={accountInfo}>
                <strong>Status:</strong> Active & Approved ✅
              </Text>
              <Text style={accountInfo}>
                <strong>Access Level:</strong> Full Library Access
              </Text>
            </Section>

            <Text style={paragraph}>
              Welcome to the Smart Library family! We&apos;re excited to support your 
              reading journey and help you discover amazing books. Happy reading! 📚
            </Text>

            <Text style={signature}>
              Welcome aboard,<br />
              The Smart Library Team
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              Your account was approved by our administration team. If you have any questions 
              or need assistance, please contact us at contact@lemoroquias.online
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default AccountApprovalEmail;

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
  color: "#16a34a", // Green for success/approval
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

const approvalSection = {
  backgroundColor: "#f0fdf4",
  borderRadius: "8px",
  padding: "24px",
  marginBottom: "24px",
};

const iconColumn = {
  width: "48px",
  verticalAlign: "top",
};

const successEmoji = {
  fontSize: "32px",
  margin: "0",
};

const textColumn = {
  verticalAlign: "top",
  paddingLeft: "16px",
};

const approvalTitle = {
  fontSize: "18px",
  fontWeight: "bold",
  color: "#15803d",
  margin: "0 0 8px 0",
};

const approvalText = {
  fontSize: "14px",
  color: "#16a34a",
  margin: "0",
  lineHeight: "20px",
};

const divider = {
  borderColor: "#e5e7eb",
  marginTop: "24px",
  marginBottom: "24px",
};

const featuresSection = {
  marginBottom: "24px",
};

const sectionTitle = {
  fontSize: "18px",
  fontWeight: "bold",
  color: "#1f2937",
  marginBottom: "16px",
};

const featureRow = {
  marginBottom: "16px",
};

const featureIcon = {
  width: "40px",
  verticalAlign: "top",
};

const emoji = {
  fontSize: "24px",
  margin: "0",
};

const featureText = {
  verticalAlign: "top",
  paddingLeft: "12px",
};

const featureTitle = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#1f2937",
  margin: "0 0 4px 0",
};

const featureDescription = {
  fontSize: "13px",
  color: "#6b7280",
  margin: "0",
  lineHeight: "18px",
};

const actionSection = {
  textAlign: "center" as const,
  marginBottom: "32px",
};

const button = {
  backgroundColor: "#16a34a",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "16px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 36px",
  fontWeight: "600",
};

const quickStartSection = {
  backgroundColor: "#f8fafc",
  borderRadius: "8px",
  padding: "20px",
  marginBottom: "24px",
};

const stepText = {
  fontSize: "14px",
  color: "#374151",
  marginBottom: "10px",
  lineHeight: "20px",
};

const accountInfoSection = {
  backgroundColor: "#fef3cd",
  borderRadius: "8px",
  padding: "20px",
  marginBottom: "24px",
};

const accountInfoTitle = {
  fontSize: "16px",
  fontWeight: "bold",
  color: "#92400e",
  margin: "0 0 12px 0",
};

const accountInfo = {
  fontSize: "14px",
  color: "#92400e",
  marginBottom: "6px",
  lineHeight: "18px",
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