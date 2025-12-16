import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface BookReturnConfirmationEmailProps {
  userName: string;
  bookTitle: string;
  bookAuthor: string;
  returnDate: string;
  borrowDate?: string;
  loanDuration?: number;
  libraryUrl?: string;
}

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export const BookReturnConfirmationEmail = ({
  userName = "John Doe",
  bookTitle = "The Great Gatsby",
  bookAuthor = "F. Scott Fitzgerald",
  returnDate = "December 16, 2024",
  borrowDate = "December 1, 2024",
  loanDuration = 15,
  libraryUrl = `${baseUrl}/library`,
}: BookReturnConfirmationEmailProps) => (
  <Html>
    <Head />
    <Preview>📚 Thank you for returning &quot;{bookTitle}&quot; - Happy Reading!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={headerText}>SMART LIBRARY</Text>
          <Text style={subHeaderText}>Book Return Confirmation</Text>
        </Section>
        
        <Section style={content}>
          <Text style={greeting}>Hi {userName},</Text>
          
          <Section style={successBox}>
            <Text style={successTitle}>✅ Book Successfully Returned!</Text>
            <Text style={successMessage}>
              Thank you for returning your book on time. We hope you enjoyed your reading experience!
            </Text>
          </Section>

          <Section style={bookSection}>
            <Text style={sectionTitle}>📖 Returned Book</Text>
            <Text style={bookTitleStyle}>{bookTitle}</Text>
            <Text style={bookAuthorStyle}>by {bookAuthor}</Text>
          </Section>

          <Section style={detailsSection}>
            <Text style={sectionTitle}>📋 Return Details</Text>
            <div style={detailsList}>
              <div style={detailItem}>
                <Text style={detailLabel}>Return Date:</Text>
                <Text style={detailValue}>{returnDate}</Text>
              </div>
              {borrowDate && (
                <div style={detailItem}>
                  <Text style={detailLabel}>Originally Borrowed:</Text>
                  <Text style={detailValue}>{borrowDate}</Text>
                </div>
              )}
              {loanDuration && (
                <div style={detailItem}>
                  <Text style={detailLabel}>Total Loan Period:</Text>
                  <Text style={detailValue}>{loanDuration} days</Text>
                </div>
              )}
              <div style={detailItem}>
                <Text style={detailLabel}>Status:</Text>
                <Text style={statusValue}>✅ Returned</Text>
              </div>
            </div>
          </Section>

          <Section style={actionSection}>
            <Text style={actionText}>
              Ready for your next literary adventure? Explore our collection and discover your next favorite book!
            </Text>
            <Button style={button} href={libraryUrl}>
              Explore More Books
            </Button>
          </Section>

          <Section style={benefitsSection}>
            <Text style={benefitsTitle}>📚 What&apos;s Next?</Text>
            <div style={benefitsList}>
              <Text style={benefitItem}>• Browse thousands of books in our collection</Text>
              <Text style={benefitItem}>• Get personalized book recommendations</Text>
              <Text style={benefitItem}>• Check out new arrivals and popular titles</Text>
              <Text style={benefitItem}>• Manage your reading history and favorites</Text>
            </div>
          </Section>

          <Hr style={hr} />
          
          <Section style={footer}>
            <Text style={footerText}>
              Thank you for being a valued member of Smart Library! 
            </Text>
            <Text style={footerNote}>
              Happy reading and see you soon for your next book adventure!
            </Text>
          </Section>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default BookReturnConfirmationEmail;

// Styles
const main = {
  backgroundColor: "#f8fafc",
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "20px",
  maxWidth: "600px",
};

const header = {
  backgroundColor: "#10b981", // Green for success
  borderRadius: "8px 8px 0 0",
  padding: "30px 20px",
  textAlign: "center" as const,
};

const headerText = {
  color: "#ffffff",
  fontSize: "28px",
  fontWeight: "bold",
  margin: "0 0 8px 0",
  letterSpacing: "1px",
};

const subHeaderText = {
  color: "#d1fae5",
  fontSize: "16px",
  margin: "0",
  fontWeight: "500",
};

const content = {
  backgroundColor: "#ffffff",
  borderRadius: "0 0 8px 8px",
  padding: "40px 30px",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
};

const greeting = {
  fontSize: "18px",
  color: "#1f2937",
  marginBottom: "24px",
  fontWeight: "600",
};

const successBox = {
  backgroundColor: "#f0fdf4",
  border: "2px solid #bbf7d0",
  borderRadius: "8px",
  padding: "20px",
  marginBottom: "30px",
};

const successTitle = {
  fontSize: "18px",
  fontWeight: "bold",
  color: "#166534",
  margin: "0 0 8px 0",
};

const successMessage = {
  fontSize: "14px",
  color: "#15803d",
  margin: "0",
  lineHeight: "1.5",
};

const bookSection = {
  marginBottom: "24px",
  padding: "20px",
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  border: "1px solid #e5e7eb",
};

const detailsSection = {
  marginBottom: "30px",
  padding: "20px",
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  border: "1px solid #e5e7eb",
};

const sectionTitle = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#374151",
  marginBottom: "16px",
  margin: "0 0 16px 0",
};

const bookTitleStyle = {
  fontSize: "20px",
  fontWeight: "600",
  color: "#1f2937",
  margin: "0 0 8px 0",
};

const bookAuthorStyle = {
  fontSize: "14px",
  color: "#6b7280",
  margin: "0",
  fontStyle: "italic",
};

const detailsList = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "12px",
};

const detailItem = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "8px 0",
  borderBottom: "1px solid #f3f4f6",
};

const detailLabel = {
  fontSize: "14px",
  color: "#6b7280",
  fontWeight: "500",
  margin: "0",
};

const detailValue = {
  fontSize: "14px",
  color: "#1f2937",
  fontWeight: "600",
  margin: "0",
};

const statusValue = {
  fontSize: "14px",
  color: "#10b981",
  fontWeight: "700",
  margin: "0",
};

const actionSection = {
  textAlign: "center" as const,
  marginBottom: "30px",
};

const actionText = {
  fontSize: "16px",
  color: "#374151",
  marginBottom: "20px",
  lineHeight: "1.5",
};

const button = {
  backgroundColor: "#10b981",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 28px",
  margin: "0 auto",
};

const benefitsSection = {
  marginBottom: "30px",
  padding: "20px",
  backgroundColor: "#f0fdf4",
  borderRadius: "8px",
  border: "1px solid #bbf7d0",
};

const benefitsTitle = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#166534",
  marginBottom: "12px",
  margin: "0 0 12px 0",
};

const benefitsList = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "8px",
};

const benefitItem = {
  fontSize: "14px",
  color: "#15803d",
  margin: "0",
  lineHeight: "1.4",
};

const hr = {
  borderColor: "#e5e7eb",
  margin: "30px 0",
};

const footer = {
  textAlign: "center" as const,
};

const footerText = {
  fontSize: "14px",
  color: "#6b7280",
  marginBottom: "8px",
  lineHeight: "1.5",
};

const footerNote = {
  fontSize: "12px",
  color: "#9ca3af",
  margin: "0",
  fontStyle: "italic",
};