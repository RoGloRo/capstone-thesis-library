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

interface BookBorrowingConfirmationEmailProps {
  userName: string;
  bookTitle: string;
  bookAuthor: string;
  borrowDate: string;
  dueDate: string;
  loanDuration: number; // in days
}

export const BookBorrowingConfirmationEmail = ({
  userName = "John Doe",
  bookTitle = "The Great Gatsby",
  bookAuthor = "F. Scott Fitzgerald",
  borrowDate = "December 15, 2024",
  dueDate = "December 22, 2024",
  loanDuration = 7,
}: BookBorrowingConfirmationEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Book borrowing confirmation - {bookTitle}</Preview>
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
            <Text style={title}>Book Successfully Borrowed! 🎉</Text>
            
            <Text style={greeting}>Hi {userName},</Text>
            
            <Text style={paragraph}>
              Great news! You&apos;ve successfully borrowed a book from our library. 
              Here are the details of your loan:
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

            <Hr style={divider} />

            <Section style={loanDetails}>
              <Text style={sectionTitle}>📅 Loan Details</Text>
              
              <Row style={detailRow}>
                <Column style={labelColumn}>
                  <Text style={label}>Borrowed on:</Text>
                </Column>
                <Column style={valueColumn}>
                  <Text style={value}>{borrowDate}</Text>
                </Column>
              </Row>

              <Row style={detailRow}>
                <Column style={labelColumn}>
                  <Text style={label}>Due date:</Text>
                </Column>
                <Column style={valueColumn}>
                  <Text style={value}>{dueDate}</Text>
                </Column>
              </Row>

              <Row style={detailRow}>
                <Column style={labelColumn}>
                  <Text style={label}>Loan duration:</Text>
                </Column>
                <Column style={valueColumn}>
                  <Text style={value}>{loanDuration} days</Text>
                </Column>
              </Row>
            </Section>

            <Hr style={divider} />

            <Section style={reminderSection}>
              <Text style={reminderTitle}>⏰ Important Reminder</Text>
              <Text style={reminderText}>
                Please make sure to return the book by <strong>{dueDate}</strong> to avoid any late fees. 
                You can return the book at any time through your profile or at the library desk.
              </Text>
            </Section>

            <Section style={actionSection}>
              <Link href={process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000/my-profile"} style={button}>
                View My Profile
              </Link>
            </Section>

            <Text style={paragraph}>
              Thank you for using Smart Library! Happy reading! 📚
            </Text>

            <Text style={signature}>
              Best regards,<br />
              The Smart Library Team
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              This email was sent from Smart Library. If you have any questions, 
              please contact us at contact@lemoroquias.online
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default BookBorrowingConfirmationEmail;

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
  color: "#1f2937",
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

const divider = {
  borderColor: "#e5e7eb",
  marginTop: "24px",
  marginBottom: "24px",
};

const loanDetails = {
  marginBottom: "24px",
};

const sectionTitle = {
  fontSize: "18px",
  fontWeight: "bold",
  color: "#1f2937",
  marginBottom: "16px",
};

const detailRow = {
  marginBottom: "8px",
};

const labelColumn = {
  width: "40%",
  verticalAlign: "top",
};

const valueColumn = {
  width: "60%",
  verticalAlign: "top",
};

const label = {
  fontSize: "14px",
  color: "#6b7280",
  margin: "0",
};

const value = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#1f2937",
  margin: "0",
};

const reminderSection = {
  backgroundColor: "#fef3cd",
  borderRadius: "8px",
  padding: "20px",
  marginBottom: "24px",
};

const reminderTitle = {
  fontSize: "16px",
  fontWeight: "bold",
  color: "#92400e",
  margin: "0 0 8px 0",
};

const reminderText = {
  fontSize: "14px",
  color: "#92400e",
  margin: "0",
  lineHeight: "20px",
};

const actionSection = {
  textAlign: "center" as const,
  marginBottom: "32px",
};

const button = {
  backgroundColor: "#3b82f6",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "16px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 32px",
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