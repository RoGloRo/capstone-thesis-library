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

interface UserActiveEmailProps {
  userName: string;
  profileUrl?: string;
  streakDays?: number;
}

export const UserActiveEmail = ({
  userName = "John Doe",
  profileUrl = "http://localhost:3000/my-profile",
  streakDays = 1,
}: UserActiveEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>You&apos;re back! Keep your reading momentum going strong!</Preview>
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
            <Text style={title}>You&apos;re back! 🔥</Text>
            
            <Text style={greeting}>Hey {userName},</Text>
            
            <Text style={paragraph}>
              Awesome! We noticed you&apos;re back and active in the library. 
              We love seeing engaged readers like you making the most of our collection!
            </Text>

            <Section style={celebrationSection}>
              <Row>
                <Column style={iconColumn}>
                  <Text style={fireEmoji}>🎉</Text>
                </Column>
                <Column style={textColumn}>
                  <Text style={celebrationTitle}>Welcome Back, Reading Champion!</Text>
                  <Text style={celebrationText}>
                    You&apos;re back in action and we couldn&apos;t be happier! 
                    Keep this momentum going — you&apos;re on fire! 🚀
                  </Text>
                </Column>
              </Row>
            </Section>

            <Hr style={divider} />

            <Section style={achievementSection}>
              <Text style={sectionTitle}>🏆 Your Reading Stats</Text>
              
              <Row style={statRow}>
                <Column style={statIcon}>
                  <Text style={emoji}>📈</Text>
                </Column>
                <Column style={statText}>
                  <Text style={statTitle}>Activity Streak</Text>
                  <Text style={statValue}>{streakDays} {streakDays === 1 ? 'day' : 'days'} active</Text>
                </Column>
              </Row>

              <Row style={statRow}>
                <Column style={statIcon}>
                  <Text style={emoji}>⭐</Text>
                </Column>
                <Column style={statText}>
                  <Text style={statTitle}>Status</Text>
                  <Text style={statValue}>Active Reader</Text>
                </Column>
              </Row>

              <Row style={statRow}>
                <Column style={statIcon}>
                  <Text style={emoji}>🎯</Text>
                </Column>
                <Column style={statText}>
                  <Text style={statTitle}>Achievement</Text>
                  <Text style={statValue}>Consistent Library User</Text>
                </Column>
              </Row>
            </Section>

            <Section style={actionSection}>
              <Link href={profileUrl} style={button}>
                Continue Reading Journey
              </Link>
            </Section>

            <Hr style={divider} />

            <Section style={encouragementSection}>
              <Text style={sectionTitle}>🚀 Keep The Momentum Going</Text>
              
              <Text style={encouragementText}>
                <strong>📚 Discover New Genres:</strong> Branch out and explore something different today
              </Text>
              
              <Text style={encouragementText}>
                <strong>⭐ Rate Your Reads:</strong> Help other readers discover great books
              </Text>
              
              <Text style={encouragementText}>
                <strong>📖 Set Reading Goals:</strong> Challenge yourself with monthly reading targets
              </Text>

              <Text style={encouragementText}>
                <strong>🔔 Enable Notifications:</strong> Never miss new arrivals in your favorite genres
              </Text>
            </Section>

            <Section style={motivationSection}>
              <Text style={motivationQuote}>
                &ldquo;A reader lives a thousand lives before he dies. The man who never reads lives only one.&rdquo; 
                — George R.R. Martin
              </Text>
            </Section>

            <Text style={paragraph}>
              Nice! You&apos;re back in action and we love your dedication to reading. 
              Let&apos;s keep this momentum rolling — your next great book is waiting! 📚
            </Text>

            <Text style={signature}>
              Cheering you on,<br />
              The Smart Library Team
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              You&apos;re receiving this email because we&apos;re celebrating your return to active reading. 
              If you have any questions, please contact us at contact@lemoroquias.online
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default UserActiveEmail;

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
  color: "#ea580c", // Orange color for energy/fire
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

const celebrationSection = {
  backgroundColor: "#fff7ed",
  borderRadius: "8px",
  padding: "24px",
  marginBottom: "24px",
};

const iconColumn = {
  width: "48px",
  verticalAlign: "top",
};

const fireEmoji = {
  fontSize: "32px",
  margin: "0",
};

const textColumn = {
  verticalAlign: "top",
  paddingLeft: "16px",
};

const celebrationTitle = {
  fontSize: "18px",
  fontWeight: "bold",
  color: "#c2410c",
  margin: "0 0 8px 0",
};

const celebrationText = {
  fontSize: "14px",
  color: "#ea580c",
  margin: "0",
  lineHeight: "20px",
};

const divider = {
  borderColor: "#e5e7eb",
  marginTop: "24px",
  marginBottom: "24px",
};

const achievementSection = {
  backgroundColor: "#f0fdf4",
  borderRadius: "8px",
  padding: "20px",
  marginBottom: "24px",
};

const sectionTitle = {
  fontSize: "18px",
  fontWeight: "bold",
  color: "#1f2937",
  marginBottom: "16px",
};

const statRow = {
  marginBottom: "12px",
};

const statIcon = {
  width: "40px",
  verticalAlign: "top",
};

const emoji = {
  fontSize: "20px",
  margin: "0",
};

const statText = {
  verticalAlign: "top",
  paddingLeft: "12px",
};

const statTitle = {
  fontSize: "13px",
  color: "#6b7280",
  margin: "0 0 2px 0",
};

const statValue = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#065f46",
  margin: "0",
};

const actionSection = {
  textAlign: "center" as const,
  marginBottom: "32px",
};

const button = {
  backgroundColor: "#ea580c",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "16px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 32px",
  fontWeight: "600",
};

const encouragementSection = {
  marginBottom: "24px",
};

const encouragementText = {
  fontSize: "14px",
  color: "#374151",
  marginBottom: "10px",
  lineHeight: "20px",
};

const motivationSection = {
  backgroundColor: "#f8fafc",
  borderLeft: "4px solid #ea580c",
  borderRadius: "8px",
  padding: "20px",
  marginBottom: "24px",
};

const motivationQuote = {
  fontSize: "14px",
  fontStyle: "italic",
  color: "#4b5563",
  margin: "0",
  lineHeight: "22px",
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