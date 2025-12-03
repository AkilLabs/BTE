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
from minio import Minio
from minio.error import S3Error
import uuid

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
movie_collection = db['movies']

# MinIO Configuration
MINIO_ENDPOINT = os.getenv('MINIO_ENDPOINT', 'localhost:9000')
MINIO_ACCESS_KEY = os.getenv('MINIO_ACCESS_KEY', 'minioadmin')
MINIO_SECRET_KEY = os.getenv('MINIO_SECRET_KEY', 'minioadmin')
MINIO_BUCKET_NAME = os.getenv('MINIO_BUCKET_NAME', 'blacktickets-entertainment')
MINIO_SECURE = os.getenv('MINIO_SECURE', 'False').lower() == 'true'

# Initialize MinIO client
minio_client = Minio(
    MINIO_ENDPOINT,
    access_key=MINIO_ACCESS_KEY,
    secret_key=MINIO_SECRET_KEY,
    secure=MINIO_SECURE
)

# Create bucket if it doesn't exist
try:
    if not minio_client.bucket_exists(MINIO_BUCKET_NAME):
        minio_client.make_bucket(MINIO_BUCKET_NAME)
        # Set bucket policy to allow public read access
        policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {"AWS": ["*"]},
                    "Action": ["s3:GetObject"],
                    "Resource": [f"arn:aws:s3:::{MINIO_BUCKET_NAME}/*"]
                }
            ]
        }
        minio_client.set_bucket_policy(MINIO_BUCKET_NAME, json.dumps(policy))
except Exception as e:
    print(f"MinIO setup error: {str(e)}")


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


def _extract_jwt_from_request(request):
    """Extract JWT token from Authorization header (Bearer ...) or cookie 'jwt'."""
    # Try Authorization header first
    auth_header = None
    try:
        auth_header = request.META.get('HTTP_AUTHORIZATION') or request.headers.get('Authorization')
    except Exception:
        auth_header = request.META.get('HTTP_AUTHORIZATION')

    if auth_header:
        parts = auth_header.split()
        if len(parts) == 2 and parts[0].lower() == 'bearer':
            return parts[1]

    # Fallback to cookie
    token = request.COOKIES.get('jwt')
    return token


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


# ======================= MOVIE MANAGEMENT =======================

def upload_image_to_minio(image_file, movie_name, image_type='poster'):
    """
    Upload image to MinIO bucket and return the URL.
    
    Args:
        image_file: Django UploadedFile object
        movie_name: Name of the movie (used in filename)
        image_type: Type of image ('poster' or 'banner')
    
    Returns:
        str: URL of the uploaded image or None if failed
    """
    try:
        # Sanitize movie name for filename (remove special characters, replace spaces with underscores)
        safe_movie_name = re.sub(r'[^a-zA-Z0-9\s-]', '', movie_name)
        safe_movie_name = re.sub(r'\s+', '_', safe_movie_name.strip())
        
        # Determine folder and filename based on image type
        if image_type == 'banner':
            folder = 'movie-banner'
            filename = f"{safe_movie_name}Banner.png"
        else:
            folder = 'movie-poster'
            filename = f"{safe_movie_name}Poster.png"
        
        # Full object name with folder structure
        object_name = f"{folder}/{filename}"
        
        # Upload to MinIO
        minio_client.put_object(
            MINIO_BUCKET_NAME,
            object_name,
            image_file,
            length=image_file.size,
            content_type=image_file.content_type
        )
        
        # Generate URL for the uploaded image
        if MINIO_SECURE:
            protocol = "https"
        else:
            protocol = "http"
        
        image_url = f"{protocol}://{MINIO_ENDPOINT}/{MINIO_BUCKET_NAME}/{object_name}"
        return image_url
        
    except S3Error as e:
        print(f"MinIO upload error: {str(e)}")
        return None
    except Exception as e:
        print(f"Image upload error: {str(e)}")
        return None


