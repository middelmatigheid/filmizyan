from googleapiclient.discovery import build
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import base64
import pickle


import os
import os.path
from dotenv import load_dotenv
import logging

import re
from jinja2 import Environment, FileSystemLoader


"""
This file contains functions responsible for creating a service 
for sending emails, creating and sending the letters themselves, 
everything works through Google services using the OAuth API for Gmail services
"""


env = Environment(loader=FileSystemLoader("templates"))
load_dotenv()

SCOPES=["https://www.googleapis.com/auth/gmail.send"]
CREDS_FILE=os.getenv("CREDS_FILE")
TOKEN_FILE=os.getenv("TOKEN_FILE")
EMAIL=os.getenv("EMAIL")

# Configuring logging
# logging.basicConfig(level=logging.ERROR, filename="/logs/logging.log", filemode="a", format="%(asctime)s - %(levelname)s - %(filename)s - %(message)s", datefmt="%Y-%m-%d %H:%M:%S", encoding="utf-8")
logging.basicConfig(level=logging.ERROR, filename="../logs/logging.log", filemode="a", format="%(asctime)s - %(levelname)s - %(filename)s - %(message)s", datefmt="%Y-%m-%d %H:%M:%S", encoding="utf-8")
logging.getLogger("sqlalchemy").setLevel(logging.ERROR)
logging.getLogger("sqlalchemy.engine").setLevel(logging.ERROR)


async def check_email(email: str) -> bool:
    
    """
    Checks whether the string entered by the user is an email address or not
    """
    
    email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return re.match(email_pattern, email) is not None


async def get_gmail_service():
    
    """
    Creates a mail service for sending letters to users
    """

    creds = None 
    if os.path.exists(TOKEN_FILE):
        with open(TOKEN_FILE, "rb") as token:
            creds = pickle.load(token)

    # If there is no token or it is invalid, a new one is created
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(CREDS_FILE, SCOPES)
            creds = flow.run_local_server(port=0)
        
        # Save the token for the next run
        with open(TOKEN_FILE, "wb") as token:
            pickle.dump(creds, token)

    return build("gmail", "v1", credentials=creds)


async def create_html_message(sender: str, to: str, subject: str, template_name: str, **context) -> dict:

    """
    Function for creating a message in html format
    """
    
    template = env.get_template(template_name)
    html_content = template.render(**context)

    message = MIMEMultipart("alternative")
    message["To"] = to
    message["From"] = f"Filmizyan <{sender}>"
    message["Subject"] = subject

    alternative = MIMEMultipart("alternative")
    message.attach(alternative)
    message.attach(MIMEText(html_content, "html", "utf-8"))

    raw = base64.urlsafe_b64encode(message.as_bytes()).decode("utf-8")

    return {"raw": raw}


async def send_email(reciepent: str, title: str, template_name: str, **context) -> bool:

    """
    Function to send a message to a user
    """

    try:
        if not await check_email(reciepent):
            return False
        service = await get_gmail_service()
        message = await create_html_message(
            sender=EMAIL,
            to=reciepent,
            subject=title,
            template_name=template_name,
            **context)
        
        service.users().messages().send(userId="me", body=message).execute()
        return True
    except Exception as error:
        logging.error(f"An error sending email: {error}")
        return False


async def registration_email(user_email: str, verification_token: str) -> bool:

    """
    A separate function for sending a letter to the user 
    about the completion of registration
    """

    return await send_email(
        reciepent=user_email,
        title="Добро пожаловать на Filmizyan!",
        template_name="email_registration.html",
        verification_url=f"http://127.0.0.1:8000/verify/{verification_token}",
        hours_active=24,
        account=str(user_email)[::-1])


async def password_recovery_email(user_email: str, recovery_token: str) -> bool:

    """
    Separate function to send email to user to reset password
    """

    return await send_email(
        reciepent=user_email,
        title="Смена пароля",
        template_name="email_password_recovery.html",
        recovery_url=f"http://127.0.0.1:8000/recovery/{recovery_token}",
        hours_active=1,
        account=str(user_email)[::-1])
