import jwt
import random
import json
import os
import dotenv
from datetime import datetime, timedelta
from django.http import JsonResponse
from pymongo import MongoClient
from django.contrib.auth.hashers import make_password, check_password
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from bson import ObjectId
from django.core.mail import EmailMessage
from twilio.rest import Client
import requests
from django.conf import settings
import boto3
import re
import json
import re
from django.utils import timezone
from dateutil import parser as date_parser

# Load environment variables from a .env file
dotenv.load_dotenv()

# ======================= CONFIGURATION =======================
# JWT Configuration
JWT_SECRET = "secret"
JWT_ALGORITHM = "HS256"

# MongoDB Configuration
mongo_url = "mongodb+srv://haaka:HAAKA%40123@haaka.rd0vpfn.mongodb.net/"
client = MongoClient(mongo_url)
db = client["BT-Enterprise"]
user_collection = db["users"]
admin_collection = db['admin']
movies_collection = db['movies']


# ======================= UTILITY FUNCTIONS =======================
def generate_tokens(user_id, name, role):
    """Generates JWT tokens for authentication."""
    access_payload = {
        "id": str(user_id),
        "name": name,
        "role": role,  # Store role in JWT
        "exp": (datetime.now() + timedelta(hours=10)).timestamp(),
        "iat": datetime.now().timestamp(),
    }
    return {"jwt": jwt.encode(access_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)}


def find_user_by_email(email):
    """Fetch a user from the database using email."""
    return user_collection.find_one({"email": email})


def update_user_last_login(email):
    """Update last login timestamp for a user."""
    user_collection.update_one({"email": email}, {"$set": {"last_login": datetime.now()}})


# === OTP & Email Functions ===
def generate_otp():
    """Generate a random 6-digit OTP."""
    return str(random.randint(100000, 999999))


def send_otp_email(email, otp, user_name):
    """Send OTP via email to the user."""
    try:
        subject = "Password Reset OTP - BlackTicket"
        html_message = f"""
        <html>
            <body style="font-family: Arial, sans-serif; background-color: #1a1a1a; color: #fff; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #222; padding: 30px; border-radius: 10px; border-left: 5px solid #FBBB00;">
                    <h2 style="color: #FBBB00; margin-bottom: 20px;">BlackTicket Password Reset</h2>
                    <p style="font-size: 16px; margin-bottom: 10px;">Hi <strong>{user_name}</strong>,</p>
                    <p style="font-size: 14px; color: #ccc; margin-bottom: 20px;">
                        We received a request to reset your password. Use the OTP below to proceed with resetting your password.
                    </p>
                    <div style="background-color: #333; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
                        <p style="font-size: 12px; color: #999; margin: 0 0 10px 0;">Your OTP Code:</p>
                        <p style="font-size: 32px; font-weight: bold; color: #FBBB00; letter-spacing: 5px; margin: 0;">
                            {otp}
                        </p>
                    </div>
                    <p style="font-size: 12px; color: #999;">This OTP will expire in 10 minutes.</p>
                    <p style="font-size: 12px; color: #999; margin-bottom: 20px;">
                        If you didn't request a password reset, please ignore this email.
                    </p>
                    <hr style="border: none; border-top: 1px solid #444; margin: 30px 0;">
                    <p style="font-size: 11px; color: #666; text-align: center; margin: 0;">
                        © 2024 BlackTicket Entertainment. All rights reserved.
                    </p>
                </div>
            </body>
        </html>
        """
        
        email_msg = EmailMessage(
            subject=subject,
            body=html_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[email],
        )
        email_msg.content_subtype = "html"
        email_msg.send(fail_silently=False)
        return True
    except Exception as e:
        print(f"Email sending failed: {str(e)}")
        return False


# === Validators ===
NAME_RE = re.compile(r"^[A-Za-z.\-\s]{2,}$")     # letters, spaces, dot, hyphen
PHONE_RE = re.compile(r"^\d{7,15}$")             # digits only, 7–15
EMAIL_RE = re.compile(r"[^@]+@[^@]+\.[^@]+")     # simple email check

#================================USER====================================================================================================

