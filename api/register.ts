/** Retired: the supported course-registration handler is scripts/google-apps-script/register.gs.
 * Keep a tombstone so old callers cannot write to Sheets or bypass CAPTCHA.
 */
export default async function handler(_req: unknown, res: any) {
  res.setHeader('Cache-Control', 'no-store');
  return res.status(410).json({ error: 'Registration endpoint retired' });
}
