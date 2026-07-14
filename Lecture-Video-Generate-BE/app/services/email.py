import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from ..core.config import settings


def send_email(to_email: str, subject: str, html_content: str) -> bool:
    """
    Send an email using SMTP.
    
    Args:
        to_email: Recipient email address
        subject: Email subject
        html_content: HTML content of the email
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Create message
        message = MIMEMultipart()
        message["From"] = f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL}>"
        message["To"] = to_email
        message["Subject"] = subject
        
        # Attach HTML content
        message.attach(MIMEText(html_content, "html"))
        
        # Connect to SMTP server
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(message)
            
        return True
    except Exception as e:
        print(f"Lỗi khi gửi email: {e}")
        return False


def send_verification_email(to_email: str, username: str, code: str) -> bool:
    """
    Send an email verification code.
    """
    subject = "Xác thực tài khoản LecVidGen"
    html_content = f"""
    <html>
    <body>
        <h2>Xác thực tài khoản LecVidGen</h2>
        <p>Xin chào {username},</p>
        <p>Cảm ơn bạn đã đăng ký tài khoản trên hệ thống của chúng tôi.</p>
        <p>Mã xác thực của bạn là: <strong>{code}</strong></p>
        <p>Mã xác thực này sẽ hết hạn sau 30 phút.</p>
        <p>Trân trọng,<br/>Đội ngũ LecVidGen</p>
    </body>
    </html>
    """
    return send_email(to_email, subject, html_content)


def send_password_reset_email(to_email: str, username: str, code: str) -> bool:
    """
    Send a password reset code.
    """
    subject = "Đặt lại mật khẩu LecVidGen"
    html_content = f"""
    <html>
    <body>
        <h2>Đặt lại mật khẩu tài khoản LecVidGen</h2>
        <p>Xin chào {username},</p>
        <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
        <p>Mã xác thực của bạn là: <strong>{code}</strong></p>
        <p>Mã này sẽ hết hạn sau 30 phút.</p>
        <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
        <p>Trân trọng,<br/>Đội ngũ LecVidGen</p>
    </body>
    </html>
    """
    return send_email(to_email, subject, html_content)
