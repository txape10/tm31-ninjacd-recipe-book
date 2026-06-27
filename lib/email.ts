import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://tm31-ninjacd-recipe-book.vercel.app'

export async function sendInviteCode(to: string, code: string, expiresAt: string): Promise<void> {
  const expiresLabel = new Date(expiresAt).toLocaleString('es-ES', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'Europe/Madrid',
  })

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Tu código de invitación — Recetario Ninja CREAMi Deluxe',
    html: `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:Inter,system-ui,sans-serif;color:#e2e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:12px;border:1px solid #334155;overflow:hidden;max-width:100%;">
        <tr>
          <td style="background:linear-gradient(135deg,#0ea5e9,#6366f1);padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;">🍦 Recetario Ninja CREAMi</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 24px;color:#94a3b8;font-size:16px;line-height:1.6;">
              Alguien te ha invitado a unirte al recetario personal de helados Ninja CREAMi Deluxe.
            </p>
            <p style="margin:0 0 12px;color:#cbd5e1;font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;">
              Tu código de invitación
            </p>
            <div style="background:#0f172a;border:1px solid #334155;border-radius:8px;padding:20px;text-align:center;margin-bottom:24px;">
              <span style="font-family:'JetBrains Mono',monospace,monospace;font-size:32px;font-weight:700;letter-spacing:.2em;color:#38bdf8;">${code}</span>
            </div>
            <p style="margin:0 0 32px;color:#64748b;font-size:13px;">
              Válido hasta: <strong style="color:#94a3b8;">${expiresLabel}</strong> (un solo uso)
            </p>
            <a href="${APP_URL}/register?code=${code}"
               style="display:inline-block;background:linear-gradient(135deg,#0ea5e9,#6366f1);color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:15px;">
              Registrarme ahora →
            </a>
            <p style="margin:32px 0 0;color:#475569;font-size:12px;line-height:1.5;">
              Si no esperabas esta invitación, puedes ignorar este mensaje.<br>
              El código expira automáticamente y es de un solo uso.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
    `.trim(),
  })
}
