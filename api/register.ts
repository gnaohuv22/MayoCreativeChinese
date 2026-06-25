import { JWT } from 'google-auth-library';

/**
 * Serverless function for Vercel / Netlify to proxy Google Sheets API requests safely.
 * This runs server-side, so environment variables containing private credentials are kept secure.
 */
export default async function handler(req: any, res: any) {
  // Set CORS headers for local development and client integration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Parse body fields
  let fullName = req.body.fullName;
  let birthYear = req.body.birthYear;
  let phoneNumber = req.body.phoneNumber;
  let email = req.body.email;

  // Fallback for urlencoded data
  if (typeof req.body === 'string') {
    try {
      const params = new URLSearchParams(req.body);
      fullName = params.get('fullName') || fullName;
      birthYear = params.get('birthYear') || birthYear;
      phoneNumber = params.get('phoneNumber') || phoneNumber;
      email = params.get('email') || email;
    } catch (e) {}
  }

  if (!fullName || !birthYear || !phoneNumber || !email) {
    return res.status(400).json({ error: 'Missing required fields: fullName, birthYear, phoneNumber, email' });
  }

  try {
    const clientEmail = process.env['GOOGLE_SERVICE_ACCOUNT_EMAIL'];
    const privateKey = process.env['GOOGLE_PRIVATE_KEY']?.replace(/\\n/g, '\n');
    const sheetId = process.env['GOOGLE_SHEET_ID'] || '1lw0sjyzDUvu7GamJ2dEXLm_OD70iGMM1MXbHmvqDg0k';

    if (!clientEmail || !privateKey) {
      return res.status(500).json({
        error: 'Google Service Account credentials (GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY) are not set in the environment.'
      });
    }

    // Authenticate with Google API Service Account
    const auth = new JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const tokenResponse = await auth.getAccessToken();
    const accessToken = tokenResponse.token;

    if (!accessToken) {
      throw new Error('Failed to retrieve access token from Google Auth.');
    }

    // Append row via Direct Sheets REST API (Sheet1!A:E matches the schema)
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sheet1!A:E:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [[
            new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }), // Vietnam local timestamp
            fullName,
            birthYear,
            phoneNumber,
            email
          ]],
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Google Sheets API responded with status ${response.status}: ${errText}`);
    }

    return res.status(200).json({
      status: 'success',
      message: 'Registration recorded successfully'
    });
  } catch (err: any) {
    console.error('Serverless Registration API Error:', err);
    return res.status(500).json({
      error: err.message || 'Internal Server Error'
    });
  }
}