def upload_base64_image_to_minio(base64_data, movie_name, image_type='poster'):
    """
    Upload base64 image to MinIO bucket and return the URL.
    
    Args:
        base64_data: Base64 encoded image string (data URL format)
        movie_name: Name of the movie (used in filename)
        image_type: Type of image ('poster' or 'banner')
    
    Returns:
        str: URL of the uploaded image or None if failed
    """
    try:
        import base64
        import io
        
        print(f"Processing base64 image (first 100 chars): {base64_data[:100]}")
        
        # Remove data URL prefix if present
        if ',' in base64_data:
            header, base64_data = base64_data.split(',', 1)
            # Extract file extension from header (e.g., "data:image/png;base64")
            if 'image/' in header:
                file_type = header.split('image/')[1].split(';')[0]
            else:
                file_type = 'png'
        else:
            file_type = 'png'
        
        print(f"Detected file type: {file_type}")
        
        # Decode base64 to bytes
        image_data = base64.b64decode(base64_data)
        print(f"Decoded image size: {len(image_data)} bytes")
        
        # Create a seekable stream
        image_stream = io.BytesIO(image_data)
        
        # Sanitize movie name for filename (remove special characters, replace spaces with underscores)
        safe_movie_name = re.sub(r'[^a-zA-Z0-9\s-]', '', movie_name)
        safe_movie_name = re.sub(r'\s+', '_', safe_movie_name.strip())
        
        # Determine folder and filename based on image type
        if image_type == 'banner':
            folder = 'movie-banner'
            filename = f"{safe_movie_name}Banner.png"
        else:
            folder = 'movie-poster'
            filename = f"{safe_movie_name}Poster.png"
        
        # Full object name with folder structure
        object_name = f"{folder}/{filename}"
        print(f"Generated object name: {object_name}")
        
        # Determine content type
        content_type = f"image/{file_type}"
        
        # Upload to MinIO
        print(f"Uploading to MinIO bucket: {MINIO_BUCKET_NAME}")
        minio_client.put_object(
            MINIO_BUCKET_NAME,
            object_name,
            image_stream,
            length=len(image_data),
            content_type=content_type
        )
        
        # Generate URL for the uploaded image
        if MINIO_SECURE:
            protocol = "https"
        else:
            protocol = "http"
        
        image_url = f"{protocol}://{MINIO_ENDPOINT}/{MINIO_BUCKET_NAME}/{object_name}"
        print(f"Image uploaded successfully: {image_url}")
        return image_url
        
    except S3Error as e:
        print(f"MinIO S3 error during base64 upload: {str(e)}")
        print(f"Error code: {e.code if hasattr(e, 'code') else 'N/A'}")
        print(f"Error message: {e.message if hasattr(e, 'message') else 'N/A'}")
        return None
    except Exception as e:
        print(f"Base64 image upload error: {str(e)}")
        import traceback
        traceback.print_exc()
        return None