@csrf_exempt
def user_signup(request):
    """Registers a new user with validation and password hashing."""
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            name, email, phone, password, confirm_password = (
                data.get("name"), data.get("email"),
                data.get("phone_number"), data.get("password"), data.get("confirm_password")
            )

            if password != confirm_password:
                return JsonResponse({"error": "Passwords do not match"}, status=400)
            
            if find_user_by_email(email):
                return JsonResponse({"error": "User with this email already exists"}, status=400)
            
            user_data = {
                "name": name,
                "email": email,
                "phone_number": phone,
                "password": make_password(password),
                "created_at": datetime.now(),
                "last_login": None,
            }
            user_collection.insert_one(user_data)
            return JsonResponse({"message": "User registered successfully"}, status=201)

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)

@csrf_exempt
def user_login(request):
    """
    Combined login endpoint for both users and admins.
    
    Expects JSON payload with 'email' and 'password'.
    Returns a JWT token with role included on successful authentication.
    Automatically detects whether account is user or admin.
    """
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    try:
        data = json.loads(request.body or "{}")
        email = data.get("email", "").strip()
        password = data.get("password", "")

        if not email or not password:
            return JsonResponse({"error": "Email and password are required"}, status=400)

        # Try to find user first
        user = user_collection.find_one({"email": email})
        
        if user:
            # User account found
            if check_password(password, user["password"]):
                user_collection.update_one({"email": email}, {"$set": {"last_login": datetime.now()}})
                tokens = generate_tokens(user["_id"], user.get("name", ""), "user")
                return JsonResponse({"message": "Login successful", "token": tokens}, status=200)
            else:
                return JsonResponse({"error": "Invalid password"}, status=401)
        
        # If no user found, try admin
        admin = admin_collection.find_one({"email": email})
        
        if admin:
            # Admin account found
            if admin.get("status") == "Inactive":
                return JsonResponse({"error": "Account is inactive. Contact superadmin."}, status=403)
            
            if check_password(password, admin["password"]):
                admin_collection.update_one({"email": email}, {"$set": {"last_login": datetime.now()}})
                tokens = generate_tokens(admin["_id"], admin.get("name", ""), "admin")
                return JsonResponse({"message": "Login successful", "token": tokens}, status=200)
            else:
                return JsonResponse({"error": "Invalid password"}, status=401)
        
        # Email not found in either collection
        return JsonResponse({"error": "Email not found"}, status=404)

    except Exception as e:
        print(f"Login error: {str(e)}")
        return JsonResponse({"error": "An unexpected error occurred. Please try again."}, status=500)

@csrf_exempt
def get_user_profile(request):
    """Returns profile for the authenticated user/admin using JWT in cookies."""
    if request.method != "GET":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    # Get JWT from cookies
    token = request.COOKIES.get("jwt")
    if not token:
        return JsonResponse({"error": "Authorization cookie missing"}, status=401)

    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("id")
        role = payload.get("role", "user")

        if not user_id:
            return JsonResponse({"error": "Invalid token payload"}, status=401)

        collection = admin_collection if role == "admin" else user_collection
        user = collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            return JsonResponse({"error": "User not found"}, status=404)

        profile = {
            "id": str(user.get("_id")),
            "name": user.get("name"),
            "email": user.get("email"),
            "phone_number": user.get("phone_number"),
            "role": user.get("role", role),
            "created_at": user.get("created_at").isoformat() if user.get("created_at") else None,
            "last_login": user.get("last_login").isoformat() if user.get("last_login") else None,
        }
        # include admin-specific fields if present
        if role == "admin":
            profile["status"] = user.get("status")

        return JsonResponse({"profile": profile}, status=200)

    except jwt.ExpiredSignatureError:
        return JsonResponse({"error": "Token has expired"}, status=401)
    except jwt.InvalidTokenError:
        return JsonResponse({"error": "Invalid token"}, status=401)
    except Exception:
        return JsonResponse({"error": "An unexpected error occurred."}, status=500)

#=======================================ADMIN==========================================================================================

