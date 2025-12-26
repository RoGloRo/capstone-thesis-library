// Quick test to check the welcome email functionality

import { db } from './database/drizzle.js';
import { emailLogs, users } from './database/schema.js';
import { desc, eq } from 'drizzle-orm';

async function checkWelcomeEmails() {
  try {
    console.log('🔍 Checking recent welcome emails...\n');
    
    // Get recent welcome emails from the logs
    const recentWelcomeEmails = await db
      .select()
      .from(emailLogs)
      .where(eq(emailLogs.emailType, 'WELCOME'))
      .orderBy(desc(emailLogs.createdAt))
      .limit(10);
    
    if (recentWelcomeEmails.length === 0) {
      console.log('❌ No welcome emails found in the logs');
      console.log('💡 This could mean:');
      console.log('   1. No users have registered recently');
      console.log('   2. The email logging is not working');
      console.log('   3. The welcome email workflow is not being triggered\n');
    } else {
      console.log(`✅ Found ${recentWelcomeEmails.length} recent welcome emails:\n`);
      
      recentWelcomeEmails.forEach((email, index) => {
        console.log(`${index + 1}. Email to: ${email.recipientEmail}`);
        console.log(`   Name: ${email.recipientName}`);
        console.log(`   Status: ${email.status}`);
        console.log(`   Sent: ${email.createdAt}`);
        console.log(`   Subject: ${email.subject}`);
        if (email.errorMessage) {
          console.log(`   Error: ${email.errorMessage}`);
        }
        console.log('');
      });
    }

    // Check the users table for recent registrations
    console.log('👥 Checking recent user registrations...\n');
    
    const recentUsers = await db
      .select({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        status: users.status,
        createdAt: users.createdAt
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(5);
      
    if (recentUsers.length === 0) {
      console.log('❌ No users found in the database');
    } else {
      console.log(`✅ Found ${recentUsers.length} recent users:\n`);
      
      recentUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.fullName} (${user.email})`);
        console.log(`   Status: ${user.status}`);
        console.log(`   Registered: ${user.createdAt}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking emails:', error.message);
  }
}

checkWelcomeEmails();