@csrf_exempt
def add_movie(request):
    """
    Add a new movie to the database with image upload to MinIO.
    
    Accepts both multipart/form-data and JSON with base64 images.
    
    JSON format:
      - title: str
      - description: str
      - genre: str or array
      - duration: str
      - releaseDate: str (YYYY-MM-DD format)
      - language: str
      - rating: str
      - director: str
      - cast: str (comma-separated)
      - posterUrl: str (base64 data URL)
      - bannerUrl: str (base64 data URL - optional)
      - ticket_price: float (optional, defaults to 10)
      - available_seats: int (optional, defaults to 100)
      - show_times: array of strings (optional)
    
    Requires admin authentication via JWT in cookies.
    """
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    # Verify admin authentication
    token = request.COOKIES.get("jwt")
    if not token:
        return JsonResponse({"error": "Authorization required"}, status=401)

    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        role = payload.get("role", "user")
        
        if role != "admin":
            return JsonResponse({"error": "Admin access required"}, status=403)

    except jwt.ExpiredSignatureError:
        return JsonResponse({"error": "Token has expired"}, status=401)
    except jwt.InvalidTokenError:
        return JsonResponse({"error": "Invalid token"}, status=401)

    try:
        # Check if request is JSON or form-data
        content_type = request.content_type or ""
        is_json = "application/json" in content_type.lower()
        
        if is_json:
            # Parse JSON data
            data = json.loads(request.body)
            
            print("=" * 50)
            print("JSON data received:", data.keys())
            print("=" * 50)
            
            title = data.get("title", "").strip()
            description = data.get("description", "").strip()
            genre_data = data.get("genre", "")
            # Handle genre as array or string
            if isinstance(genre_data, list):
                genre = ", ".join(genre_data) if genre_data else ""
            else:
                genre = str(genre_data).strip()
            
            duration = str(data.get("duration", "")).strip()
            release_date_str = data.get("releaseDate", "").strip()
            language = data.get("language", "").strip()
            rating = str(data.get("rating", "")).strip()
            director = data.get("director", "").strip()
            cast = data.get("cast", "").strip()
            ticket_price = str(data.get("ticket_price", "10")).strip()
            available_seats = str(data.get("available_seats", "100")).strip()
            
            # Handle show_times as array
            show_times_data = data.get("show_times", [])
            if isinstance(show_times_data, list):
                show_times_str = ", ".join(show_times_data) if show_times_data else ""
            else:
                show_times_str = str(show_times_data).strip()
            
            # Get base64 images
            poster_url = data.get("posterUrl", "")
            banner_url = data.get("bannerUrl", "")
            
            image_file = None
            banner_file = None
        else:
            # Parse form data
            print("=" * 50)
            print("POST data:", dict(request.POST))
            print("FILES data:", dict(request.FILES))
            print("=" * 50)
            
            title = request.POST.get("title", "").strip()
            description = request.POST.get("description", "").strip()
            genre = request.POST.get("genre", "").strip()
            duration = request.POST.get("duration", "").strip()
            release_date_str = request.POST.get("release_date", "").strip()
            language = request.POST.get("language", "").strip()
            rating = request.POST.get("rating", "").strip()
            director = request.POST.get("director", "").strip()
            cast = request.POST.get("cast", "").strip()
            ticket_price = request.POST.get("ticket_price", "10").strip()
            available_seats = request.POST.get("available_seats", "100").strip()
            show_times_str = request.POST.get("show_times", "").strip()
            
            image_file = request.FILES.get("image")
            banner_file = request.FILES.get("banner")
            poster_url = ""
            banner_url = ""

        # Validation - check each field and report missing ones
        missing_fields = []
        if not title:
            missing_fields.append("title")
        if not description:
            missing_fields.append("description")
        if not genre:
            missing_fields.append("genre")
        if not duration:
            missing_fields.append("duration")
        if not release_date_str:
            missing_fields.append("releaseDate")
        if not language:
            missing_fields.append("language")
        if not rating:
            missing_fields.append("rating")
        if not director:
            missing_fields.append("director")
        if not cast:
            missing_fields.append("cast")
        
        # Check if image is provided (either as file or base64)
        if not image_file and not poster_url:
            missing_fields.append("posterUrl or image file")

        if missing_fields:
            return JsonResponse({
                "error": "Missing required fields",
                "missing_fields": missing_fields
            }, status=400)

        # Validate image file type if provided
        if image_file:
            allowed_extensions = ['jpg', 'jpeg', 'png', 'webp']
            file_extension = image_file.name.split('.')[-1].lower()
            if file_extension not in allowed_extensions:
                return JsonResponse({"error": "Invalid image format. Allowed: jpg, jpeg, png, webp"}, status=400)

        # Parse and validate numeric fields
        try:
            # Handle rating - can be string or number
            rating_str = str(rating).strip()
            # If rating is a letter rating (U, PG, etc.), store as string
            # Otherwise try to convert to float
            try:
                rating_float = float(rating_str)
                if rating_float < 0 or rating_float > 10:
                    return JsonResponse({"error": "Numeric rating must be between 0 and 10"}, status=400)
                rating_value = rating_float
            except ValueError:
                # It's a string rating like "U", "PG", "R", etc.
                rating_value = rating_str
        except Exception:
            return JsonResponse({"error": "Invalid rating format"}, status=400)

        try:
            ticket_price_float = float(ticket_price)
            if ticket_price_float < 0:
                return JsonResponse({"error": "Ticket price must be positive"}, status=400)
        except ValueError:
            return JsonResponse({"error": "Invalid ticket price format"}, status=400)

        try:
            available_seats_int = int(available_seats)
            if available_seats_int < 0:
                return JsonResponse({"error": "Available seats must be positive"}, status=400)
        except ValueError:
            return JsonResponse({"error": "Invalid available seats format"}, status=400)

        # Parse release date
        try:
            release_date = datetime.strptime(release_date_str, "%Y-%m-%d")
        except ValueError:
            return JsonResponse({"error": "Invalid date format. Use YYYY-MM-DD"}, status=400)

        # Parse show times
        show_times = []
        if show_times_str:
            show_times = [time.strip() for time in show_times_str.split(",") if time.strip()]

        # Parse cast (convert comma-separated string to list)
        cast_list = [actor.strip() for actor in cast.split(",") if actor.strip()]

        # Check MinIO connection
        try:
            if not minio_client.bucket_exists(MINIO_BUCKET_NAME):
                return JsonResponse({
                    "error": "MinIO bucket does not exist",
                    "details": f"Please create bucket '{MINIO_BUCKET_NAME}' or start MinIO server"
                }, status=500)
        except Exception as e:
            return JsonResponse({
                "error": "Cannot connect to MinIO",
                "details": f"Please ensure MinIO is running at {MINIO_ENDPOINT}. Error: {str(e)}"
            }, status=500)
        
        # Upload images to MinIO
        if image_file:
            # Upload file
            print(f"Uploading poster from file: {image_file.name}")
            poster_image_url = upload_image_to_minio(image_file, title, 'poster')
            if not poster_image_url:
                return JsonResponse({"error": "Failed to upload poster image from file"}, status=500)
        elif poster_url:
            # Upload base64
            print(f"Uploading poster from base64 (length: {len(poster_url)} chars)")
            poster_image_url = upload_base64_image_to_minio(poster_url, title, 'poster')
            if not poster_image_url:
                return JsonResponse({
                    "error": "Failed to upload poster image from base64",
                    "details": "Check server logs for details. Ensure MinIO is running."
                }, status=500)
        else:
            return JsonResponse({"error": "No poster image provided"}, status=400)
        
        # Upload banner if provided
        banner_image_url = None
        if banner_file:
            print(f"Uploading banner from file: {banner_file.name}")
            banner_image_url = upload_image_to_minio(banner_file, title, 'banner')
            if not banner_image_url:
                print("Warning: Failed to upload banner image from file")
        elif banner_url:
            print(f"Uploading banner from base64 (length: {len(banner_url)} chars)")
            banner_image_url = upload_base64_image_to_minio(banner_url, title, 'banner')
            if not banner_image_url:
                print("Warning: Failed to upload banner image from base64")

        # Create movie document
        movie_data = {
            "title": title,
            "description": description,
            "genre": genre,
            "duration": duration,
            "release_date": release_date,
            "language": language,
            "rating": rating_value,
            "director": director,
            "cast": cast_list,
            "poster_url": poster_image_url,
            "image_url": poster_image_url,  # Keep for backward compatibility
            "ticket_price": ticket_price_float,
            "available_seats": available_seats_int,
            "show_times": show_times,
            "status": "Active",
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
            "created_by": payload.get("id")
        }
        
        # Add banner URL if provided
        if banner_image_url:
            movie_data["banner_url"] = banner_image_url

        # Insert into MongoDB
        result = movie_collection.insert_one(movie_data)
        movie_id = str(result.inserted_id)

        return JsonResponse({
            "message": "Movie added successfully",
            "movie": {
                "id": movie_id,
                "title": title,
                "poster_url": poster_image_url,
                "banner_url": banner_image_url,
                "genre": genre,
                "rating": rating_value,
                "release_date": release_date_str
            }
        }, status=201)

    except Exception as e:
        print(f"Add movie error: {str(e)}")
        import traceback
        traceback.print_exc()
        return JsonResponse({
            "error": "An unexpected error occurred while adding the movie",
            "details": str(e)
        }, status=500)