@csrf_exempt
def admin_signup(request):
    """
    Registers a new admin user.

    Expects JSON payload with keys:
      - first_name
      - last_name
      - email
      - phone_number
      - password
      - confirm_password

    Returns a JSON response indicating success or an error.
    """
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    try:
        data = json.loads(request.body or "{}")
        name = data.get("name", "").strip()
        email = data.get("email", "").strip()
        phone = data.get("phone_number", "").strip()
        password = data.get("password", "")
        confirm_password = data.get("confirm_password", "")

        # Input validation and email format check
        if not email or not re.match(r"[^@]+@[^@]+\.[^@]+", email):
            return JsonResponse({"error": "Valid email is required"}, status=400)
        if password != confirm_password:
            return JsonResponse({"error": "Passwords do not match"}, status=400)
        if admin_collection.find_one({"email": email}):
            return JsonResponse({"error": "Admin with this email already exists"}, status=400)

        hashed_password = make_password(password)
        admin_data = {
            "name": name,
            "email": email,
            "phone_number": phone,
            "password": hashed_password,
            "role": "admin",
            "status": "Active",
            "created_at": datetime.now(),
            "last_login": None,
        }

        admin_collection.insert_one(admin_data)
        return JsonResponse({"message": "Admin registered successfully"}, status=201)

    except Exception:
        # Log the exception internally for debugging purposes
        return JsonResponse({"error": "An unexpected error occurred. Please try again."}, status=500)

#================================ PASSWORD RESET ==========================================================================================

@csrf_exempt
def forgot_password(request):
    """
    Initiates forgot password flow.
    
    Expects JSON payload with 'email'.
    Generates OTP, stores it in the database, and sends via email.
    """
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    try:
        data = json.loads(request.body or "{}")
        email = data.get("email", "").strip()

        if not email:
            return JsonResponse({"error": "Email is required"}, status=400)

        if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
            return JsonResponse({"error": "Invalid email format"}, status=400)

        # Check if user exists (both regular users and admins)
        user = user_collection.find_one({"email": email})
        if not user:
            user = admin_collection.find_one({"email": email})
        
        if not user:
            # Don't reveal if email exists for security reasons
            return JsonResponse({"message": "If email exists, OTP will be sent shortly"}, status=200)

        # Generate OTP and expiry time (10 minutes)
        otp = generate_otp()
        otp_expiry = datetime.now() + timedelta(minutes=10)

        # Update user with OTP and expiry
        collection = admin_collection if user.get("role") == "admin" else user_collection
        collection.update_one(
            {"email": email},
            {"$set": {
                "otp": otp,
                "otp_expiry": otp_expiry,
                "otp_attempts": 0
            }}
        )

        # Send OTP via email
        user_name = user.get("name", "User")
        if send_otp_email(email, otp, user_name):
            return JsonResponse({
                "message": "OTP sent successfully",
                "email": email
            }, status=200)
        else:
            return JsonResponse({"error": "Failed to send OTP. Please try again."}, status=500)

    except Exception as e:
        print(f"Forgot password error: {str(e)}")
        return JsonResponse({"error": "An unexpected error occurred."}, status=500)


@csrf_exempt
def verify_otp(request):
    """
    Verifies the OTP provided by the user.
    
    Expects JSON payload with 'email' and 'otp'.
    Returns success if OTP is valid and not expired.
    """
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    try:
        data = json.loads(request.body or "{}")
        email = data.get("email", "").strip()
        otp = data.get("otp", "").strip()

        if not email or not otp:
            return JsonResponse({"error": "Email and OTP are required"}, status=400)

        # Find user
        user = user_collection.find_one({"email": email})
        if not user:
            user = admin_collection.find_one({"email": email})

        if not user:
            return JsonResponse({"error": "User not found"}, status=404)

        # Check if OTP exists and is not expired
        stored_otp = user.get("otp")
        otp_expiry = user.get("otp_expiry")

        if not stored_otp:
            return JsonResponse({"error": "OTP not requested. Please use forgot password."}, status=400)

        if datetime.now() > otp_expiry:
            return JsonResponse({"error": "OTP has expired. Please request a new OTP."}, status=400)

        if stored_otp != otp:
            # Increment attempts
            collection = admin_collection if user.get("role") == "admin" else user_collection
            attempts = user.get("otp_attempts", 0) + 1
            collection.update_one(
                {"email": email},
                {"$set": {"otp_attempts": attempts}}
            )
            
            if attempts >= 3:
                # Clear OTP after 3 failed attempts
                collection.update_one(
                    {"email": email},
                    {"$unset": {"otp": "", "otp_expiry": "", "otp_attempts": ""}}
                )
                return JsonResponse({"error": "Too many failed attempts. Please request a new OTP."}, status=400)
            
            return JsonResponse({"error": f"Invalid OTP. Attempts remaining: {3 - attempts}"}, status=400)

        # OTP is valid - clear OTP fields and allow password reset
        collection = admin_collection if user.get("role") == "admin" else user_collection
        collection.update_one(
            {"email": email},
            {"$unset": {"otp": "", "otp_expiry": "", "otp_attempts": ""}}
        )

        return JsonResponse({
            "message": "OTP verified successfully",
            "email": email
        }, status=200)

    except Exception as e:
        print(f"OTP verification error: {str(e)}")
        return JsonResponse({"error": "An unexpected error occurred."}, status=500)


