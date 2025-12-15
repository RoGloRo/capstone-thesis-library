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

interface DueDateReminderEmailProps {
  userName: string;
  bookTitle: string;
  bookAuthor: string;
  dueDate: string;
  profileUrl?: string;
}

export const DueDateReminderEmail = ({
  userName = "John Doe",
  bookTitle = "The Great Gatsby",
  bookAuthor = "F. Scott Fitzgerald",
  dueDate = "December 22, 2024",
  profileUrl = "http://localhost:3000/my-profile",
}: DueDateReminderEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Reminder: {bookTitle} is due tomorrow!</Preview>
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
            <Text style={title}>📅 Book Due Tomorrow!</Text>
            
            <Text style={greeting}>Hi {userName},</Text>
            
            <Text style={paragraph}>
              This is a friendly reminder that one of your borrowed books is due tomorrow. 
              Please make sure to return it on time to avoid any late fees.
            </Text>

            <Section style={bookDetails}>
              <Row>
                <Column style={bookIcon}>
                  <Text style={bookEmoji}>📖</Text>
                </Column>
                <Column style={bookInfo}>
                  <Text style={bookTitleStyle}>{bookTitle}</Text>
                  <Text style={bookAuthorStyle}>by {bookAuthor}</Text>
                </Column>
              </Row>
            </Section>

            <Section style={dueDateSection}>
              <Text style={dueDateLabel}>📅 Due Date:</Text>
              <Text style={dueDateValue}>{dueDate}</Text>
            </Section>

            <Hr style={divider} />

            <Section style={reminderSection}>
              <Text style={reminderTitle}>⚠️ Important</Text>
              <Text style={reminderText}>
                <strong>Your book is due tomorrow!</strong> Please return it by the end of the day 
                to avoid late fees. You can return the book at the library desk or through your online profile.
              </Text>
            </Section>

            <Section style={actionSection}>
              <Link href={profileUrl} style={button}>
                View My Borrowed Books
              </Link>
            </Section>

            <Hr style={divider} />

            <Section style={returnOptions}>
              <Text style={sectionTitle}>📍 Return Options</Text>
              
              <Text style={optionText}>
                <strong>Online:</strong> Visit your profile to manage returns
              </Text>
              
              <Text style={optionText}>
                <strong>In Person:</strong> Return at the library front desk during operating hours
              </Text>
            </Section>

            <Text style={paragraph}>
              Thank you for being a valued member of Smart Library! 📚
            </Text>

            <Text style={signature}>
              Best regards,<br />
              The Smart Library Team
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              This is an automated reminder from Smart Library. If you have any questions, 
              please contact us at contact@lemoroquias.online
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default DueDateReminderEmail;

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
  color: "#dc2626", // Red color for urgency
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

const bookDetails = {
  backgroundColor: "#f3f4f6",
  borderRadius: "8px",
  padding: "24px",
  marginBottom: "24px",
};

const bookIcon = {
  width: "48px",
  verticalAlign: "top",
};

const bookEmoji = {
  fontSize: "32px",
  margin: "0",
};

const bookInfo = {
  verticalAlign: "top",
  paddingLeft: "16px",
};

const bookTitleStyle = {
  fontSize: "18px",
  fontWeight: "bold",
  color: "#1f2937",
  margin: "0 0 4px 0",
};

const bookAuthorStyle = {
  fontSize: "14px",
  color: "#6b7280",
  margin: "0",
};

const dueDateSection = {
  backgroundColor: "#fef3cd",
  borderRadius: "8px",
  padding: "20px",
  marginBottom: "24px",
  textAlign: "center" as const,
};

const dueDateLabel = {
  fontSize: "14px",
  color: "#92400e",
  margin: "0 0 8px 0",
  fontWeight: "600",
};

const dueDateValue = {
  fontSize: "20px",
  fontWeight: "bold",
  color: "#92400e",
  margin: "0",
};

const divider = {
  borderColor: "#e5e7eb",
  marginTop: "24px",
  marginBottom: "24px",
};

const reminderSection = {
  backgroundColor: "#fee2e2",
  borderLeft: "4px solid #dc2626",
  borderRadius: "8px",
  padding: "20px",
  marginBottom: "24px",
};

const reminderTitle = {
  fontSize: "16px",
  fontWeight: "bold",
  color: "#dc2626",
  margin: "0 0 8px 0",
};

const reminderText = {
  fontSize: "14px",
  color: "#7f1d1d",
  margin: "0",
  lineHeight: "20px",
};

const actionSection = {
  textAlign: "center" as const,
  marginBottom: "32px",
};

const button = {
  backgroundColor: "#dc2626",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "16px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 32px",
  fontWeight: "600",
};

const returnOptions = {
  marginBottom: "24px",
};

const sectionTitle = {
  fontSize: "18px",
  fontWeight: "bold",
  color: "#1f2937",
  marginBottom: "16px",
};

const optionText = {
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