@csrf_exempt
def publish_schedule(request, movie_id):
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)
    
    # Verify admin authentication via JWT (Authorization header Bearer or cookie)
    token = _extract_jwt_from_request(request)
    if not token:
        return JsonResponse({"error": "Authorization required"}, status=401)

    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        role = payload.get("role", "user")
        if role != "admin":
            return JsonResponse({"error": "Admin access required"}, status=403)
    except jwt.ExpiredSignatureError:
        return JsonResponse({"error": "Token has expired"}, status=401)
    except jwt.InvalidTokenError:
        return JsonResponse({"error": "Invalid token"}, status=401)
    try:
        movie_obj_id = ObjectId(movie_id)
    except:
        return JsonResponse({"error": "Invalid movie ID"}, status=400)

    movie = movie_collection.find_one({"_id": movie_obj_id})
    if not movie:
        return JsonResponse({"error": "Movie not found"}, status=404)

    try:
        data = json.loads(request.body)
        schedule = data.get("schedule", {})
    except:
        return JsonResponse({"error": "Invalid JSON body"}, status=400)

    if not schedule:
        return JsonResponse({"error": "Schedule cannot be empty"}, status=400)

    movie_collection.update_one(
        {"_id": movie_obj_id},
        {
            "$set": {
                "show_schedule": schedule,
                "state": "SCREENS_PUBLISHED",
                "updated_at": datetime.utcnow()
            }
        }
    )

    return JsonResponse({
        "message": "Showtimes and screens published successfully",
        "movie_id": movie_id,
        "schedule": schedule
    }, status=200)


