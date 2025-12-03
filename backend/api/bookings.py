
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
def hold_seats(request, movie_id, show_id):
    # POST body: { "seatIds": ["A1","A2"], "flow":"seat", "user_id": "..." }
    if request.method != "POST":
        return JsonResponse({"error":"Method not allowed"}, status=405)
    try:
        body = json.loads(request.body.decode('utf-8') if hasattr(request, 'body') else '{}')
    except Exception:
        return JsonResponse({"error":"Invalid JSON body"}, status=400)
    seatIds = body.get("seatIds")
    flow = body.get("flow","seat")
    if not seatIds or not isinstance(seatIds, list) or len(seatIds)==0:
        return JsonResponse({"error":"seatIds required (non-empty list)"}, status=400)
    # Validate movie and show exist
    try:
        movie_obj = movies_collection.find_one({"_id": ObjectId(movie_id)})
    except Exception:
        return JsonResponse({"error":"Invalid movie id"}, status=400)
    if not movie_obj:
        return JsonResponse({"error":"Movie not found"}, status=404)
    # find show entry
    show = None
    for st in movie_obj.get("show_times", []):
        if str(st.get("show_id"))==str(show_id) or st.get("show_id")==show_id:
            show = st
            break
    if not show:
        return JsonResponse({"error":"Show not found in movie"}, status=404)
    # Build query to ensure all seats are available
    session = client.start_session()
    booking_oid = ObjectId()
    booking_id = str(booking_oid)
    hold_until = datetime.utcnow() + timedelta(seconds=HOLD_SECONDS)
    try:
        with session.start_transaction():
            # Ensure all seats are available
            for sid in seatIds:
                found = movies_collection.find_one({
                    "_id": movie_obj["_id"],
                    "show_times": {
                        "$elemMatch": {
                            "show_id": show.get("show_id"),
                            "seats": {"$elemMatch": {"seat_id": sid, "status": "available"}}
                        }
                    }
                }, session=session)
                if not found:
                    session.abort_transaction()
                    return JsonResponse({"ok": False, "reason": "Some seats unavailable", "unavailableSeat": sid}, status=409)
            # All seats available -> update them to held
            for sid in seatIds:
                res = movies_collection.update_one(
                    {"_id": movie_obj["_id"], "show_times.show_id": show.get("show_id")},
                    {"$set": {
                        "show_times.$[st].seats.$[s].status": "held",
                        "show_times.$[st].seats.$[s].held_by": booking_id,
                        "show_times.$[st].seats.$[s].hold_expires_at": hold_until
                    }},
                    array_filters=[{"st.show_id": show.get("show_id")}, {"s.seat_id": sid}],
                    session=session
                )
                if res.modified_count == 0:
                    session.abort_transaction()
                    return JsonResponse({"ok": False, "reason":"Seat update failed", "seat": sid}, status=500)
            # Create booking doc
            booking_doc = {
                "_id": booking_oid,
                "user_id": body.get("user_id", None),
                "movie_id": movie_obj["_id"],
                "show_id": show.get("show_id"),
                "seats": seatIds,
                "flow": flow,
                "status": "HOLD",
                "hold_expires_at": hold_until,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "history": [{"actor":"system","action":"hold_created","timestamp": datetime.utcnow().isoformat()}]
            }
            bookings_collection.insert_one(booking_doc, session=session)
    except Exception as e:
        try:
            session.abort_transaction()
        except:
            pass
        return JsonResponse({"ok": False, "error": str(e)}, status=500)
    finally:
        session.end_session()
    return JsonResponse({"ok": True, "bookingId": str(booking_doc["_id"]), "seats": seatIds, "hold_expires_at": hold_until.isoformat()}, status=200)

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
