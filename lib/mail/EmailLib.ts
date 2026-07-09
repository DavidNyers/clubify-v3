import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * Sends an email to a partner regarding their application status.
 */
export async function sendApplicationStatusEmail({
  to,
  venueName,
  status,
  notes
}: {
  to: string
  venueName: string
  status: 'approved' | 'rejected'
  notes?: string
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY is missing. Email skipped.')
    return { success: false, error: 'API Key missing' }
  }

  const subject = status === 'approved' 
    ? `Willkommen bei Clubify! 🎉 ${venueName} wurde freigeschaltet`
    : `Update zu deiner Bewerbung bei Clubify: ${venueName}`

  const html = status === 'approved' 
    ? `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #09090b; color: #ffffff; padding: 40px; border-radius: 24px; border: 1px solid #27272a;">
        <h1 style="color: #8b5cf6; font-size: 24px; font-weight: 800; margin-bottom: 20px;">🎉 Herzlich Willkommen Partner!</h1>
        <p style="font-size: 16px; line-height: 1.6; color: #a1a1aa;">Gute Nachrichten! Deine Bewerbung für <strong>${venueName}</strong> wurde erfolgreich geprüft und genehmigt.</p>
        <div style="background: rgba(139, 92, 246, 0.1); padding: 20px; border-radius: 12px; margin: 24px 0; border: 1px solid rgba(139,92,246,0.2);">
          <p style="margin: 0; color: #ffffff; font-weight: 600;">Deine neue Rolle wurde soeben freigeschaltet.</p>
          <p style="margin: 8px 0 0 0; color: #a78bfa; font-size: 14px;">Du kannst nun dein Dashboard nutzen, um dein Profil zu vervollständigen und Events zu erstellen.</p>
        </div>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display: inline-block; background: #8b5cf6; color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 700; margin-top: 20px;">Zum Dashboard</a>
        <p style="margin-top: 40px; font-size: 12px; color: #52525b; border-top: 1px solid #27272a; padding-top: 20px;">Team Clubify | Nightlife Reimagined</p>
      </div>
    `
    : `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #09090b; color: #ffffff; padding: 40px; border-radius: 24px; border: 1px solid #27272a;">
        <h1 style="color: #f87171; font-size: 24px; font-weight: 800; margin-bottom: 20px;">Update zu deiner Bewerbung</h1>
        <p style="font-size: 16px; line-height: 1.6; color: #a1a1aa;">Vielen Dank für dein Interesse an Clubify. Nach einer sorgfältigen Prüfung konnten wir deine Bewerbung für <strong>${venueName}</strong> aktuell leider nicht genehmigen.</p>
        
        ${notes ? `
          <div style="background: rgba(24, 24, 27, 0.6); padding: 20px; border-radius: 12px; margin: 24px 0; border: 1px solid #27272a;">
            <p style="margin: 0; color: #ffffff; font-weight: 600;">Anmerkung vom Admin:</p>
            <p style="margin: 8px 0 0 0; color: #71717a; font-size: 14px;">${notes}</p>
          </div>
        ` : ''}

        <p style="font-size: 14px; color: #71717a;">Du kannst uns jederzeit kontaktieren, falls du Fragen hast oder deine Bewerbung zu einem späteren Zeitpunkt erneut einreichen möchtest.</p>
        <p style="margin-top: 40px; font-size: 12px; color: #52525b; border-top: 1px solid #27272a; padding-top: 20px;">Team Clubify | Nightlife Reimagined</p>
      </div>
    `

  try {
    const { data, error } = await resend.emails.send({
      from: 'Clubify <onboarding@resend.dev>',
      to: [to],
      subject: subject,
      html: html
    })

    if (error) throw error
    return { success: true, data }
  } catch (error: any) {
    console.error('Email Send Error:', error)
    return { success: false, error: error.message }
  }
}
