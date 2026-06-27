import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://tm31-ninjacd-recipe-book.vercel.app'

export async function sendInviteCode(to: string, code: string, expiresAt: string): Promise<void> {
  const expiresDate = new Date(expiresAt)

  const expiresDay = expiresDate.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Europe/Madrid',
  })
  const expiresTime = expiresDate.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Madrid',
  })
  const expiresLabel = `${expiresDay} a las ${expiresTime}`

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: '🍦 Te invito a mi recetario de helados Ninja CREAMi',
    html: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:Inter,'Helvetica Neue',Arial,sans-serif;color:#e2e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:16px;border:1px solid #334155;overflow:hidden;max-width:100%;">

        <!-- Cabecera -->
        <tr>
          <td style="background:linear-gradient(135deg,#0ea5e9 0%,#6366f1 100%);padding:36px 40px;text-align:center;">
            <div style="font-size:48px;margin-bottom:12px;">🍦</div>
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">
              Recetario Ninja CREAMi Deluxe
            </h1>
          </td>
        </tr>

        <!-- Cuerpo -->
        <tr>
          <td style="padding:40px 40px 32px;">

            <p style="margin:0 0 20px;color:#e2e8f0;font-size:17px;line-height:1.7;">
              ¡Hola! 👋
            </p>
            <p style="margin:0 0 20px;color:#cbd5e1;font-size:16px;line-height:1.7;">
              Te he reservado un sitio en mi recetario personal de helados con la <strong style="color:#e2e8f0;">Ninja CREAMi Deluxe</strong> — recetas propias, fotos, pasos con Thermomix y mucho más.
            </p>
            <p style="margin:0 0 28px;color:#cbd5e1;font-size:16px;line-height:1.7;">
              Para entrar solo necesitas este código:
            </p>

            <!-- Código destacado -->
            <div style="background:#0f172a;border:2px solid #38bdf8;border-radius:12px;padding:28px 20px;text-align:center;margin-bottom:12px;">
              <div style="color:#94a3b8;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.1em;margin-bottom:12px;">
                Tu código de invitación
              </div>
              <span style="font-family:'JetBrains Mono','Courier New',monospace;font-size:36px;font-weight:700;letter-spacing:.25em;color:#38bdf8;">
                ${code}
              </span>
            </div>

            <!-- Caducidad -->
            <p style="margin:0 0 32px;color:#64748b;font-size:13px;text-align:center;">
              ⏱ Válido hasta el <strong style="color:#94a3b8;">${expiresLabel}</strong> · un solo uso
            </p>

            <!-- Instrucción -->
            <div style="background:#1e3a4a;border-left:4px solid #0ea5e9;border-radius:4px;padding:16px 20px;margin-bottom:32px;">
              <p style="margin:0;color:#93c5fd;font-size:14px;line-height:1.6;">
                <strong>¿Cómo registrarte?</strong><br>
                Entra en el recetario, haz clic en <em>Registrarse</em> e introduce este código cuando te lo pidan. Elige tu nick y contraseña, ¡y listo!
              </p>
            </div>

            <!-- Botón -->
            <div style="text-align:center;margin-bottom:36px;">
              <a href="${APP_URL}/register"
                 style="display:inline-block;background:linear-gradient(135deg,#0ea5e9,#6366f1);color:#ffffff;text-decoration:none;padding:15px 36px;border-radius:10px;font-weight:700;font-size:15px;letter-spacing:.2px;">
                Ir al recetario →
              </a>
            </div>

            <!-- Pie -->
            <hr style="border:none;border-top:1px solid #334155;margin:0 0 24px;">
            <p style="margin:0;color:#475569;font-size:12px;line-height:1.6;text-align:center;">
              Si no esperabas esta invitación, ignora este mensaje tranquilamente.<br>
              El código caducará solo y no se puede reutilizar.
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
