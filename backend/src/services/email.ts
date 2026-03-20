import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM_EMAIL || 'noreply@babel.local'
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

export async function sendVerificationEmail(email: string, username: string, token: string) {
  const link = `${FRONTEND_URL}/verify-email?token=${token}`

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Welcome to Babel — confirm your email',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="color: #1a1a2e;">Welcome to Babel, ${username}!</h1>
        <p>Thanks for signing up. Please confirm your email address to get started.</p>
        <a href="${link}"
           style="display: inline-block; margin: 24px 0; padding: 12px 24px;
                  background: #6c63ff; color: white; border-radius: 8px;
                  text-decoration: none; font-weight: bold;">
          Confirm Email
        </a>
        <p style="color: #888; font-size: 13px;">
          This link expires in 24 hours. If you didn't create a Babel account, you can ignore this email.
        </p>
      </div>
    `,
  })
}

export async function sendPasswordResetEmail(email: string, username: string, token: string) {
  const link = `${FRONTEND_URL}/reset-password?token=${token}`

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Babel — reset your password',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="color: #1a1a2e;">Password Reset</h1>
        <p>Hi ${username}, we received a request to reset your Babel password.</p>
        <a href="${link}"
           style="display: inline-block; margin: 24px 0; padding: 12px 24px;
                  background: #6c63ff; color: white; border-radius: 8px;
                  text-decoration: none; font-weight: bold;">
          Reset Password
        </a>
        <p style="color: #888; font-size: 13px;">
          This link expires in 1 hour. If you didn't request a password reset, you can ignore this email.
        </p>
      </div>
    `,
  })
}
