import fs from "fs"
import path from "path"

// Helper function to get base64 logo
function getBase64Logo(): string {
  try {
    const logoPath = path.join(process.cwd(), "public", "logo.png")
    const logoBuffer = fs.readFileSync(logoPath)
    return logoBuffer.toString('base64')
  } catch (error) {
    console.error("Error reading logo file:", error)
    return ""
  }
}

export interface InvitationEmailData {
  studentName: string
  studentEmail: string
  relationship: "parent" | "other"
  invitationToken: string
  recipientEmail: string
  isExistingUser: boolean
}

export function generateInvitationEmail(data: InvitationEmailData) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const imageBaseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://coachingforcollege.org"
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
        <div style="margin-bottom: 20px;">
          <img src="data:image/png;base64,${getBase64Logo()}" alt="Coaching for College" style="width: 120px; height: auto; display: block; margin: 0 auto;">
          <div style="color: white; font-size: 18px; font-weight: 600; margin-top: 10px; text-align: center;">Coaching for College</div>
        </div>
        <h1 style="margin: 0; font-size: 28px; font-weight: 700;">College Search Invitation</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">You've been invited to follow a student's college journey</p>
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
        <p>&copy; 2025 Coaching for College. All rights reserved.</p>
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
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const imageBaseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://coachingforcollege.org"
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
        <div style="margin-bottom: 20px;">
          <img src="data:image/png;base64,${getBase64Logo()}" alt="Coaching for College" style="width: 120px; height: auto; display: block; margin: 0 auto;">
          <div style="color: white; font-size: 18px; font-weight: 600; margin-top: 10px; text-align: center;">Coaching for College</div>
        </div>
        <h1 style="margin: 0; font-size: 28px; font-weight: 700;">Welcome to Coaching for College!</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your college journey starts here</p>
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

export interface EmailConfirmationData {
  userName: string
  confirmationUrl: string
}

export function generateEmailConfirmationEmail(data: EmailConfirmationData) {
  // Use a production URL for images in emails, fallback to localhost for development
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const imageBaseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://coachingforcollege.org"
  const signInUrl = `${baseUrl}/login`
  
  const subject = `Welcome to Coaching for College - Confirm Your Email`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirm Your Email - Coaching for College</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8f9fa;
        }
        .container {
          background: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #364C56 0%, #4A5568 100%);
          color: white;
          padding: 40px 30px;
          text-align: center;
        }
        .logo {
          width: 120px;
          height: auto;
          margin-bottom: 20px;
        }
        .content {
          padding: 40px 30px;
          text-align: center;
        }
        .welcome-text {
          font-size: 24px;
          font-weight: 600;
          color: #364C56;
          margin-bottom: 20px;
        }
        .message {
          font-size: 16px;
          color: #4A5568;
          margin-bottom: 30px;
          line-height: 1.6;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
          color: #FFFFFF !important;
          padding: 16px 32px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          margin: 20px 0;
          transition: all 0.3s ease;
          box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
          text-align: center;
        }
        .button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(59, 130, 246, 0.4);
        }
        .footer {
          background: #f8f9fa;
          padding: 30px;
          text-align: center;
          border-top: 1px solid #e2e8f0;
        }
        .footer-text {
          font-size: 14px;
          color: #6c757d;
          margin-bottom: 10px;
        }
        .signin-link {
          color: #364C56;
          text-decoration: none;
          font-weight: 500;
        }
        .signin-link:hover {
          text-decoration: underline;
        }
        .divider {
          height: 1px;
          background: #e2e8f0;
          margin: 30px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div style="margin-bottom: 20px;">
            <img src="data:image/png;base64,${getBase64Logo()}" alt="Coaching for College" style="width: 120px; height: auto; display: block; margin: 0 auto;">
            <div style="color: white; font-size: 18px; font-weight: 600; margin-top: 10px; text-align: center;">Coaching for College</div>
          </div>
          <h1 style="margin: 0; font-size: 28px; font-weight: 700;">Welcome to Coaching for College</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your college journey starts here</p>
        </div>
        
        <div class="content">
          <div class="welcome-text">Hello ${data.userName}!</div>
          
          <div class="message">
            Thank you for joining Coaching for College! We're excited to help you on your college application journey.
            <br><br>
            To get started, please confirm your email address by clicking the button below.
          </div>
          
          <a href="${data.confirmationUrl}" class="button" style="color: #FFFFFF !important; text-decoration: none;">Confirm Email Address</a>
          
          <div class="divider"></div>
          
          <div class="message" style="font-size: 14px; color: #6c757d;">
            If the button doesn't work, you can copy and paste this link into your browser:
            <br>
            <a href="${data.confirmationUrl}" style="color: #364C56; word-break: break-all;">${data.confirmationUrl}</a>
          </div>
        </div>
        
        <div class="footer">
          <div class="footer-text">
            Once you've confirmed your email, you can sign in to your account.
          </div>
          <a href="${signInUrl}" class="signin-link">Sign In to Your Account</a>
          <div class="footer-text" style="margin-top: 20px;">
            &copy; 2025 Coaching for College. All rights reserved.
          </div>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
Welcome to Coaching for College - Confirm Your Email

Hello ${data.userName}!

Thank you for joining Coaching for College! We're excited to help you on your college application journey.

To get started, please confirm your email address by visiting this link:

${data.confirmationUrl}

Once you've confirmed your email, you can sign in to your account at:

${signInUrl}

If you have any questions, please don't hesitate to reach out to our support team.

Best regards,
The Coaching for College Team

---
© 2025 Coaching for College. All rights reserved.
  `

  return { subject, html, text }
}
