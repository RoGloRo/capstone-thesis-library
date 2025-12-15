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

interface WelcomeEmailProps {
  userName: string;
  profileUrl?: string;
}

export const WelcomeEmail = ({
  userName = "John Doe",
  profileUrl = "http://localhost:3000/my-profile",
}: WelcomeEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Welcome to Smart Library - Your reading journey starts now!</Preview>
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
            <Text style={title}>Welcome aboard! 👋</Text>
            
            <Text style={greeting}>Hi {userName},</Text>
            
            <Text style={paragraph}>
              We&apos;re absolutely thrilled to have you join our Smart Library community! 
              Your account has been created successfully and your reading journey starts now.
            </Text>

            <Section style={welcomeSection}>
              <Text style={welcomeTitle}>🎉 You&apos;re Now Part of Our Community!</Text>
              <Text style={welcomeText}>
                As a member of Smart Library, you now have access to thousands of books, 
                personalized recommendations, and a seamless borrowing experience.
              </Text>
            </Section>

            <Hr style={divider} />

            <Section style={featuresSection}>
              <Text style={sectionTitle}>📖 What You Can Do Now</Text>
              
              <Row style={featureRow}>
                <Column style={featureIcon}>
                  <Text style={emoji}>📚</Text>
                </Column>
                <Column style={featureText}>
                  <Text style={featureTitle}>Browse & Borrow Books</Text>
                  <Text style={featureDescription}>Explore our vast collection and borrow your favorites</Text>
                </Column>
              </Row>

              <Row style={featureRow}>
                <Column style={featureIcon}>
                  <Text style={emoji}>⭐</Text>
                </Column>
                <Column style={featureText}>
                  <Text style={featureTitle}>Get Personalized Recommendations</Text>
                  <Text style={featureDescription}>Discover new books based on your reading preferences</Text>
                </Column>
              </Row>

              <Row style={featureRow}>
                <Column style={featureIcon}>
                  <Text style={emoji}>📱</Text>
                </Column>
                <Column style={featureText}>
                  <Text style={featureTitle}>Manage Your Profile</Text>
                  <Text style={featureDescription}>Track your borrowed books and reading history</Text>
                </Column>
              </Row>
            </Section>

            <Section style={actionSection}>
              <Link href={profileUrl} style={button}>
                Explore Your Library
              </Link>
            </Section>

            <Hr style={divider} />

            <Section style={tipsSection}>
              <Text style={sectionTitle}>💡 Getting Started Tips</Text>
              
              <Text style={tipText}>
                <strong>✓ Complete your profile:</strong> Add your preferences for better book recommendations
              </Text>
              
              <Text style={tipText}>
                <strong>✓ Browse categories:</strong> Explore different genres to find your next great read
              </Text>
              
              <Text style={tipText}>
                <strong>✓ Set up notifications:</strong> Never miss due dates with our reminder system
              </Text>
            </Section>

            <Text style={paragraph}>
              We&apos;re here to make your reading experience exceptional. Happy reading! 📚
            </Text>

            <Text style={signature}>
              Welcome to the family,<br />
              The Smart Library Team
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              You&apos;re receiving this email because you just joined Smart Library. 
              If you have any questions, please contact us at contact@lemoroquias.online
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default WelcomeEmail;

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
  color: "#059669", // Green color for welcome
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

const welcomeSection = {
  backgroundColor: "#ecfdf5",
  borderRadius: "8px",
  padding: "24px",
  marginBottom: "24px",
};

const welcomeTitle = {
  fontSize: "18px",
  fontWeight: "bold",
  color: "#065f46",
  margin: "0 0 12px 0",
};

const welcomeText = {
  fontSize: "14px",
  color: "#047857",
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
  backgroundColor: "#059669",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "16px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 32px",
  fontWeight: "600",
};

const tipsSection = {
  backgroundColor: "#f8fafc",
  borderRadius: "8px",
  padding: "20px",
  marginBottom: "24px",
};

const tipText = {
  fontSize: "14px",
  color: "#374151",
  marginBottom: "8px",
  lineHeight: "20px",
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