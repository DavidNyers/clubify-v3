import { SignJWT, jwtVerify } from 'jose'
import QRCode from 'qrcode'

const secret = new TextEncoder().encode(
  process.env.TICKET_SECRET ?? 'clubify-fallback-secret-min-32-characters-long'
)

export async function generateTicketPayload(ticketId: string, eventId: string): Promise<string> {
  return new SignJWT({ ticketId, eventId, iss: 'clubify', iat: Math.floor(Date.now() / 1000) })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('48h')
    .sign(secret)
}

export async function verifyTicketPayload(token: string): Promise<{ ticketId: string; eventId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secret, { issuer: 'clubify' })
    return {
      ticketId: payload.ticketId as string,
      eventId: payload.eventId as string,
    }
  } catch {
    return null
  }
}

export async function generateQRCodeDataURL(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: 'H',
    margin: 2,
    color: { dark: '#000000', light: '#FFFFFF' },
    width: 300,
  })
}

export async function generateQRCodeSVGString(payload: string): Promise<string> {
  return QRCode.toString(payload, { type: 'svg', errorCorrectionLevel: 'H' })
}
