from django.urls import path
from .views import *

urlpatterns = [

    #User
    path("user_signup/", user_signup, name="user_signup"),
    path("user_login/", user_login, name="user_login"),
    path("get_user_profile/", get_user_profile, name="get_user_profile"),

    #Admin
    path("admin_signup/", admin_signup, name="admin_signup"),
    path("admin_login/",admin_login, name="admin_login"),
]