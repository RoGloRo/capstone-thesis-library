# PDF Receipt Download Feature

## Overview
The PDF Receipt Download feature allows users to generate and download professional PDF receipts for their borrowed books. This feature is available in the user's profile page for both currently borrowed books and reading history.

## Features
- **Professional PDF Layout**: Clean, branded design with Smart Library header
- **Comprehensive Information**: Includes user details, book information, and loan specifics
- **Status-Based Styling**: Different visual indicators for Active, Returned, and Overdue loans
- **Automatic Download**: PDFs are automatically downloaded to the user's device
- **Unique Receipt IDs**: Each receipt gets a unique identifier for tracking
- **Error Handling**: User-friendly error messages and loading states

## Technical Implementation

### Files Modified/Created
1. **`lib/pdf-receipt.ts`** - Core PDF generation utility using jsPDF
2. **`components/BookCard.tsx`** - Updated to include download functionality
3. **`components/BookList.tsx`** - Updated to pass user data to BookCard
4. **`app/(root)/my-profile/page.tsx`** - Updated to provide user data to components

### Dependencies
- **jsPDF**: PDF generation library
- **@types/jspdf**: TypeScript definitions for jsPDF
- **sonner**: Toast notifications for user feedback

### PDF Content Structure
1. **Header Section**
   - Smart Library branding with blue background
   - Receipt ID and generation timestamp
   
2. **User Information**
   - Full name
   - Email address
   - University ID (if available)
   
3. **Book Information**
   - Book title
   - Author name
   - Genre
   
4. **Loan Information**
   - Borrow date
   - Due date
   - Return date (if returned)
   - Loan duration in days
   
5. **Status Section**
   - Visual status indicator with appropriate colors
   - Status-specific messages and recommendations
   
6. **Summary Section**
   - Status-based summary information
   - Helpful tips based on loan status

### Usage
1. Navigate to "My Profile" page
2. Find a borrowed book in either "Currently Borrowed Books" or "Reading History"
3. Click the "Download Receipt" button
4. PDF is automatically generated and downloaded
5. Success/error notifications provide user feedback

### Error Handling
- Missing required data validation
- User-friendly error messages via toast notifications
- Loading states with disabled button and spinner
- Try-catch blocks around PDF generation

### Security Considerations
- Only users can download receipts for their own books
- User data is passed securely through component props
- No sensitive information is stored in the PDF utility

### Future Enhancements
- Email receipt option
- Batch download for multiple receipts
- Custom receipt templates
- Print functionality
- Receipt history storage

## Code Examples

### Basic Usage in Component
```tsx
const handleDownloadReceipt = async () => {
  const receiptData = {
    userName: 'John Doe',
    userEmail: 'john@university.edu',
    universityId: 12345,
    bookTitle: 'The Great Gatsby',
    bookAuthor: 'F. Scott Fitzgerald',
    bookGenre: 'Classic Literature',
    borrowDate: 'January 15, 2024',
    dueDate: 'February 14, 2024',
    returnDate: null,
    loanDuration: 30,
    status: 'Active'
  };
  
  generatePDFReceipt(receiptData);
};
```

### Helper Functions
```tsx
// Calculate loan duration
const duration = calculateLoanDuration(borrowDate, dueDate);

// Determine current status
const status = determineLoanStatus(dueDate, returnDate);

// Format dates for display
const formattedDate = formatDisplayDate(dateString);
```