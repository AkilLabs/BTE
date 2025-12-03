from django.urls import path
from .views import *
from .movies import *
from .bookings import *

urlpatterns = [

    #User
    path("user_signup/", user_signup, name="user_signup"),
    path("user_login/", user_login, name="user_login"),
    path("get_user_profile/", get_user_profile, name="get_user_profile"),
    # path("update_user_profile/", update_user_profile, name="update_user_profile"),

    #Admin
    path("admin_signup/", admin_signup, name="admin_signup"),

    # Password Reset
    path("forgot-password/", forgot_password, name="forgot_password"),
    path("verify-otp/", verify_otp, name="verify_otp"),
    path("reset-password/", reset_password, name="reset_password"),

    # Google OAuth
    path("google-auth/", google_auth, name="google_auth"),

    # Movies
    path("get-movies/", get_all_movies, name="get_all_movies"),
    path("get-movie/<str:movie_id>/", get_movie_by_id, name="get_movie_by_id"),

    # Trending management (admin)
    path("admin/trending/", trending_list_create, name="trending_list_create"),
    path("admin/trending/<str:item_id>/", trending_delete, name="trending_delete"),

    # Admin movie update (e.g., toggle is_recent)
    path("admin/movies/<str:movie_id>/", admin_update_movie, name="admin_update_movie"),

    # Movie Management
    path("add-movie/", add_movie, name="add_movie"),
    path("admin/movies/<str:movie_id>/publish-schedule/", publish_schedule, name="publish_schedule"),
    path("admin/movies/<str:movie_id>/publish-schedule/update/", update_showtime, name="update_showtime"),
    path("admin/movies/<str:movie_id>/publish-schedule/delete/", delete_showtime, name="delete_showtime"),
    path("upload-payment-screens/", upload_payment_screens, name="upload_payment_screens"),

    # Bookings and Shows
    path("shows/<str:movie_id>/<str:time_str>/hold/", hold_seats, name="hold_seats"),
    path("bookings/<str:booking_id>/", get_booking, name="get_booking"),
]