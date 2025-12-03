from datetime import datetime, timedelta
from django.http import JsonResponse
from pymongo import MongoClient
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
import os
import uuid
import json
from minio import Minio
from minio.error import S3Error
from io import BytesIO

from bson.objectid import ObjectId

# MinIO / S3 configuration (use environment variables)
MINIO_ENDPOINT = os.getenv('MINIO_ENDPOINT', '127.0.0.1:9000')
MINIO_ACCESS_KEY = os.getenv('MINIO_ACCESS_KEY', '')
MINIO_SECRET_KEY = os.getenv('MINIO_SECRET_KEY', '')
MINIO_SECURE = os.getenv('MINIO_SECURE', 'false').lower() in ('1', 'true', 'yes')
MINIO_BUCKET = os.getenv('MINIO_BUCKET', 'blacktickets-entertainment')

# Initialize MinIO client if credentials provided
minio_client = None
if MINIO_ACCESS_KEY and MINIO_SECRET_KEY:
    try:
        minio_client = Minio(MINIO_ENDPOINT, access_key=MINIO_ACCESS_KEY, secret_key=MINIO_SECRET_KEY, secure=MINIO_SECURE)
        # ensure bucket exists (idempotent)
        if not minio_client.bucket_exists(MINIO_BUCKET):
            minio_client.make_bucket(MINIO_BUCKET)
    except Exception as e:
        print('Failed to initialize MinIO client:', e)
        minio_client = None

# ======================= CONFIGURATION =======================

# MongoDB Configuration
mongo_url = "mongodb+srv://haaka:HAAKA%40123@haaka.rd0vpfn.mongodb.net/"
client = MongoClient(mongo_url)
db = client["BT-Enterprise"]
movies_collection = db['movies']
trending_collection = db['trending_movies']


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


@csrf_exempt
def trending_list_create(request):
    """
    GET: list trending items
    POST: upload a new trending image (multipart/form-data field 'image', optional 'title')
    """
    if request.method == 'GET':
        try:
            items = list(trending_collection.find())
            response = []
            for it in items:
                img_url = it.get('image_url')
                # If only filename stored, build absolute URL
                if not img_url and it.get('filename'):
                    img_url = request.build_absolute_uri(settings.MEDIA_URL + 'trending/' + it['filename'])
                response.append({
                    'id': str(it['_id']),
                    'title': it.get('title', ''),
                    'image_url': img_url,
                })
            return JsonResponse({'trending': response}, status=200)
        except Exception as e:
            print('Trending list error:', e)
            return JsonResponse({'error': 'Failed to fetch trending'}, status=500)

    if request.method == 'POST':
        try:
            uploaded = request.FILES.get('image') if hasattr(request, 'FILES') else None
            title = request.POST.get('title', '') if hasattr(request, 'POST') else ''
            if not uploaded:
                return JsonResponse({'error': 'No image provided'}, status=400)

            original_name = os.path.basename(uploaded.name)
            ext = os.path.splitext(original_name)[1]
            filename = f"{uuid.uuid4().hex}{ext}"

            # If MinIO client is configured, upload to bucket under 'trending/' prefix
            object_name = f"trending/{filename}"
            image_url = None
            if minio_client:
                try:
                    # read contents
                    uploaded.seek(0)
                    data = uploaded.read()
                    size = len(data)
                    buf = BytesIO(data)
                    content_type = getattr(uploaded, 'content_type', 'application/octet-stream')
                    minio_client.put_object(MINIO_BUCKET, object_name, buf, length=size, content_type=content_type)
                    scheme = 'https' if MINIO_SECURE else 'http'
                    image_url = f"{scheme}://{MINIO_ENDPOINT}/{MINIO_BUCKET}/{object_name}"
                except Exception as e:
                    print('MinIO upload failed, falling back to local save:', e)
                    image_url = None

            # Fallback: save to local media if MinIO not configured or failed
            if not image_url:
                trending_dir = os.path.join(settings.MEDIA_ROOT, 'trending')
                os.makedirs(trending_dir, exist_ok=True)
                dest_path = os.path.join(trending_dir, filename)
                with open(dest_path, 'wb') as dst:
                    for chunk in uploaded.chunks():
                        dst.write(chunk)
                image_url = request.build_absolute_uri(settings.MEDIA_URL + 'trending/' + filename)

            doc = {
                'filename': filename,
                'object_name': object_name,
                'image_url': image_url,
                'title': title,
                'created_at': datetime.utcnow()
            }
            res = trending_collection.insert_one(doc)

            return JsonResponse({'message': 'Uploaded', 'trending': {'id': str(res.inserted_id), 'image_url': image_url, 'title': title}}, status=201)
        except Exception as e:
            print('Trending upload error:', e)
            return JsonResponse({'error': 'Upload failed'}, status=500)

    return JsonResponse({'error': 'Method not allowed'}, status=405)


@csrf_exempt
def trending_delete(request, item_id):
    """
    DELETE: remove trending item and delete file from media
    """
    if request.method != 'DELETE':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    try:
        try:
            obj_id = ObjectId(item_id)
        except Exception:
            return JsonResponse({'error': 'Invalid id'}, status=400)

        item = trending_collection.find_one({'_id': obj_id})
        if not item:
            return JsonResponse({'error': 'Not found'}, status=404)

        # delete file from MinIO if object_name present
        object_name = item.get('object_name')
        if object_name and minio_client:
            try:
                minio_client.remove_object(MINIO_BUCKET, object_name)
            except Exception as e:
                print('Failed to remove object from MinIO:', e)

        # fallback: delete local file if present
        filename = item.get('filename')
        if filename:
            path = os.path.join(settings.MEDIA_ROOT, 'trending', filename)
            try:
                if os.path.exists(path):
                    os.remove(path)
            except Exception as e:
                print('Failed removing local file:', e)

        trending_collection.delete_one({'_id': obj_id})
        return JsonResponse({'message': 'Deleted'}, status=200)
    except Exception as e:
        print('Trending delete error:', e)
        return JsonResponse({'error': 'Failed to delete'}, status=500)


@csrf_exempt
def admin_update_movie(request, movie_id):
    """
    PATCH: update movie fields (supports toggling `is_recent`)
    """
    if request.method not in ('PATCH', 'PUT'):
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    try:
        try:
            obj_id = ObjectId(movie_id)
        except Exception:
            return JsonResponse({'error': 'Invalid movie id'}, status=400)

        body = json.loads(request.body.decode('utf-8') or '{}')
        allowed = {}
        if 'is_recent' in body:
            allowed['is_recent'] = bool(body['is_recent'])

        if not allowed:
            return JsonResponse({'error': 'No updatable fields provided'}, status=400)

        movies_collection.update_one({'_id': obj_id}, {'$set': allowed})

        updated = movies_collection.find_one({'_id': obj_id})
        if updated:
            updated['_id'] = str(updated['_id'])
        return JsonResponse({'message': 'Updated', 'movie': updated}, status=200)
    except Exception as e:
        print('Movie update error:', e)
        return JsonResponse({'error': 'Failed to update movie'}, status=500)