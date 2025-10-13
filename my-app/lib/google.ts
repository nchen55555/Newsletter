import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'

export function makeOAuth2(): OAuth2Client {
  return new google.auth.OAuth2({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    redirectUri: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000', // fallback for server-side usage
  })
}

export async function getCalendarClient(refreshToken: string) {
  const oauth2 = makeOAuth2()
  oauth2.setCredentials({ refresh_token: refreshToken }) // auto-mints access tokens
  return google.calendar({ version: 'v3', auth: oauth2 })
}
