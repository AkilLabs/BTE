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
mongo_url = os.getenv("MONGO_URI")
client = MongoClient(mongo_url)
db = client["BT-Enterprise"]
user_collection = db["users"]
admin_collection = db['admin']


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
    Authenticates a user.
    Expects JSON payload with 'email' and 'password'.
    Returns a JWT token on successful authentication.
    """
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    try:
        data = json.loads(request.body or "{}")
        email = data.get("email", "").strip()
        password = data.get("password", "")

        if not email or not password:
            return JsonResponse({"error": "Email and password are required"}, status=400)

        user = user_collection.find_one({"email": email})
        if not user:
            return JsonResponse({"error": "Email not found"}, status=404)

        if check_password(password, user["password"]):
            user_collection.update_one({"email": email}, {"$set": {"last_login": datetime.now()}})
            tokens = generate_tokens(user["_id"], user.get("name", ""), "user")
            return JsonResponse({"message": "Login successful", "token": tokens}, status=200)
        else:
            return JsonResponse({"error": "Invalid password"}, status=401)

    except Exception:
        # Log the exception details internally
        return JsonResponse({"error": "An unexpected error occurred. Please try again."}, status=500)
    

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

@csrf_exempt
def admin_login(request):
    """
    Authenticates an admin user.

    Expects JSON payload with 'email' and 'password'.
    Returns a JWT token on successful authentication.
    """
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    try:
        data = json.loads(request.body or "{}")
        email = data.get("email", "").strip()
        password = data.get("password", "")

        if not email or not password:
            return JsonResponse({"error": "Email and password are required"}, status=400)

        admin = admin_collection.find_one({"email": email})
        if not admin:
            return JsonResponse({"error": "Email not found"}, status=404)

        if admin.get("status") == "Inactive":
            return JsonResponse({"error": "Account is inactive. Contact superadmin."}, status=403)

        if check_password(password, admin["password"]):
            admin_collection.update_one({"email": email}, {"$set": {"last_login": datetime.now()}})
            tokens = generate_tokens(admin["_id"], admin.get("name", ""), "admin")
            return JsonResponse({"message": "Login successful", "token": tokens}, status=200)
        else:
            return JsonResponse({"error": "Invalid password"}, status=401)

    except Exception:
        # Log exception details internally
        return JsonResponse({"error": "An unexpected error occurred."}, status=500)