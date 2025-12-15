import jsPDF from 'jspdf';

interface BookReceiptData {
  // User Information
  userName: string;
  userEmail: string;
  universityId?: number;
  
  // Book Information
  bookTitle: string;
  bookAuthor: string;
  bookGenre: string;
  
  // Loan Information
  borrowDate: string;
  dueDate: string;
  returnDate?: string | null;
  loanDuration: number; // days
  status: 'Active' | 'Returned' | 'Overdue';
}

export function generatePDFReceipt(receiptData: BookReceiptData): void {
  const doc = new jsPDF();
  
  // Set up colors
  const primaryColor: [number, number, number] = [59, 130, 246]; // blue-500
  const textColor: [number, number, number] = [31, 41, 55]; // gray-800
  const lightGray: [number, number, number] = [156, 163, 175]; // gray-400
  const successColor: [number, number, number] = [34, 197, 94]; // green-500
  const warningColor: [number, number, number] = [245, 158, 11]; // amber-500
  const dangerColor: [number, number, number] = [239, 68, 68]; // red-500
  
  // Header with background
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setFontSize(24);
  doc.setTextColor(255, 255, 255);
  doc.text('SMART LIBRARY', 20, 25);
  
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('Book Loan Receipt', 20, 35);
  
  // Receipt ID
  const receiptId = `SL-${Date.now().toString().slice(-8)}`;
  doc.setFontSize(10);
  doc.text(`Receipt ID: ${receiptId}`, 140, 25);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 140, 32);
  
  let yPosition = 60;
  
  // User Information Section
  doc.setFontSize(14);
  doc.setTextColor(...primaryColor);
  doc.text('User Information', 20, yPosition);
  
  yPosition += 15;
  doc.setFontSize(11);
  doc.setTextColor(...textColor);
  
  doc.text(`Name: ${receiptData.userName}`, 25, yPosition);
  yPosition += 8;
  doc.text(`Email: ${receiptData.userEmail}`, 25, yPosition);
  yPosition += 8;
  
  if (receiptData.universityId) {
    doc.text(`University ID: ${receiptData.universityId}`, 25, yPosition);
    yPosition += 8;
  }
  
  yPosition += 10;
  
  // Book Information Section
  doc.setFontSize(14);
  doc.setTextColor(...primaryColor);
  doc.text('Book Information', 20, yPosition);
  
  yPosition += 15;
  doc.setFontSize(11);
  doc.setTextColor(...textColor);
  
  doc.text(`Title: ${receiptData.bookTitle}`, 25, yPosition);
  yPosition += 8;
  doc.text(`Author: ${receiptData.bookAuthor}`, 25, yPosition);
  yPosition += 8;
  doc.text(`Genre: ${receiptData.bookGenre}`, 25, yPosition);
  yPosition += 15;
  
  // Loan Information Section
  doc.setFontSize(14);
  doc.setTextColor(...primaryColor);
  doc.text('Loan Information', 20, yPosition);
  
  yPosition += 15;
  doc.setFontSize(11);
  doc.setTextColor(...textColor);
  
  doc.text(`Borrow Date: ${receiptData.borrowDate}`, 25, yPosition);
  yPosition += 8;
  doc.text(`Due Date: ${receiptData.dueDate}`, 25, yPosition);
  yPosition += 8;
  
  if (receiptData.returnDate) {
    doc.text(`Return Date: ${receiptData.returnDate}`, 25, yPosition);
    yPosition += 8;
  }
  
  doc.text(`Loan Duration: ${receiptData.loanDuration} days`, 25, yPosition);
  yPosition += 15;
  
  // Status Section with colored indicator
  doc.setFontSize(14);
  doc.setTextColor(...primaryColor);
  doc.text('Loan Status', 20, yPosition);
  
  yPosition += 15;
  doc.setFontSize(12);
  
  // Set status color based on status
  let statusColor: [number, number, number];
  let statusIcon = '';
  switch (receiptData.status) {
    case 'Returned':
      statusColor = successColor;
      statusIcon = '✓';
      break;
    case 'Overdue':
      statusColor = dangerColor;
      statusIcon = '⚠';
      break;
    default:
      statusColor = warningColor;
      statusIcon = '●';
  }
  
  doc.setTextColor(...statusColor);
  doc.text(`${statusIcon} ${receiptData.status}`, 25, yPosition);
  
  yPosition += 20;
  
  // Summary Section
  doc.setDrawColor(...lightGray);
  doc.setLineWidth(0.5);
  doc.line(20, yPosition, 190, yPosition);
  
  yPosition += 15;
  doc.setFontSize(14);
  doc.setTextColor(...primaryColor);
  doc.text('Summary', 20, yPosition);
  
  yPosition += 15;
  doc.setFontSize(11);
  doc.setTextColor(...textColor);
  
  if (receiptData.status === 'Returned') {
    doc.text('✓ Book successfully returned', 25, yPosition);
    yPosition += 8;
    doc.text('✓ No outstanding charges', 25, yPosition);
  } else if (receiptData.status === 'Overdue') {
    doc.text('⚠ Book is overdue - please return immediately', 25, yPosition);
    yPosition += 8;
    doc.text('⚠ Late fees may apply', 25, yPosition);
  } else {
    doc.text('● Active loan - please return by due date', 25, yPosition);
    yPosition += 8;
    doc.text('● Contact library for renewal if needed', 25, yPosition);
  }
  
  yPosition += 20;
  
  // Footer
  doc.setDrawColor(...lightGray);
  doc.line(20, yPosition, 190, yPosition);
  
  yPosition += 15;
  doc.setFontSize(10);
  doc.setTextColor(...lightGray);
  doc.text('Generated on: ' + new Date().toLocaleString(), 20, yPosition);
  yPosition += 8;
  doc.text('Smart Library Management System', 20, yPosition);
  
  // Generate filename
  const sanitizedBookTitle = receiptData.bookTitle.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `library_receipt_${sanitizedBookTitle}_${Date.now()}.pdf`;
  
  // Download the PDF
  doc.save(filename);
}

// Helper function to calculate loan duration
export function calculateLoanDuration(borrowDate: string, dueDate: string): number {
  const borrow = new Date(borrowDate);
  const due = new Date(dueDate);
  const diffTime = Math.abs(due.getTime() - borrow.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// Helper function to determine loan status
export function determineLoanStatus(dueDate: string, returnDate?: string | null): 'Active' | 'Returned' | 'Overdue' {
  if (returnDate) {
    return 'Returned';
  }
  
  const now = new Date();
  const due = new Date(dueDate);
  
  if (now > due) {
    return 'Overdue';
  }
  
  return 'Active';
}

// Helper function to format date for display
export function formatDisplayDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}