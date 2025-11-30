from django.urls import path
from .views import *

urlpatterns = [

    #User
    path("user_signup/", user_signup, name="user_signup"),
    path("user_login/", user_login, name="user_login"),
    path("get_user_profile/", get_user_profile, name="get_user_profile"),

    #Admin
    path("admin_signup/", admin_signup, name="admin_signup"),

    # Password Reset
    path("forgot-password/", forgot_password, name="forgot_password"),
    path("verify-otp/", verify_otp, name="verify_otp"),
    path("reset-password/", reset_password, name="reset_password"),

    # Google OAuth
    path("google-auth/", google_auth, name="google_auth"),
]