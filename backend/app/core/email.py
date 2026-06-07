import smtplib
import ssl
from datetime import date
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import settings


def _resend_send(to_email: str, subject: str, body_html: str) -> None:
    import httpx
    response = httpx.post(
        "https://api.resend.com/emails",
        headers={
            "Authorization": f"Bearer {settings.RESEND_API_KEY}",
            "Content-Type": "application/json",
        },
        json={
            "from": settings.RESEND_FROM,
            "to": [to_email],
            "subject": subject,
            "html": body_html,
        },
        timeout=15,
    )
    if response.status_code >= 400:
        raise Exception(f"Resend error {response.status_code}: {response.text}")


def _smtp_send(to_email: str, subject: str, body_html: str) -> None:
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        print(f"\n{'='*50}\n  EMAIL TO: {to_email}\n  SUBJECT: {subject}\n{'='*50}\n")
        return
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = settings.SMTP_FROM or settings.SMTP_USER
    msg["To"]      = to_email
    msg.attach(MIMEText(body_html, "html"))
    context = ssl.create_default_context()
    with smtplib.SMTP(settings.SMTP_HOST, int(settings.SMTP_PORT)) as server:
        server.ehlo(); server.starttls(context=context)
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(msg["From"], to_email, msg.as_string())


def _send(to_email: str, subject: str, body_html: str) -> None:
    if settings.RESEND_API_KEY:
        _resend_send(to_email, subject, body_html)
    else:
        _smtp_send(to_email, subject, body_html)


def send_code_email(to_email: str, code: str, type: str) -> None:
    subject = "Код подтверждения — PawHotel" if type == "register" else "Сброс пароля — PawHotel"
    action  = "завершения регистрации" if type == "register" else "сброса пароля"
    caveat  = "Если вы не регистрировались" if type == "register" else "Если вы не запрашивали сброс"

    body_html = f"""
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#FAF7F2;border-radius:12px;">
      <h2 style="color:#7A5230;margin-bottom:8px;">PawHotel</h2>
      <h3 style="margin-bottom:24px;">{subject}</h3>
      <p>Для {action} введите код:</p>
      <div style="font-size:36px;font-weight:700;letter-spacing:12px;color:#7A5230;background:#fff;border:2px solid #DDD0C2;border-radius:8px;padding:16px 24px;text-align:center;margin:24px 0;">{code}</div>
      <p style="color:#6B5444;font-size:0.88rem;">Код действителен 10 минут. {caveat} — просто проигнорируйте это письмо.</p>
    </div>
    """
    try:
        _send(to_email, subject, body_html)
    except Exception as e:
        print(f"Email send error: {e}")
        raise


def send_daily_report_email(to_email: str, owner, pet_entries: list, report_date: date) -> None:
    date_str = report_date.strftime("%d.%m.%Y")
    subject  = f"Отчёт о ваших питомцах за {date_str} — PawHotel"

    pets_html = ""
    for pet, notes in pet_entries:
        notes_rows = "".join(
            f"""<tr>
              <td style="padding:6px 8px;color:#6B5444;font-size:0.8rem;white-space:nowrap;">
                {note.created_at.strftime("%H:%M")}
              </td>
              <td style="padding:6px 8px;font-size:0.88rem;">{note.content}</td>
            </tr>"""
            for note in notes
        )
        pets_html += f"""
        <div style="margin-bottom:24px;">
          <h3 style="color:#7A5230;border-bottom:1px solid #DDD0C2;padding-bottom:8px;margin-bottom:12px;">{pet.name}</h3>
          <table style="width:100%;border-collapse:collapse;">
            <tbody>{notes_rows}</tbody>
          </table>
        </div>
        """

    body_html = f"""
    <div style="font-family:sans-serif;max-width:580px;margin:0 auto;padding:32px;background:#FAF7F2;border-radius:12px;">
      <h2 style="color:#7A5230;margin-bottom:4px;">PawHotel</h2>
      <p style="color:#6B5444;margin-bottom:24px;">Ежедневный отчёт за {date_str}</p>
      <p>Здравствуйте, {owner.first_name}! Вот что происходило с вашими питомцами сегодня:</p>
      <div style="background:#fff;border-radius:8px;padding:20px;margin:20px 0;border:1px solid #DDD0C2;">
        {pets_html}
      </div>
      <p style="color:#6B5444;font-size:0.82rem;">Это автоматическое письмо от системы наблюдения PawHotel.</p>
    </div>
    """
    _send(to_email, subject, body_html)
