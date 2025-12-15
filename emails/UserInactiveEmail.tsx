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

interface UserInactiveEmailProps {
  userName: string;
  profileUrl?: string;
  lastActivityDays?: number;
}

export const UserInactiveEmail = ({
  userName = "John Doe",
  profileUrl = "http://localhost:3000/my-profile",
  lastActivityDays = 7,
}: UserInactiveEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>We miss you at Smart Library - Come back and discover new books!</Preview>
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
            <Text style={title}>We miss you! 🥺</Text>
            
            <Text style={greeting}>Hey {userName},</Text>
            
            <Text style={paragraph}>
              It&apos;s been a while since we last saw you around the library. We&apos;ve been 
              keeping your favorite spot warm and have some exciting new additions you might love!
            </Text>

            <Section style={missYouSection}>
              <Row>
                <Column style={iconColumn}>
                  <Text style={sadEmoji}>😔</Text>
                </Column>
                <Column style={textColumn}>
                  <Text style={missYouTitle}>The Library Feels Empty Without You</Text>
                  <Text style={missYouText}>
                    Your last visit was {lastActivityDays} days ago. We have new books, 
                    improved features, and your personalized recommendations waiting for you!
                  </Text>
                </Column>
              </Row>
            </Section>

            <Hr style={divider} />

            <Section style={newFeaturesSection}>
              <Text style={sectionTitle}>🆕 What&apos;s New Since You Left</Text>
              
              <Row style={featureRow}>
                <Column style={featureIcon}>
                  <Text style={emoji}>📖</Text>
                </Column>
                <Column style={featureText}>
                  <Text style={featureTitle}>New Book Arrivals</Text>
                  <Text style={featureDescription}>Fresh titles in your favorite genres</Text>
                </Column>
              </Row>

              <Row style={featureRow}>
                <Column style={featureIcon}>
                  <Text style={emoji}>🎯</Text>
                </Column>
                <Column style={featureText}>
                  <Text style={featureTitle}>Better Recommendations</Text>
                  <Text style={featureDescription}>Improved algorithm for personalized suggestions</Text>
                </Column>
              </Row>

              <Row style={featureRow}>
                <Column style={featureIcon}>
                  <Text style={emoji}>⚡</Text>
                </Column>
                <Column style={featureText}>
                  <Text style={featureTitle}>Enhanced User Experience</Text>
                  <Text style={featureDescription}>Faster browsing and smoother interactions</Text>
                </Column>
              </Row>
            </Section>

            <Section style={actionSection}>
              <Link href={profileUrl} style={button}>
                Welcome Back - Explore Now
              </Link>
            </Section>

            <Hr style={divider} />

            <Section style={incentiveSection}>
              <Text style={sectionTitle}>🎁 Special Welcome Back Offer</Text>
              
              <Text style={incentiveText}>
                <strong>Extended Borrowing Period:</strong> Your first book back gets an extra week!
              </Text>
              
              <Text style={incentiveText}>
                <strong>Priority Reservations:</strong> Jump to the front of the line for popular titles
              </Text>
              
              <Text style={incentiveText}>
                <strong>Personalized Shelf:</strong> We&apos;ve curated a special collection just for you
              </Text>
            </Section>

            <Text style={paragraph}>
              Come back anytime — we&apos;re here to support your reading journey and we&apos;d 
              love to help you discover your next favorite book! 📚
            </Text>

            <Text style={signature}>
              Missing you,<br />
              The Smart Library Team
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              You&apos;re receiving this email because we noticed you haven&apos;t visited recently. 
              If you have any questions, please contact us at contact@lemoroquias.online
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default UserInactiveEmail;

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
  fontSize: "24px",
  fontWeight: "bold",
  color: "#7c3aed", // Purple color for missing you
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

const missYouSection = {
  backgroundColor: "#faf5ff",
  borderRadius: "8px",
  padding: "24px",
  marginBottom: "24px",
};

const iconColumn = {
  width: "48px",
  verticalAlign: "top",
};

const sadEmoji = {
  fontSize: "32px",
  margin: "0",
};

const textColumn = {
  verticalAlign: "top",
  paddingLeft: "16px",
};

const missYouTitle = {
  fontSize: "18px",
  fontWeight: "bold",
  color: "#581c87",
  margin: "0 0 8px 0",
};

const missYouText = {
  fontSize: "14px",
  color: "#7c2d12",
  margin: "0",
  lineHeight: "20px",
};

const divider = {
  borderColor: "#e5e7eb",
  marginTop: "24px",
  marginBottom: "24px",
};

const newFeaturesSection = {
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
  backgroundColor: "#7c3aed",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "16px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 32px",
  fontWeight: "600",
};

const incentiveSection = {
  backgroundColor: "#fef3cd",
  borderRadius: "8px",
  padding: "20px",
  marginBottom: "24px",
};

const incentiveText = {
  fontSize: "14px",
  color: "#92400e",
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