from datetime import datetime, timedelta
from django.http import JsonResponse
from pymongo import MongoClient
from django.views.decorators.csrf import csrf_exempt

# ======================= CONFIGURATION =======================

# MongoDB Configuration
mongo_url = "mongodb+srv://haaka:HAAKA%40123@haaka.rd0vpfn.mongodb.net/"
client = MongoClient(mongo_url)
db = client["BT-Enterprise"]
movies_collection = db['movies']

# ======================= MOVIES =======================

@csrf_exempt
def get_all_movies(request):
    """
    Retrieves all movies from the movies collection.
    
    Returns:
    - GET: JSON array of all movies with all fields
    - Status 200: Success with movies list
    - Status 500: Internal server error
    """
    if request.method != "GET":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    try:
        # Fetch all movies from the collection
        movies = list(movies_collection.find())

        # Build response list and include created_at (ISO) and created_by
        movies_response = []
        for movie in movies:
            created_at = movie.get("created_at")
            movie_data = {
                "_id": str(movie["_id"]),
                "title": movie.get("title"),
                "poster_url": movie.get("poster_url"),
                "image_url": movie.get("image_url"),
                "banner_url": movie.get("banner_url"),
                "status": movie.get("status"),
                "created_at": created_at.isoformat() if created_at else None,
            }
            movies_response.append(movie_data)
        
        return JsonResponse({
            "message": "Movies retrieved successfully",
            "count": len(movies_response),
            "movies": movies_response
        }, status=200)

    except Exception as e:
        print(f"Get all movies error: {str(e)}")
        return JsonResponse({"error": "An unexpected error occurred."}, status=500)
    

@csrf_exempt
def get_movie_by_id(request, movie_id):
    """
    Retrieves a single movie by its ID with all details.
    
    Args:
    - movie_id: MongoDB ObjectId as string
    
    Returns:
    - GET: JSON object with complete movie details
    - Status 200: Success with movie data
    - Status 404: Movie not found
    - Status 500: Internal server error
    """
    if request.method != "GET":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    try:
        from bson.objectid import ObjectId
        
        # Validate and convert movie_id to ObjectId
        try:
            movie_obj_id = ObjectId(movie_id)
        except Exception:
            return JsonResponse({"error": "Invalid movie ID format"}, status=400)
        
        # Fetch movie by ID
        movie = movies_collection.find_one({"_id": movie_obj_id})
        
        if not movie:
            return JsonResponse({"error": "Movie not found"}, status=404)
        
        # Convert ObjectId fields to strings
        movie["_id"] = str(movie["_id"])
        if "created_by" in movie and movie["created_by"]:
            movie["created_by"] = str(movie["created_by"])
        
        return JsonResponse({
            "message": "Movie retrieved successfully",
            "movie": movie
        }, status=200)

    except Exception as e:
        print(f"Get movie by ID error: {str(e)}")
        return JsonResponse({"error": "An unexpected error occurred."}, status=500)   