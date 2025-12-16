import {
  Html,
  Head,
  Font,
  Preview,
  Tailwind,
  Body,
  Container,
  Section,
  Row,
  Column,
  Heading,
  Text,
  Link,
  Button,
  Hr,
  Img,
} from '@react-email/components';

interface OverdueBookEmailProps {
  userName: string;
  bookTitle: string;
  bookAuthor: string;
  borrowDate: string;
  dueDate: string;
  daysOverdue: number;
  penaltyAmount?: number;
  returnBookUrl?: string;
}

const OverdueBookEmail = ({
  userName = "Library Member",
  bookTitle = "Sample Book Title",
  bookAuthor = "Sample Author",
  borrowDate = "December 1, 2025",
  dueDate = "December 8, 2025", 
  daysOverdue = 3,
  penaltyAmount = 1.50,
  returnBookUrl = "http://localhost:3001/my-profile"
}: OverdueBookEmailProps) => {
  return (
    <Html>
      <Head>
        <Font
          fontFamily="Roboto"
          fallbackFontFamily="Verdana"
          webFont={{
            url: 'https://fonts.gstatic.com/s/roboto/v27/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.woff2',
            format: 'woff2',
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      <Preview>⚠️ Overdue Book: {bookTitle} - Return Required</Preview>
      
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans px-2">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px]">
            {/* Header */}
            <Section className="mt-[32px]">
              <div className="text-center">
                <div className="bg-red-600 text-white p-4 rounded-lg mb-6">
                  <Text className="text-2xl font-bold m-0">⚠️ OVERDUE NOTICE</Text>
                </div>
              </div>
            </Section>

            {/* Main Content */}
            <Section className="my-[32px]">
              <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
                Overdue Book Return Required
              </Heading>
              
              <Text className="text-black text-[16px] leading-[24px]">
                Dear <strong>{userName}</strong>,
              </Text>
              
              <Text className="text-black text-[16px] leading-[24px]">
                This is an urgent notice that you have an <strong className="text-red-600">overdue book</strong> that requires immediate attention. Please return the book as soon as possible to avoid additional penalties.
              </Text>

              {/* Book Details Card */}
              <Section className="bg-red-50 border border-red-200 rounded-lg p-4 my-6">
                <Row>
                  <Column>
                    <Text style={bookTitle as any} className="text-lg font-bold text-red-800 m-0">
                      📚 {bookTitle}
                    </Text>
                    <Text style={bookAuthor as any} className="text-red-700 text-sm mt-1 mb-3">
                      by {bookAuthor}
                    </Text>
                  </Column>
                </Row>
                
                <Hr className="border-red-200 my-3" />
                
                {/* Loan Details */}
                <Row className="mb-2">
                  <Column width="50%">
                    <Text style={loanLabel}>Borrowed:</Text>
                    <Text style={loanValue}>{borrowDate}</Text>
                  </Column>
                  <Column width="50%">
                    <Text style={loanLabel}>Due Date:</Text>
                    <Text style={dueDateValue}>{dueDate}</Text>
                  </Column>
                </Row>
                
                <Row className="mb-2">
                  <Column width="50%">
                    <Text style={loanLabel}>Status:</Text>
                    <Text style={statusValue}>⚠️ OVERDUE</Text>
                  </Column>
                  <Column width="50%">
                    <Text style={loanLabel}>Days Overdue:</Text>
                    <Text style={overdueValue}>{daysOverdue} day{daysOverdue !== 1 ? 's' : ''}</Text>
                  </Column>
                </Row>
                
                {penaltyAmount && penaltyAmount > 0 && (
                  <Row>
                    <Column>
                      <Text style={loanLabel}>Current Penalty:</Text>
                      <Text style={penaltyValue}>${penaltyAmount.toFixed(2)}</Text>
                      <Text className="text-xs text-red-600 mt-1">
                        *Penalty increases daily until book is returned
                      </Text>
                    </Column>
                  </Row>
                )}
              </Section>

              {/* Action Required */}
              <Section className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 my-6">
                <Text className="text-yellow-800 font-bold text-center m-0 mb-2">
                  🚨 IMMEDIATE ACTION REQUIRED
                </Text>
                <Text className="text-yellow-700 text-sm text-center m-0">
                  Please return this book immediately to avoid additional penalties and maintain your borrowing privileges.
                </Text>
              </Section>

              {/* Return Button */}
              <Section className="text-center my-[32px]">
                <Button
                  className="bg-red-600 rounded text-white text-[16px] font-semibold no-underline text-center px-6 py-3 hover:bg-red-700 transition-colors"
                  href={returnBookUrl}
                >
                  🔄 Return Book Now
                </Button>
              </Section>

              {/* Important Information */}
              <Section className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <Text className="text-gray-800 font-bold text-sm mb-2">Important Information:</Text>
                <Text className="text-gray-700 text-sm leading-relaxed m-0">
                  • Late returns may result in suspension of borrowing privileges<br/>
                  • Penalties continue to accrue until the book is returned<br/>
                  • Contact the library if you're unable to return the book<br/>
                  • Lost books will be charged replacement cost plus processing fee
                </Text>
              </Section>
            </Section>

            {/* Footer */}
            <Section className="mt-[32px]">
              <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
              <Text className="text-[#666666] text-[12px] leading-[24px] text-center">
                Smart University Library System<br/>
                This is an automated notification. Please do not reply to this email.<br/>
                <Link href="#" className="text-blue-600 no-underline">
                  Contact Library Support
                </Link> if you need assistance.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

// Styles
const bookTitle = {
  color: '#7f1d1d',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0',
};

const bookAuthor = {
  color: '#b91c1c',
  fontSize: '14px',
  margin: '4px 0 12px 0',
};

const loanLabel = {
  color: '#7f1d1d',
  fontSize: '12px',
  fontWeight: 'bold',
  margin: '0 0 2px 0',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

const loanValue = {
  color: '#1f2937',
  fontSize: '14px',
  fontWeight: '500',
  margin: '0 0 8px 0',
};

const dueDateValue = {
  color: '#dc2626',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
};

const statusValue = {
  color: '#dc2626',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
  backgroundColor: '#fef2f2',
  padding: '2px 6px',
  borderRadius: '4px',
  display: 'inline-block' as const,
};

const overdueValue = {
  color: '#dc2626',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
};

const penaltyValue = {
  color: '#dc2626',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0',
};

export default OverdueBookEmail;