@csrf_exempt
def reset_password(request):
    """
    Resets user password after OTP verification.
    
    Expects JSON payload with 'email', 'password', and 'confirm_password'.
    Password must have been validated on frontend before sending.
    """
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    try:
        data = json.loads(request.body or "{}")
        email = data.get("email", "").strip()
        password = data.get("password", "")
        confirm_password = data.get("confirm_password", "")

        if not email or not password or not confirm_password:
            return JsonResponse({"error": "Email and passwords are required"}, status=400)

        if password != confirm_password:
            return JsonResponse({"error": "Passwords do not match"}, status=400)

        # Find user
        user = user_collection.find_one({"email": email})
        is_admin = False
        if not user:
            user = admin_collection.find_one({"email": email})
            is_admin = True

        if not user:
            return JsonResponse({"error": "User not found"}, status=404)

        # Hash the new password
        hashed_password = make_password(password)

        # Update password
        collection = admin_collection if is_admin else user_collection
        collection.update_one(
            {"email": email},
            {"$set": {"password": hashed_password}}
        )

        return JsonResponse({
            "message": "Password reset successfully",
            "email": email
        }, status=200)

    except Exception as e:
        print(f"Reset password error: {str(e)}")
        return JsonResponse({"error": "An unexpected error occurred."}, status=500)


# ======================= GOOGLE OAUTH =======================
@csrf_exempt
@api_view(["POST"])
@permission_classes([AllowAny])
def google_auth(request):
    """
    Google OAuth authentication endpoint.
    
    Expects JSON payload with 'token' (Google ID token).
    Logic:
    - If user exists: Log them in and return JWT
    - If user doesn't exist: Auto-create account with Google data and log them in
    - Only users can use Google auth (admins must use regular login)
    """
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    try:
        data = json.loads(request.body or "{}")
        google_token = data.get("token", "")

        if not google_token:
            return JsonResponse({"error": "Google token is required"}, status=400)

        # Verify Google token
        url = f"https://oauth2.googleapis.com/tokeninfo?id_token={google_token}"
        response = requests.get(url)
        
        if response.status_code != 200:
            return JsonResponse({"error": "Invalid Google token"}, status=401)

        google_data = response.json()
        email = google_data.get("email", "")
        name = google_data.get("name", "")
        google_id = google_data.get("sub", "")

        if not email:
            return JsonResponse({"error": "Email not found in Google account"}, status=400)

        # Check if user already exists
        user = user_collection.find_one({"email": email})
        
        if user:
            # User exists - log them in
            # Update google_id if not already set
            if "google_id" not in user:
                user_collection.update_one({"email": email}, {"$set": {"google_id": google_id, "last_login": datetime.now()}})
            else:
                user_collection.update_one({"email": email}, {"$set": {"last_login": datetime.now()}})
            
            tokens = generate_tokens(user["_id"], user.get("name", ""), "user")
            return JsonResponse({
                "message": "Login successful",
                "token": tokens,
                "account_status": "exists"
            }, status=200)
        else:
            # User doesn't exist - auto-create account with Google data
            user_data = {
                "name": name,
                "email": email,
                "google_id": google_id,
                "phone_number": "",  # Optional, can be added later
                "password": "",  # No password for Google auth
                "is_google_auth": True,
                "created_at": datetime.now(),
                "last_login": datetime.now(),
                "status": "Active"
            }

            result = user_collection.insert_one(user_data)
            user_id = result.inserted_id

            # Generate JWT tokens
            tokens = generate_tokens(user_id, name, "user")

            return JsonResponse({
                "message": "Account created and login successful",
                "token": tokens,
                "account_status": "created",
                "user": {
                    "id": str(user_id),
                    "name": name,
                    "email": email
                }
            }, status=201)

    except requests.exceptions.RequestException as e:
        print(f"Google verification error: {str(e)}")
        return JsonResponse({"error": "Failed to verify Google token"}, status=500)
    except Exception as e:
        print(f"Google auth error: {str(e)}")
        return JsonResponse({"error": "An unexpected error occurred."}, status=500)