import { useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { Upload, X } from 'lucide-react';
import AdminNavbar from './AdminNavbar';
import AdminBottomNavigation from './AdminBottomNavigation';
import { useEffect, useRef } from 'react';

interface MovieFormData {
  title: string;
  description: string;
  genre: string[];
  duration: string;
  releaseDate: string;
  language: string;
  rating: string;
  posterUrl: string;
  bannerUrl: string;
  director: string;
  cast: string;
}

const GENRE_OPTIONS = [
  'Action',
  'Comedy',
  'Drama',
  'Horror',
  'Romance',
  'Thriller',
  'Animation',
  'Sci-Fi',
  'Adventure',
  'Fantasy',
];

export default function NewMovie() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [genreInput, setGenreInput] = useState('');
  const [showGenreDropdown, setShowGenreDropdown] = useState(false);
  const [showCensorshipDropdown, setShowCensorshipDropdown] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [formData, setFormData] = useState<MovieFormData>({
    title: '',
    description: '',
    genre: [],
    duration: '',
    releaseDate: '',
    language: '',
    rating: '',
    posterUrl: '',
    bannerUrl: '',
    director: '',
    cast: '',
  });

  // Poster crop state
  const [posterImage, setPosterImage] = useState<string | null>(null);
  const [posterZoom, setPosterZoom] = useState(1);
  const [posterOffsetX, setPosterOffsetX] = useState(0);
  const [posterOffsetY, setPosterOffsetY] = useState(0);
  const [showPosterCrop, setShowPosterCrop] = useState(false);

  // Banner crop state
  const [bannerImage, setBannerImage] = useState<string | null>(null);
  const [bannerZoom, setBannerZoom] = useState(1);
  const [bannerOffsetX, setBannerOffsetX] = useState(0);
  const [bannerOffsetY, setBannerOffsetY] = useState(0);
  const [showBannerCrop, setShowBannerCrop] = useState(false);

  const genreRef = useRef<HTMLDivElement>(null);
  const censorshipRef = useRef<HTMLDivElement>(null);
  const languageRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (genreRef.current && !genreRef.current.contains(event.target as Node)) {
        setShowGenreDropdown(false);
      }
      if (censorshipRef.current && !censorshipRef.current.contains(event.target as Node)) {
        setShowCensorshipDropdown(false);
      }
      if (languageRef.current && !languageRef.current.contains(event.target as Node)) {
        setShowLanguageDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Filter genres based on input
  const filteredGenres = GENRE_OPTIONS.filter(
    (g) =>
      g.toLowerCase().includes(genreInput.toLowerCase()) &&
      !formData.genre.includes(g)
  );

  const handleGenreSelect = (genre: string) => {
    setFormData((prev) => ({
      ...prev,
      genre: [...prev.genre, genre],
    }));
    setGenreInput('');
    setShowGenreDropdown(false);
  };

  const handleGenreRemove = (genre: string) => {
    setFormData((prev) => ({
      ...prev,
      genre: prev.genre.filter((g) => g !== genre),
    }));
  };

  const handleGenreInputKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (genreInput.trim() && !formData.genre.includes(genreInput.trim())) {
        setFormData((prev) => ({
          ...prev,
          genre: [...prev.genre, genreInput.trim()],
        }));
        setGenreInput('');
        setShowGenreDropdown(false);
      }
    }
  };

  // Crop image and convert to base64
  const getCroppedImageData = async (
    imageSrc: string,
    width: number,
    height: number,
    zoom: number,
    offsetX: number,
    offsetY: number
  ): Promise<string> => {
    return new Promise((resolve) => {
      const image = new Image();
      image.src = imageSrc;
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // Calculate source dimensions
        const sourceWidth = image.width / zoom;
        const sourceHeight = image.height / zoom;

        // Calculate source position (accounting for offset)
        const sourceX = (image.width - sourceWidth) / 2 + offsetX;
        const sourceY = (image.height - sourceHeight) / 2 + offsetY;

        ctx?.drawImage(
          image,
          sourceX,
          sourceY,
          sourceWidth,
          sourceHeight,
          0,
          0,
          width,
          height
        );

        resolve(canvas.toDataURL());
      };
    });
  };

  // Handle poster image selection
  const handlePosterImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPosterImage(reader.result as string);
        setShowPosterCrop(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle banner image selection
  const handleBannerImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerImage(reader.result as string);
        setShowBannerCrop(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // Confirm poster crop
  const handlePosterCropConfirm = async () => {
    if (posterImage) {
      const croppedImage = await getCroppedImageData(
        posterImage,
        300,
        400,
        posterZoom,
        posterOffsetX,
        posterOffsetY
      );
      setFormData((prev) => ({ ...prev, posterUrl: croppedImage }));
      setShowPosterCrop(false);
      setPosterImage(null);
      setPosterZoom(1);
      setPosterOffsetX(0);
      setPosterOffsetY(0);
      showToast('Poster set successfully', 'success');
    }
  };

  // Confirm banner crop
  const handleBannerCropConfirm = async () => {
    if (bannerImage) {
      const croppedImage = await getCroppedImageData(
        bannerImage,
        560,
        315,
        bannerZoom,
        bannerOffsetX,
        bannerOffsetY
      );
      setFormData((prev) => ({ ...prev, bannerUrl: croppedImage }));
      setShowBannerCrop(false);
      setBannerImage(null);
      setBannerZoom(1);
      setBannerOffsetX(0);
      setBannerOffsetY(0);
      showToast('Banner set successfully', 'success');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Close all dropdowns on submit
    setShowCensorshipDropdown(false);
    setShowLanguageDropdown(false);
    setShowGenreDropdown(false);

    try {
      // Validate required fields
      if (!formData.title || formData.genre.length === 0 || !formData.duration || !formData.releaseDate) {
        showToast('Please fill in all required fields', 'error');
        setLoading(false);
        return;
      }

      const response = await fetch('http://68.183.80.191:8000/api/add-movie/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(data.error || 'Failed to add movie', 'error');
        setLoading(false);
        return;
      }

      showToast('Movie added successfully! 🎬', 'success');

      // Reset form
      setFormData({
        title: '',
        description: '',
        genre: [],
        duration: '',
        releaseDate: '',
        language: '',
        rating: '',
        posterUrl: '',
        bannerUrl: '',
        director: '',
        cast: '',
      });
      setShowPosterCrop(false);
      setShowBannerCrop(false);
    } catch (err) {
      showToast('An error occurred. Please try again.', 'error');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <AdminNavbar />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-8 md:pt-24 pb-24 md:pb-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Create Movies</h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Row 1: Title and Genre */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-white text-sm font-semibold mb-3">Title:</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full bg-white/20 border border-white/15 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:border-white/30 focus:bg-white/25 focus:outline-none transition duration-200"
                required
              />
            </div>

            <div ref={genreRef}>
              <label className="block text-white text-sm font-semibold mb-3">Movie genre:</label>
              <div className="relative">
                <div className="w-full bg-white/20 border border-white/15 rounded-lg px-4 py-3 min-h-[52px] flex flex-wrap gap-2 items-center focus-within:border-white/30 focus-within:bg-white/25 transition duration-200">
                  {formData.genre.map((g) => (
                    <div
                      key={g}
                      className="bg-yellow-400 text-black px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2"
                    >
                      {g}
                      <button
                        type="button"
                        onClick={() => handleGenreRemove(g)}
                        className="hover:text-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <input
                    type="text"
                    value={genreInput}
                    onChange={(e) => {
                      setGenreInput(e.target.value);
                      setShowGenreDropdown(true);
                    }}
                    onKeyDown={handleGenreInputKey}
                    onFocus={() => setShowGenreDropdown(true)}
                    placeholder={formData.genre.length === 0 ? 'Select or type genre' : ''}
                    className="bg-transparent text-white text-sm placeholder-slate-400 focus:outline-none flex-1 min-w-[100px]"
                  />
                </div>

                {/* Genre Dropdown */}
                {showGenreDropdown && filteredGenres.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white/15 border border-white/15 rounded-lg z-10 max-h-48 overflow-y-auto backdrop-blur">
                    {filteredGenres.map((genre) => (
                      <button
                        key={genre}
                        type="button"
                        onClick={() => handleGenreSelect(genre)}
                        className="w-full text-left px-4 py-2.5 text-white hover:bg-white/20 transition text-sm"
                      >
                        {genre}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Row 2: Censorship and Languages */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div ref={censorshipRef}>
              <label className="block text-white text-sm font-semibold mb-3">Censorship:</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowCensorshipDropdown(!showCensorshipDropdown)}
                  className="w-full bg-white/20 border border-white/15 rounded-lg px-4 py-3 text-white focus:border-white/30 focus:bg-white/25 focus:outline-none transition duration-200 flex items-center justify-between"
                >
                  <span>{formData.rating || 'Select rating'}</span>
                  <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </button>

                {showCensorshipDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white/15 border border-white/15 rounded-lg z-10 backdrop-blur">
                    {['U', 'UA', 'A', 'S'].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, rating }));
                          setShowCensorshipDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-white hover:bg-white/20 transition text-sm first:rounded-t-lg last:rounded-b-lg"
                      >
                        {rating}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div ref={languageRef}>
              <label className="block text-white text-sm font-semibold mb-3">Languages:</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                  className="w-full bg-white/20 border border-white/15 rounded-lg px-4 py-3 text-white focus:border-white/30 focus:bg-white/25 focus:outline-none transition duration-200 flex items-center justify-between"
                >
                  <span>{formData.language || 'Select language'}</span>
                  <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </button>

                {showLanguageDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white/15 border border-white/15 rounded-lg z-10 backdrop-blur max-h-48 overflow-y-auto">
                    {['Hindi', 'English', 'Tamil', 'Telugu', 'Kannada', 'Malayalam'].map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, language: lang }));
                          setShowLanguageDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-white hover:bg-white/20 transition text-sm"
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Row 3: Director and Cast */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-white text-sm font-semibold mb-3">Director:</label>
              <input
                type="text"
                name="director"
                value={formData.director}
                onChange={handleInputChange}
                className="w-full bg-white/20 border border-white/15 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:border-white/30 focus:bg-white/25 focus:outline-none transition duration-200"
              />
            </div>

            <div>
              <label className="block text-white text-sm font-semibold mb-3">Cast:</label>
              <input
                type="text"
                name="cast"
                value={formData.cast}
                onChange={handleInputChange}
                placeholder="e.g., Actor 1, Actor 2"
                className="w-full bg-white/20 border border-white/15 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:border-white/30 focus:bg-white/25 focus:outline-none transition duration-200"
              />
            </div>
          </div>

          {/* Storyline (Description) */}
          <div>
            <label className="block text-white text-sm font-semibold mb-3">Storyline:</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter movie description"
              rows={4}
              className="w-full bg-white/20 border border-white/15 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:border-white/30 focus:bg-white/25 focus:outline-none transition duration-200 resize-none"
            />
          </div>

          {/* Movie Poster Upload with Crop Modal */}
          <div>
            <label className="block text-white text-sm font-semibold mb-3">Movie Poster (Card Ratio 3:4):</label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Upload Area */}
              <label className="w-full h-56 border-2 border-dashed border-white/20 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-white/40 hover:bg-white/10 transition">
                <Upload className="w-12 h-12 text-slate-400 mb-3" />
                <span className="text-slate-300 text-sm">Click to select Poster</span>
                <input
                  type="file"
                  onChange={handlePosterImageChange}
                  accept="image/*"
                  className="hidden"
                />
              </label>

              {/* Preview */}
              {formData.posterUrl ? (
                <div className="relative group">
                  <img
                    src={formData.posterUrl}
                    alt="Poster preview"
                    className="w-full h-56 object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 rounded-lg transition flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setPosterImage(formData.posterUrl);
                        setShowPosterCrop(true);
                      }}
                      className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold rounded-lg transition"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, posterUrl: '' }));
                      }}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="w-full h-56 bg-white/5 border border-white/15 rounded-lg flex items-center justify-center">
                  <span className="text-slate-400 text-sm">No image selected</span>
                </div>
              )}
            </div>
          </div>

          {/* Movie Banner Upload with Crop Modal */}
          <div>
            <label className="block text-white text-sm font-semibold mb-3">Movie Banner (Landscape 16:9):</label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Upload Area */}
              <label className="w-full h-40 border-2 border-dashed border-white/20 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-white/40 hover:bg-white/10 transition">
                <Upload className="w-12 h-12 text-slate-400 mb-3" />
                <span className="text-slate-300 text-sm">Click to select Banner</span>
                <input
                  type="file"
                  onChange={handleBannerImageChange}
                  accept="image/*"
                  className="hidden"
                />
              </label>

              {/* Preview */}
              {formData.bannerUrl ? (
                <div className="relative group">
                  <img
                    src={formData.bannerUrl}
                    alt="Banner preview"
                    className="w-full h-40 object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 rounded-lg transition flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setBannerImage(formData.bannerUrl);
                        setShowBannerCrop(true);
                      }}
                      className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold rounded-lg transition"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, bannerUrl: '' }));
                      }}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="w-full h-40 bg-white/5 border border-white/15 rounded-lg flex items-center justify-center">
                  <span className="text-slate-400 text-sm">No image selected</span>
                </div>
              )}
            </div>
          </div>

          {/* Additional Fields Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-white text-sm font-semibold mb-3">Duration (minutes):</label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                placeholder="e.g., 120"
                className="w-full bg-white/20 border border-white/15 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:border-white/30 focus:bg-white/25 focus:outline-none transition duration-200"
                required
              />
            </div>

            <div>
              <label className="block text-white text-sm font-semibold mb-3">Release Date:</label>
              <input
                type="date"
                name="releaseDate"
                value={formData.releaseDate}
                onChange={handleInputChange}
                className="w-full bg-white/20 border border-white/15 rounded-lg px-4 py-3 text-white focus:border-white/30 focus:bg-white/25 focus:outline-none transition duration-200"
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center pt-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold rounded-full px-12 py-2.5 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>

      {/* Poster Crop Modal */}
      {showPosterCrop && posterImage && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-b from-slate-900 to-black border border-white/20 rounded-2xl w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10 sticky top-0 bg-gradient-to-b from-slate-900">
              <div>
                <h2 className="text-2xl font-bold text-white">Crop Movie Poster</h2>
                <p className="text-sm text-slate-400 mt-1">Aspect Ratio: 3:4 | Drag to position • Zoom to scale</p>
              </div>
              <button
                onClick={() => {
                  setShowPosterCrop(false);
                  setPosterImage(null);
                  setPosterZoom(1);
                  setPosterOffsetX(0);
                  setPosterOffsetY(0);
                }}
                className="text-slate-400 hover:text-white hover:bg-white/10 p-2 rounded-lg transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Crop Preview Area */}
              <div className="relative mx-auto" style={{ width: '300px', aspectRatio: '3/4' }}>
                <div 
                  className="relative w-full h-full bg-black border-4 border-yellow-400/50 rounded-lg overflow-hidden cursor-grab active:cursor-grabbing touch-none"
                  onMouseDown={(e) => {
                    const startX = e.clientX;
                    const startY = e.clientY;
                    const startOffsetX = posterOffsetX;
                    const startOffsetY = posterOffsetY;

                    const handleMouseMove = (moveEvent: MouseEvent) => {
                      const deltaX = (moveEvent.clientX - startX) / posterZoom;
                      const deltaY = (moveEvent.clientY - startY) / posterZoom;
                      setPosterOffsetX(startOffsetX + deltaX);
                      setPosterOffsetY(startOffsetY + deltaY);
                    };

                    const handleMouseUp = () => {
                      document.removeEventListener('mousemove', handleMouseMove);
                      document.removeEventListener('mouseup', handleMouseUp);
                    };

                    document.addEventListener('mousemove', handleMouseMove);
                    document.addEventListener('mouseup', handleMouseUp);
                  }}
                  onWheel={(e) => {
                    e.preventDefault();
                    const zoomDirection = e.deltaY > 0 ? -0.1 : 0.1;
                    const newZoom = Math.max(1, Math.min(3, posterZoom + zoomDirection));
                    setPosterZoom(newZoom);
                  }}
                  onTouchStart={(e) => {
                    if (e.touches.length === 1) {
                      const touch = e.touches[0];
                      const startX = touch.clientX;
                      const startY = touch.clientY;
                      const startOffsetX = posterOffsetX;
                      const startOffsetY = posterOffsetY;

                      const handleTouchMove = (moveEvent: TouchEvent) => {
                        if (moveEvent.touches.length === 1) {
                          const moveTouch = moveEvent.touches[0];
                          const deltaX = (moveTouch.clientX - startX) / posterZoom;
                          const deltaY = (moveTouch.clientY - startY) / posterZoom;
                          setPosterOffsetX(startOffsetX + deltaX);
                          setPosterOffsetY(startOffsetY + deltaY);
                        }
                      };

                      const handleTouchEnd = () => {
                        document.removeEventListener('touchmove', handleTouchMove);
                        document.removeEventListener('touchend', handleTouchEnd);
                      };

                      document.addEventListener('touchmove', handleTouchMove, { passive: false });
                      document.addEventListener('touchend', handleTouchEnd);
                    } else if (e.touches.length === 2) {
                      const touch1 = e.touches[0];
                      const touch2 = e.touches[1];
                      const startDistance = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
                      const startZoom = posterZoom;

                      const handleTouchMove = (moveEvent: TouchEvent) => {
                        if (moveEvent.touches.length === 2) {
                          const moveTouch1 = moveEvent.touches[0];
                          const moveTouch2 = moveEvent.touches[1];
                          const currentDistance = Math.hypot(moveTouch1.clientX - moveTouch2.clientX, moveTouch1.clientY - moveTouch2.clientY);
                          const scale = currentDistance / startDistance;
                          const newZoom = Math.max(1, Math.min(3, startZoom * scale));
                          setPosterZoom(newZoom);
                        }
                      };

                      const handleTouchEnd = () => {
                        document.removeEventListener('touchmove', handleTouchMove);
                        document.removeEventListener('touchend', handleTouchEnd);
                      };

                      document.addEventListener('touchmove', handleTouchMove, { passive: false });
                      document.addEventListener('touchend', handleTouchEnd);
                    }
                  }}
                >
                  <img
                    src={posterImage}
                    alt="Crop preview"
                    className="w-full h-full object-cover select-none"
                    draggable={false}
                    style={{
                      transform: `translate(${posterOffsetX}px, ${posterOffsetY}px) scale(${posterZoom})`,
                      transformOrigin: 'center',
                      transition: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <p className="text-sm text-blue-200">
                  💡 Desktop: Drag to move • Scroll to zoom | Mobile: Touch drag to move • Pinch to zoom
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setShowPosterCrop(false);
                    setPosterImage(null);
                    setPosterZoom(1);
                    setPosterOffsetX(0);
                    setPosterOffsetY(0);
                  }}
                  className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePosterCropConfirm}
                  className="px-6 py-2.5 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-bold rounded-lg transition shadow-lg"
                >
                  ✓ Crop & Use
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Banner Crop Modal */}
      {showBannerCrop && bannerImage && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-b from-slate-900 to-black border border-white/20 rounded-2xl w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10 sticky top-0 bg-gradient-to-b from-slate-900">
              <div>
                <h2 className="text-2xl font-bold text-white">Crop Movie Banner</h2>
                <p className="text-sm text-slate-400 mt-1">Aspect Ratio: 16:9 | Drag to position • Zoom to scale</p>
              </div>
              <button
                onClick={() => {
                  setShowBannerCrop(false);
                  setBannerImage(null);
                  setBannerZoom(1);
                  setBannerOffsetX(0);
                  setBannerOffsetY(0);
                }}
                className="text-slate-400 hover:text-white hover:bg-white/10 p-2 rounded-lg transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Crop Preview Area */}
              <div className="relative mx-auto" style={{ width: '100%', maxWidth: '560px', aspectRatio: '16/9' }}>
                <div 
                  className="relative w-full h-full bg-black border-4 border-yellow-400/50 rounded-lg overflow-hidden cursor-grab active:cursor-grabbing touch-none"
                  onMouseDown={(e) => {
                    const startX = e.clientX;
                    const startY = e.clientY;
                    const startOffsetX = bannerOffsetX;
                    const startOffsetY = bannerOffsetY;

                    const handleMouseMove = (moveEvent: MouseEvent) => {
                      const deltaX = (moveEvent.clientX - startX) / bannerZoom;
                      const deltaY = (moveEvent.clientY - startY) / bannerZoom;
                      setBannerOffsetX(startOffsetX + deltaX);
                      setBannerOffsetY(startOffsetY + deltaY);
                    };

                    const handleMouseUp = () => {
                      document.removeEventListener('mousemove', handleMouseMove);
                      document.removeEventListener('mouseup', handleMouseUp);
                    };

                    document.addEventListener('mousemove', handleMouseMove);
                    document.addEventListener('mouseup', handleMouseUp);
                  }}
                  onWheel={(e) => {
                    e.preventDefault();
                    const zoomDirection = e.deltaY > 0 ? -0.1 : 0.1;
                    const newZoom = Math.max(1, Math.min(3, bannerZoom + zoomDirection));
                    setBannerZoom(newZoom);
                  }}
                  onTouchStart={(e) => {
                    if (e.touches.length === 1) {
                      const touch = e.touches[0];
                      const startX = touch.clientX;
                      const startY = touch.clientY;
                      const startOffsetX = bannerOffsetX;
                      const startOffsetY = bannerOffsetY;

                      const handleTouchMove = (moveEvent: TouchEvent) => {
                        if (moveEvent.touches.length === 1) {
                          const moveTouch = moveEvent.touches[0];
                          const deltaX = (moveTouch.clientX - startX) / bannerZoom;
                          const deltaY = (moveTouch.clientY - startY) / bannerZoom;
                          setBannerOffsetX(startOffsetX + deltaX);
                          setBannerOffsetY(startOffsetY + deltaY);
                        }
                      };

                      const handleTouchEnd = () => {
                        document.removeEventListener('touchmove', handleTouchMove);
                        document.removeEventListener('touchend', handleTouchEnd);
                      };

                      document.addEventListener('touchmove', handleTouchMove, { passive: false });
                      document.addEventListener('touchend', handleTouchEnd);
                    } else if (e.touches.length === 2) {
                      const touch1 = e.touches[0];
                      const touch2 = e.touches[1];
                      const startDistance = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
                      const startZoom = bannerZoom;

                      const handleTouchMove = (moveEvent: TouchEvent) => {
                        if (moveEvent.touches.length === 2) {
                          const moveTouch1 = moveEvent.touches[0];
                          const moveTouch2 = moveEvent.touches[1];
                          const currentDistance = Math.hypot(moveTouch1.clientX - moveTouch2.clientX, moveTouch1.clientY - moveTouch2.clientY);
                          const scale = currentDistance / startDistance;
                          const newZoom = Math.max(1, Math.min(3, startZoom * scale));
                          setBannerZoom(newZoom);
                        }
                      };

                      const handleTouchEnd = () => {
                        document.removeEventListener('touchmove', handleTouchMove);
                        document.removeEventListener('touchend', handleTouchEnd);
                      };

                      document.addEventListener('touchmove', handleTouchMove, { passive: false });
                      document.addEventListener('touchend', handleTouchEnd);
                    }
                  }}
                >
                  <img
                    src={bannerImage}
                    alt="Crop preview"
                    className="w-full h-full object-cover select-none"
                    draggable={false}
                    style={{
                      transform: `translate(${bannerOffsetX}px, ${bannerOffsetY}px) scale(${bannerZoom})`,
                      transformOrigin: 'center',
                      transition: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <p className="text-sm text-blue-200">
                  💡 Desktop: Drag to move • Scroll to zoom | Mobile: Touch drag to move • Pinch to zoom
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setShowBannerCrop(false);
                    setBannerImage(null);
                    setBannerZoom(1);
                    setBannerOffsetX(0);
                    setBannerOffsetY(0);
                  }}
                  className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBannerCropConfirm}
                  className="px-6 py-2.5 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-bold rounded-lg transition shadow-lg"
                >
                  ✓ Crop & Use
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <AdminBottomNavigation />
    </div>
  );
}
