// Test script for email notification workflows
// This helps debug the automated email systems

import { Client } from "@upstash/qstash";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';
const qstashToken = process.env.QSTASH_TOKEN;

async function testWorkflows() {
  if (!qstashToken) {
    console.error('❌ QSTASH_TOKEN not found in environment variables');
    return;
  }

  const qstash = new Client({ token: qstashToken });

  try {
    console.log('🧪 Testing Email Notification Workflows\n');

    // Test 1: Trigger overdue penalties workflow
    console.log('1. Testing Overdue Penalties Workflow...');
    try {
      const response = await fetch(`${baseUrl}/api/workflows/daily-overdue-penalties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true })
      });
      const result = await response.json();
      console.log('✅ Overdue penalties:', result.message);
      console.log(`   Processed: ${result.totalOverdue || 0}, Sent: ${result.emailsSent || 0}`);
    } catch (error) {
      console.error('❌ Overdue penalties failed:', error);
    }

    console.log('');

    // Test 2: Trigger due today reminders
    console.log('2. Testing Due Today Reminders Workflow...');
    try {
      const response = await fetch(`${baseUrl}/api/workflows/daily-due-today-reminders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true })
      });
      const result = await response.json();
      console.log('✅ Due today reminders:', result.message);
      console.log(`   Processed: ${result.totalDueToday || 0}, Sent: ${result.emailsSent || 0}`);
    } catch (error) {
      console.error('❌ Due today reminders failed:', error);
    }

    console.log('');

    // Test 3: Trigger due date reminders (tomorrow)
    console.log('3. Testing Due Date Reminders Workflow...');
    try {
      const response = await fetch(`${baseUrl}/api/check-due-date-reminders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true })
      });
      const result = await response.json();
      console.log('✅ Due date reminders:', result.message);
      console.log(`   Processed: ${result.results?.processed || 0}, Sent: ${result.results?.sent || 0}`);
    } catch (error) {
      console.error('❌ Due date reminders failed:', error);
    }

    console.log('\n🔧 Environment Check:');
    console.log(`   RESEND_TOKEN: ${process.env.RESEND_TOKEN ? '✅ Set' : '❌ Missing'}`);
    console.log(`   QSTASH_TOKEN: ${process.env.QSTASH_TOKEN ? '✅ Set' : '❌ Missing'}`);
    console.log(`   BASE_URL: ${baseUrl}`);

  } catch (error) {
    console.error('❌ Test script failed:', error);
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testWorkflows().catch(console.error);
}

export { testWorkflows };