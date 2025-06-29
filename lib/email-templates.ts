export interface InvitationEmailData {
  studentName: string
  studentEmail: string
  relationship: "parent" | "counselor"
  invitationToken: string
  recipientEmail: string
  isExistingUser: boolean
}

export function generateInvitationEmail(data: InvitationEmailData) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const actionUrl = data.isExistingUser
    ? `${baseUrl}/dashboard`
    : `${baseUrl}/signup?token=${data.invitationToken}&email=${encodeURIComponent(data.recipientEmail)}&role=${data.relationship}`

  const subject = `${data.studentName} has invited you to view their college search progress`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>College Search Invitation</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          border-radius: 8px 8px 0 0;
          text-align: center;
        }
        .content {
          background: #ffffff;
          padding: 30px;
          border: 1px solid #e1e5e9;
          border-top: none;
        }
        .footer {
          background: #f8f9fa;
          padding: 20px;
          border: 1px solid #e1e5e9;
          border-top: none;
          border-radius: 0 0 8px 8px;
          text-align: center;
          font-size: 14px;
          color: #6c757d;
        }
        .button {
          display: inline-block;
          background: #007bff;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 500;
          margin: 20px 0;
        }
        .button:hover {
          background: #0056b3;
        }
        .info-box {
          background: #f8f9fa;
          border-left: 4px solid #007bff;
          padding: 15px;
          margin: 20px 0;
        }
        .student-info {
          background: #e3f2fd;
          padding: 15px;
          border-radius: 6px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎓 College Search Invitation</h1>
        <p>You've been invited to follow a student's college journey</p>
      </div>
      
      <div class="content">
        <h2>Hello!</h2>
        
        <p><strong>${data.studentName}</strong> has invited you to view their college search progress as their <strong>${data.relationship}</strong>.</p>
        
        <div class="student-info">
          <h3>Student Information:</h3>
          <p><strong>Name:</strong> ${data.studentName}</p>
          <p><strong>Email:</strong> ${data.studentEmail}</p>
          <p><strong>Your Role:</strong> ${data.relationship === "parent" ? "Parent/Guardian" : "Counselor"}</p>
        </div>
        
        ${
          data.isExistingUser
            ? `
          <div class="info-box">
            <p><strong>Good news!</strong> You already have an account with us. Simply log in to your dashboard to see the new student connection.</p>
          </div>
          
          <p style="text-align: center;">
            <a href="${actionUrl}" class="button">Go to Dashboard</a>
          </p>
        `
            : `
          <div class="info-box">
            <p><strong>Getting Started:</strong> You'll need to create an account to view ${data.studentName}'s progress. Click the button below to sign up as a ${data.relationship}.</p>
          </div>
          
          <p style="text-align: center;">
            <a href="${actionUrl}" class="button">Create Account & Accept Invitation</a>
          </p>
        `
        }
        
        <h3>What you'll be able to see:</h3>
        <ul>
          <li>📊 Academic profile and test scores</li>
          <li>🏫 College shortlist and preferences</li>
          <li>📝 Application status and progress</li>
          <li>📈 AI-powered college recommendations</li>
          <li>📅 Important deadlines and milestones</li>
        </ul>
        
        <p><strong>Note:</strong> You'll have read-only access to ensure ${data.studentName} maintains control over their college search process.</p>
        
        <p>If you have any questions, feel free to reach out to ${data.studentName} directly at ${data.studentEmail}.</p>
      </div>
      
      <div class="footer">
        <p>This invitation was sent by ${data.studentName} through the College Search platform.</p>
        <p>If you didn't expect this invitation, you can safely ignore this email.</p>
        <p>&copy; 2024 College Search Platform. All rights reserved.</p>
      </div>
    </body>
    </html>
  `

  const text = `
${data.studentName} has invited you to view their college search progress

Hello!

${data.studentName} has invited you to view their college search progress as their ${data.relationship}.

Student Information:
- Name: ${data.studentName}
- Email: ${data.studentEmail}
- Your Role: ${data.relationship === "parent" ? "Parent/Guardian" : "Counselor"}

${
  data.isExistingUser
    ? `You already have an account with us. Simply log in to your dashboard to see the new student connection.

Visit: ${actionUrl}`
    : `You'll need to create an account to view ${data.studentName}'s progress. Visit the link below to sign up as a ${data.relationship}.

Sign up: ${actionUrl}`
}

What you'll be able to see:
- Academic profile and test scores
- College shortlist and preferences  
- Application status and progress
- AI-powered college recommendations
- Important deadlines and milestones

Note: You'll have read-only access to ensure ${data.studentName} maintains control over their college search process.

If you have any questions, feel free to reach out to ${data.studentName} directly at ${data.studentEmail}.

---
This invitation was sent by ${data.studentName} through the College Search platform.
If you didn't expect this invitation, you can safely ignore this email.
  `

  return { subject, html, text }
}

export function generateWelcomeEmail(userName: string, userRole: string) {
  const subject = `Welcome to College Search Platform!`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to College Search</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          border-radius: 8px;
          text-align: center;
        }
        .content {
          background: #ffffff;
          padding: 30px;
          border: 1px solid #e1e5e9;
          margin-top: 20px;
          border-radius: 8px;
        }
        .button {
          display: inline-block;
          background: #007bff;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 500;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎓 Welcome to College Search!</h1>
        <p>Your college journey starts here</p>
      </div>
      
      <div class="content">
        <h2>Hello ${userName}!</h2>
        
        <p>Welcome to the College Search platform! Your account has been successfully created as a <strong>${userRole}</strong>.</p>
        
        <p style="text-align: center;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard" class="button">Go to Dashboard</a>
        </p>
        
        <p>We're excited to help you on this journey. If you have any questions, don't hesitate to reach out!</p>
      </div>
    </body>
    </html>
  `

  const text = `
Welcome to College Search Platform!

Hello ${userName}!

Welcome to the College Search platform! Your account has been successfully created as a ${userRole}.

Visit your dashboard: ${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard

We're excited to help you on this journey. If you have any questions, don't hesitate to reach out!
  `

  return { subject, html, text }
}
