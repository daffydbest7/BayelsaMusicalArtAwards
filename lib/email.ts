export interface SendEmailArgs {
  to: string;
  subject: string;
  html: string;
}

/**
 * Helper to dispatch emails.
 * If EMAIL_PROVIDER_API_KEY is not configured, it logs the email content to console
 * to allow local development and testing without credentials.
 */
export async function sendEmail({ to, subject, html }: SendEmailArgs): Promise<boolean> {
  const apiKey = process.env.EMAIL_PROVIDER_API_KEY;

  if (!apiKey) {
    console.log(`
=========================================
[EMAIL MOCK DISPATCH]
To: ${to}
Subject: ${subject}
Content: 
${html.replace(/<[^>]*>/g, " ").trim()}
=========================================
    `);
    return true;
  }

  try {
    // If they configure an email provider in the future (e.g. Resend), they can swap this stub
    // For now we'll do a simple mock fetch or integration if needed.
    // Example Resend implementation:
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "BMAA Awards <noreply@bmaa.gov.ng>", // customize as needed
        to,
        subject,
        html,
      }),
    });

    if (response.ok) {
      return true;
    } else {
      const errorText = await response.text();
      console.error("Resend email dispatch failed:", errorText);
      return false;
    }
  } catch (err) {
    console.error("Error sending email:", err);
    return false;
  }
}
