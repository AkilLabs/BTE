
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from pymongo import MongoClient
from datetime import datetime, timedelta
from bson import ObjectId
import uuid
import os
import json

# reuse same mongo url as movies.py if available via env, else use hardcoded (not ideal)
MONGO_URL = os.environ.get("MONGO_URL", "mongodb+srv://haaka:HAAKA%40123@haaka.rd0vpfn.mongodb.net/")
client = MongoClient(MONGO_URL)
db = client["BT-Enterprise"]
movies_collection = db['movies']
bookings_collection = db['bookings']

HOLD_SECONDS = int(os.environ.get("HOLD_SECONDS", 600))  # 10 minutes default

@csrf_exempt
def hold_seats(request, movie_id, time_str):
    """
    Endpoint: POST /api/shows/<movie_id>/<time>/hold/
    Body: { date, screen_id, seatIds: [...], user_id?: ... }
    All-or-nothing hold implemented by checking bookings collection for conflicts
    and inserting a HOLD booking transactionally.
    """
    if request.method != "POST":
        return JsonResponse({"ok": False, "error": "Method not allowed"}, status=405)

    try:
        body = json.loads(request.body.decode("utf-8"))
    except Exception:
        return JsonResponse({"ok": False, "error": "Invalid JSON"}, status=400)

    date = body.get("date")
    screen_id = body.get("screen_id")
    seat_ids = body.get("seatIds") or body.get("seat_ids") or []
    user_id = body.get("user_id") or body.get("userId") or None

    if not date or not screen_id or not seat_ids:
        return JsonResponse({"ok": False, "error": "Missing date, screen_id or seatIds"}, status=400)

    # Validate user_id if provided
    if user_id:
        users_coll = db.get_collection("users")
        user_oid = None
        try:
            user_oid = ObjectId(user_id)
        except:
            return JsonResponse({"ok": False, "error": "Invalid user_id format"}, status=400)
        
        user = users_coll.find_one({"_id": user_oid})
        if not user:
            return JsonResponse({"ok": False, "error": "User not found"}, status=404)

    # normalize
    time = time_str  # e.g. "22:45"
    movie_oid = None
    try:
        movie_oid = ObjectId(movie_id)
    except Exception:
        # allow string id if your code uses strings; otherwise reject
        try:
            movie_oid = ObjectId(movie_id)
        except:
            return JsonResponse({"ok": False, "error": "Invalid movie id"}, status=400)

    movies_coll = db.get_collection("movies")
    bookings_coll = db.get_collection("bookings")

    # 1) Validate that the movie exists and that show_schedule has date -> time -> screen
    movie = movies_coll.find_one({"_id": movie_oid})
    if not movie:
        return JsonResponse({"ok": False, "error": "Movie not found"}, status=404)

    show_schedule = movie.get("show_schedule") or {}
    day_schedule = show_schedule.get(date)
    if not day_schedule:
        return JsonResponse({"ok": False, "error": "Date not found in show_schedule"}, status=404)

    # day_schedule is like { "22:45": ["S1","S2"], ... }
    screens_for_time = day_schedule.get(time)
    if not screens_for_time or screen_id not in screens_for_time:
        return JsonResponse({"ok": False, "error": "Show time or screen not found in schedule"}, status=404)

    # 2) Normalize seat ids (strings)
    # Accept seat ids as strings (e.g. "14-15")
    requested_seats = [str(s).strip() for s in seat_ids]
    if not requested_seats:
        return JsonResponse({"ok": False, "error": "No seatIds provided"}, status=400)

    # 3) Conflict check: look for any existing booking for same movie+date+time+screen that
    #    has overlapping seats and status in HOLD | PENDING | CONFIRMED and hasn't expired (for HOLDs).
    now = datetime.utcnow()

    # Query matches bookings with overlapping seats: bookings.seats intersects requested seats
    conflict_filter = {
        "movie_id": movie_oid,
        "date": date,
        "time": time,
        "screen_id": screen_id,
        "status": { "$in": ["HOLD", "PENDING", "CONFIRMED"] },
        "seats": { "$in": requested_seats }
    }

    # However: we must ignore HOLD bookings that are already expired (hold_expires_at <= now).
    # We'll check conflicts inside a transaction to be safe.
    session = client.start_session()
    try:
        with session.start_transaction():
            # Find conflicts
            conflicts_cursor = bookings_coll.find(conflict_filter, session=session)
            conflicts = []
            for b in conflicts_cursor:
                # If conflict booking is HOLD but expired -> ignore
                if b.get("status") == "HOLD":
                    h_exp = b.get("hold_expires_at")
                    if h_exp:
                        # h_exp expected to be stored as a datetime in the booking doc
                        if isinstance(h_exp, datetime):
                            if h_exp <= now:
                                # ignore expired hold
                                continue
                        else:
                            # if stored as string, parse? assume datetime stored
                            pass
                # If here, booking truly conflicts
                conflicts.append(b)

            if conflicts:
                # pick first conflicting seat to return (helpful UX)
                # find intersection
                conflicting_seats = set()
                for b in conflicts:
                    conflicting_seats.update(set(b.get("seats", [])) & set(requested_seats))
                return JsonResponse({
                    "ok": False,
                    "reason": "Some seats are already held/booked",
                    "conflicting_seats": list(conflicting_seats)[:10]
                }, status=409)

            # 4) No conflicts -> create booking doc with status HOLD
            hold_expires_at = now + timedelta(seconds=HOLD_SECONDS)
            booking_doc = {
                "movie_id": movie_oid,
                "date": date,
                "time": time,
                "screen_id": screen_id,
                "seats": requested_seats,
                "user_id": user_id,
                "status": "HOLD",
                "flow": "seat",
                "hold_expires_at": hold_expires_at,
                "created_at": now,
                "updated_at": now,
                "history": [
                    {"actor": user_id or "unknown", "action": "hold_created", "ts": now}
                ]
            }
            result = bookings_coll.insert_one(booking_doc, session=session)
            booking_id = str(result.inserted_id)

            # success: commit transaction automatically by context manager
            return JsonResponse({
                "ok": True,
                "bookingId": booking_id,
                "seats": requested_seats,
                "hold_expires_at": hold_expires_at.isoformat() + "Z"
            }, status=200)
    except Exception as e:
        # transaction aborted automatically on exception
        return JsonResponse({"ok": False, "error": "Server error", "details": str(e)}, status=500)
    finally:
        session.end_session()

@csrf_exempt
def get_booking(request, booking_id):
    if request.method != "GET":
        return JsonResponse({"error":"Method not allowed"}, status=405)
    try:
        b = bookings_collection.find_one({"_id": ObjectId(booking_id)})
        if not b:
            return JsonResponse({"error":"Booking not found"}, status=404)
        # convert ObjectIds
        b["_id"] = str(b["_id"])
        if "movie_id" in b and isinstance(b["movie_id"], ObjectId):
            b["movie_id"] = str(b["movie_id"])
        return JsonResponse({"ok":True,"booking":b}, status=200)
    except Exception as e:
        return JsonResponse({"ok":False,"error":str(e)}, status=500)