@csrf_exempt
def update_showtime(request, movie_id):
    """Update or add a single showtime for a movie.
    Expects PUT with JSON body: { "date": "YYYY-MM-DD", "time": "HH:MM", "screens": ["S1","S2"] }
    Only admins may call this endpoint.
    """
    if request.method != "PUT":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    # Auth
    token = _extract_jwt_from_request(request)
    if not token:
        return JsonResponse({"error": "Authorization required"}, status=401)
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        role = payload.get("role", "user")
        if role != "admin":
            return JsonResponse({"error": "Admin access required"}, status=403)
    except jwt.ExpiredSignatureError:
        return JsonResponse({"error": "Token has expired"}, status=401)
    except jwt.InvalidTokenError:
        return JsonResponse({"error": "Invalid token"}, status=401)

    try:
        movie_obj_id = ObjectId(movie_id)
    except:
        return JsonResponse({"error": "Invalid movie ID"}, status=400)

    movie = movie_collection.find_one({"_id": movie_obj_id})
    if not movie:
        return JsonResponse({"error": "Movie not found"}, status=404)

    try:
        data = json.loads(request.body)
        date = data.get("date")
        time = data.get("time")
        screens = data.get("screens", [])
    except Exception:
        return JsonResponse({"error": "Invalid JSON body"}, status=400)

    if not date or not time or not isinstance(screens, list):
        return JsonResponse({"error": "date, time and screens are required"}, status=400)

    schedule = movie.get("show_schedule", {}) or {}
    if date not in schedule:
        schedule[date] = {}
    schedule[date][time] = screens

    movie_collection.update_one({"_id": movie_obj_id}, {"$set": {"show_schedule": schedule, "updated_at": datetime.utcnow()}})

    return JsonResponse({"message": "Showtime updated", "schedule": schedule}, status=200)


@csrf_exempt
def delete_showtime(request, movie_id):
    """Delete a single showtime for a movie.
    Expects DELETE with JSON body: { "date": "YYYY-MM-DD", "time": "HH:MM" }
    Only admins may call this endpoint.
    """
    if request.method != "DELETE":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    # Auth
    token = _extract_jwt_from_request(request)
    if not token:
        return JsonResponse({"error": "Authorization required"}, status=401)
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        role = payload.get("role", "user")
        if role != "admin":
            return JsonResponse({"error": "Admin access required"}, status=403)
    except jwt.ExpiredSignatureError:
        return JsonResponse({"error": "Token has expired"}, status=401)
    except jwt.InvalidTokenError:
        return JsonResponse({"error": "Invalid token"}, status=401)

    try:
        movie_obj_id = ObjectId(movie_id)
    except:
        return JsonResponse({"error": "Invalid movie ID"}, status=400)

    movie = movie_collection.find_one({"_id": movie_obj_id})
    if not movie:
        return JsonResponse({"error": "Movie not found"}, status=404)

    try:
        data = json.loads(request.body)
        date = data.get("date")
        time = data.get("time")
    except Exception:
        return JsonResponse({"error": "Invalid JSON body"}, status=400)

    if not date or not time:
        return JsonResponse({"error": "date and time are required"}, status=400)

    schedule = movie.get("show_schedule", {}) or {}
    if date not in schedule or time not in schedule.get(date, {}):
        return JsonResponse({"error": "Showtime not found"}, status=404)

    # Remove time
    times = schedule.get(date, {})
    if time in times:
        del times[time]

    if len(times) == 0:
        if date in schedule:
            del schedule[date]
    else:
        schedule[date] = times

    movie_collection.update_one({"_id": movie_obj_id}, {"$set": {"show_schedule": schedule, "updated_at": datetime.utcnow()}})

    return JsonResponse({"message": "Showtime deleted", "schedule": schedule}, status=200)


@csrf_exempt
def upload_payment_screens(request):
    """
    Upload payment screenshot images (1-5 files) and store in MinIO under `upi/<user_id>/`.

    Accepts multipart/form-data with files under form key `screens`.
    Returns JSON with list of URLs uploaded.
    """
    if request.method != 'POST':
        return JsonResponse({"error": "Method not allowed"}, status=405)

    # Extract JWT from Authorization header (Bearer ...) or cookie
    token = _extract_jwt_from_request(request)
    if not token:
        return JsonResponse({"error": "Authentication credentials were not provided."}, status=401)

    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = str(payload.get('id'))
    except jwt.ExpiredSignatureError:
        return JsonResponse({"error": "Token has expired."}, status=401)
    except jwt.InvalidTokenError:
        return JsonResponse({"error": "Invalid token."}, status=401)
    except Exception:
        return JsonResponse({"error": "Failed to decode token."}, status=401)

    # Get files
    files = request.FILES.getlist('screens') if hasattr(request, 'FILES') else []
    if not files or len(files) == 0:
        return JsonResponse({"error": "No files provided."}, status=400)

    if len(files) > 5:
        return JsonResponse({"error": "Maximum 5 files allowed."}, status=400)

    uploaded_urls = []
    timestamp = int(datetime.utcnow().timestamp())

    for idx, f in enumerate(files, start=1):
        # Basic content-type check
        content_type = getattr(f, 'content_type', '')
        if not content_type or not content_type.startswith('image/'):
            return JsonResponse({"error": f"Invalid file type for {getattr(f, 'name', 'file')}. Only images allowed."}, status=400)

        # Sanitize filename
        orig_name = getattr(f, 'name', f'img_{idx}')
        safe_name = re.sub(r'[^a-zA-Z0-9._-]', '_', orig_name)
        # Ensure extension exists
        if '.' in safe_name:
            ext = safe_name.split('.')[-1]
        else:
            ext = 'png'

        filename = f"{timestamp}_{idx}.{ext}"
        folder = f"upi/{user_id}"
        object_name = f"{folder}/{filename}"

        try:
            # For Django UploadedFile, f is file-like and has size
            minio_client.put_object(
                MINIO_BUCKET_NAME,
                object_name,
                f,
                length=getattr(f, 'size', None),
                content_type=content_type
            )

            protocol = 'https' if MINIO_SECURE else 'http'
            url = f"{protocol}://{MINIO_ENDPOINT}/{MINIO_BUCKET_NAME}/{object_name}"
            uploaded_urls.append(url)
        except Exception as e:
            print(f"MinIO upload error: {str(e)}")
            return JsonResponse({"error": "Failed to upload files."}, status=500)

    return JsonResponse({"message": "Files uploaded successfully", "files": uploaded_urls}, status=200)