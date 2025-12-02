import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type Dispatch,
  type MouseEvent as ReactMouseEvent,
  type SetStateAction,
  type TouchEvent as ReactTouchEvent,
  type WheelEvent as ReactWheelEvent,
} from 'react';
import { useToast } from '../../context/ToastContext';
import { Upload, X } from 'lucide-react';
import AdminNavbar from './AdminNavbar';
import AdminBottomNavigation from './AdminBottomNavigation';

const GRID_OVERLAY_STYLE: CSSProperties = {
  backgroundImage:
    'linear-gradient(to right, rgba(255, 255, 255, 0.25) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.25) 1px, transparent 1px)',
  backgroundSize: '40px 40px',
  opacity: 0.6,
  pointerEvents: 'none',
};

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

interface StoredMovieFormState {
  formData: MovieFormData;
  posterOriginalImage: string | null;
  bannerOriginalImage: string | null;
}

type Size = { width: number; height: number };

type CropInteractionOptions = {
  getZoom: () => number;
  setZoom: Dispatch<SetStateAction<number>>;
  getOffsetX: () => number;
  getOffsetY: () => number;
  setOffsetX: Dispatch<SetStateAction<number>>;
  setOffsetY: Dispatch<SetStateAction<number>>;
  getBaseScale: () => number;
};

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

const POSTER_CROP_SIZE: Size = { width: 900, height: 1200 };
const BANNER_CROP_SIZE: Size = { width: 1600, height: 900 };
const FORM_STORAGE_KEY = 'haaka-admin-new-movie';

const clampZoom = (value: number) => Math.max(1, Math.min(6, value));

const createEmptyFormData = (): MovieFormData => ({
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

const loadStoredState = (): StoredMovieFormState | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(FORM_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<StoredMovieFormState> | null;
    if (!parsed || !parsed.formData) {
      return null;
    }

    const mergedFormData: MovieFormData = {
      ...createEmptyFormData(),
      ...parsed.formData,
      genre: Array.isArray(parsed.formData.genre)
        ? parsed.formData.genre.filter((item): item is string => typeof item === 'string')
        : [],
    };

    return {
      formData: mergedFormData,
      posterOriginalImage: typeof parsed.posterOriginalImage === 'string' ? parsed.posterOriginalImage : null,
      bannerOriginalImage: typeof parsed.bannerOriginalImage === 'string' ? parsed.bannerOriginalImage : null,
    };
  } catch (error) {
    console.error('Failed to load stored movie form state', error);
    return null;
  }
};

const getImageSize = (src: string): Promise<Size> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.src = src;
    image.onload = () => {
      resolve({
        width: image.naturalWidth || image.width,
        height: image.naturalHeight || image.height,
      });
    };
    image.onerror = () => reject(new Error('Failed to load image'));
  });

const getCroppedImageData = async (
  imageSrc: string,
  outputSize: Size,
  baseScale: number,
  zoom: number,
  offsetX: number,
  offsetY: number,
  viewportSize: Size
): Promise<string> => {
  if (!imageSrc) {
    return '';
  }

  return new Promise((resolve) => {
    const image = new Image();
    image.src = imageSrc;
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = outputSize.width;
      canvas.height = outputSize.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve('');
        return;
      }

      const viewportWidth = viewportSize.width || outputSize.width;
      const viewportHeight = viewportSize.height || outputSize.height;
      const displayToOutputScaleX = outputSize.width / viewportWidth;
      const displayToOutputScaleY = outputSize.height / viewportHeight;
      const effectiveScaleX = Math.max(baseScale, 0.01) * zoom * displayToOutputScaleX;
      const effectiveScaleY = Math.max(baseScale, 0.01) * zoom * displayToOutputScaleY;

      const drawWidth = image.width * effectiveScaleX;
      const drawHeight = image.height * effectiveScaleY;
      const drawX = outputSize.width / 2 - drawWidth / 2 + offsetX * effectiveScaleX;
      const drawY = outputSize.height / 2 - drawHeight / 2 + offsetY * effectiveScaleY;

      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, outputSize.width, outputSize.height);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);

      resolve(canvas.toDataURL());
    };
    image.onerror = () => resolve('');
  });
};

const startMouseDrag = (
  startX: number,
  startY: number,
  startOffsetX: number,
  startOffsetY: number,
  getZoom: () => number,
  getBaseScale: () => number,
  setOffsetX: Dispatch<SetStateAction<number>>,
  setOffsetY: Dispatch<SetStateAction<number>>
) => {
  const handleMouseMove = (moveEvent: MouseEvent) => {
    moveEvent.preventDefault();
    const scaleFactor = Math.max(getZoom() * getBaseScale(), 0.01);
    const deltaX = (moveEvent.clientX - startX) / scaleFactor;
    const deltaY = (moveEvent.clientY - startY) / scaleFactor;
    setOffsetX(startOffsetX + deltaX);
    setOffsetY(startOffsetY + deltaY);
  };

  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
};

const startTouchDrag = (
  touch: Touch,
  startOffsetX: number,
  startOffsetY: number,
  getZoom: () => number,
  getBaseScale: () => number,
  setOffsetX: Dispatch<SetStateAction<number>>,
  setOffsetY: Dispatch<SetStateAction<number>>
) => {
  const startX = touch.clientX;
  const startY = touch.clientY;

  const handleTouchMove = (moveEvent: TouchEvent) => {
    if (moveEvent.touches.length !== 1) {
      return;
    }
    moveEvent.preventDefault();
    const moveTouch = moveEvent.touches[0];
    const scaleFactor = Math.max(getZoom() * getBaseScale(), 0.01);
    const deltaX = (moveTouch.clientX - startX) / scaleFactor;
    const deltaY = (moveTouch.clientY - startY) / scaleFactor;
    setOffsetX(startOffsetX + deltaX);
    setOffsetY(startOffsetY + deltaY);
  };

  const cleanup = (event: Event) => {
    const remainingTouches = (event as TouchEvent).touches;
    if (remainingTouches && remainingTouches.length > 0) {
      return;
    }
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', cleanup);
    document.removeEventListener('touchcancel', cleanup);
  };

  document.addEventListener('touchmove', handleTouchMove, { passive: false });
  document.addEventListener('touchend', cleanup);
  document.addEventListener('touchcancel', cleanup);
};

const startTouchPinch = (
  touches: TouchList,
  getZoom: () => number,
  setZoom: Dispatch<SetStateAction<number>>
) => {
  const touch1 = touches[0];
  const touch2 = touches[1];
  const startDistance = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
  const initialZoom = getZoom();

  const handleTouchMove = (moveEvent: TouchEvent) => {
    if (moveEvent.touches.length !== 2) {
      return;
    }
    moveEvent.preventDefault();
    const moveTouch1 = moveEvent.touches[0];
    const moveTouch2 = moveEvent.touches[1];
    const currentDistance = Math.hypot(moveTouch1.clientX - moveTouch2.clientX, moveTouch1.clientY - moveTouch2.clientY);
    const scale = currentDistance / startDistance;
    setZoom(clampZoom(initialZoom * scale));
  };

  const cleanup = (event: Event) => {
    const remainingTouches = (event as TouchEvent).touches;
    if (remainingTouches && remainingTouches.length > 0) {
      return;
    }
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', cleanup);
    document.removeEventListener('touchcancel', cleanup);
  };

  document.addEventListener('touchmove', handleTouchMove, { passive: false });
  document.addEventListener('touchend', cleanup);
  document.addEventListener('touchcancel', cleanup);
};

const createCropInteractions = ({
  getZoom,
  setZoom,
  getOffsetX,
  getOffsetY,
  setOffsetX,
  setOffsetY,
  getBaseScale,
}: CropInteractionOptions) => ({
  onMouseDown: (event: ReactMouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    startMouseDrag(
      event.clientX,
      event.clientY,
      getOffsetX(),
      getOffsetY(),
      getZoom,
      getBaseScale,
      setOffsetX,
      setOffsetY
    );
  },
  onWheel: (event: ReactWheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const direction = event.deltaY > 0 ? -0.1 : 0.1;
    setZoom((prev) => clampZoom(prev + direction));
  },
  onTouchStart: (event: ReactTouchEvent<HTMLDivElement>) => {
    if (event.touches.length === 1) {
      event.preventDefault();
      const touch = event.touches[0];
      startTouchDrag(
        touch,
        getOffsetX(),
        getOffsetY(),
        getZoom,
        getBaseScale,
        setOffsetX,
        setOffsetY
      );
    } else if (event.touches.length === 2) {
      event.preventDefault();
      startTouchPinch(event.touches, getZoom, setZoom);
    }
  },
});

export default function NewMovie() {
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [genreInput, setGenreInput] = useState('');
  const [showGenreDropdown, setShowGenreDropdown] = useState(false);
  const [showCensorshipDropdown, setShowCensorshipDropdown] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [formData, setFormData] = useState<MovieFormData>(() => createEmptyFormData());

  const [showPosterCrop, setShowPosterCrop] = useState(false);
  const [posterImage, setPosterImage] = useState<string | null>(null);
  const [posterOriginalImage, setPosterOriginalImage] = useState<string | null>(null);
  const [posterZoom, setPosterZoom] = useState(1);
  const [posterOffsetX, setPosterOffsetX] = useState(0);
  const [posterOffsetY, setPosterOffsetY] = useState(0);
  const [posterBaseScale, setPosterBaseScale] = useState(1);
  const [posterImageSize, setPosterImageSize] = useState<Size | null>(null);
  const [posterViewportSize, setPosterViewportSize] = useState<Size | null>(null);

  const [showBannerCrop, setShowBannerCrop] = useState(false);
  const [bannerImage, setBannerImage] = useState<string | null>(null);
  const [bannerOriginalImage, setBannerOriginalImage] = useState<string | null>(null);
  const [bannerZoom, setBannerZoom] = useState(1);
  const [bannerOffsetX, setBannerOffsetX] = useState(0);
  const [bannerOffsetY, setBannerOffsetY] = useState(0);
  const [bannerBaseScale, setBannerBaseScale] = useState(1);
  const [bannerImageSize, setBannerImageSize] = useState<Size | null>(null);
  const [bannerViewportSize, setBannerViewportSize] = useState<Size | null>(null);

  const genreRef = useRef<HTMLDivElement | null>(null);
  const censorshipRef = useRef<HTMLDivElement | null>(null);
  const languageRef = useRef<HTMLDivElement | null>(null);
  const posterViewportRef = useRef<HTMLDivElement | null>(null);
  const bannerViewportRef = useRef<HTMLDivElement | null>(null);
  const skipNextPersist = useRef(false);

  const VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  useEffect(() => {
    const storedState = loadStoredState();
    if (!storedState) {
      return;
    }

    setFormData(storedState.formData);
    setPosterOriginalImage(storedState.posterOriginalImage);
    setBannerOriginalImage(storedState.bannerOriginalImage);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (genreRef.current && !genreRef.current.contains(target)) {
        setShowGenreDropdown(false);
      }
      if (censorshipRef.current && !censorshipRef.current.contains(target)) {
        setShowCensorshipDropdown(false);
      }
      if (languageRef.current && !languageRef.current.contains(target)) {
        setShowLanguageDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (skipNextPersist.current) {
      skipNextPersist.current = false;
      return;
    }

    const payload: StoredMovieFormState = {
      formData,
      posterOriginalImage,
      bannerOriginalImage,
    };

    try {
      window.localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.error('Failed to persist movie form state', error);
    }
  }, [formData, posterOriginalImage, bannerOriginalImage]);

  useEffect(() => {
    if (!posterImage) {
      setPosterImageSize(null);
      return;
    }

    let cancelled = false;
    getImageSize(posterImage)
      .then((size) => {
        if (!cancelled) {
          setPosterImageSize(size);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPosterImageSize(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [posterImage]);

  useEffect(() => {
    if (!bannerImage) {
      setBannerImageSize(null);
      return;
    }

    let cancelled = false;
    getImageSize(bannerImage)
      .then((size) => {
        if (!cancelled) {
          setBannerImageSize(size);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBannerImageSize(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [bannerImage]);

  useEffect(() => {
    if (!showPosterCrop) {
      setPosterViewportSize(null);
      return;
    }

    const updateViewport = () => {
      if (!posterViewportRef.current) {
        return;
      }
      const rect = posterViewportRef.current.getBoundingClientRect();
      if (rect.width && rect.height) {
        setPosterViewportSize({ width: rect.width, height: rect.height });
      }
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, [showPosterCrop, posterImage]);

  useEffect(() => {
    if (!showBannerCrop) {
      setBannerViewportSize(null);
      return;
    }

    const updateViewport = () => {
      if (!bannerViewportRef.current) {
        return;
      }
      const rect = bannerViewportRef.current.getBoundingClientRect();
      if (rect.width && rect.height) {
        setBannerViewportSize({ width: rect.width, height: rect.height });
      }
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, [showBannerCrop, bannerImage]);

  useEffect(() => {
    if (!posterImage || !posterImageSize || !posterViewportSize) {
      return;
    }
    const widthScale = posterViewportSize.width / posterImageSize.width;
    const heightScale = posterViewportSize.height / posterImageSize.height;
    const nextBaseScale = Math.max(Math.min(widthScale, heightScale), 0.01);
    setPosterBaseScale(nextBaseScale);
    setPosterOffsetX(0);
    setPosterOffsetY(0);
    setPosterZoom(1);
  }, [posterImage, posterImageSize, posterViewportSize]);

  useEffect(() => {
    if (!bannerImage || !bannerImageSize || !bannerViewportSize) {
      return;
    }
    const widthScale = bannerViewportSize.width / bannerImageSize.width;
    const heightScale = bannerViewportSize.height / bannerImageSize.height;
    const nextBaseScale = Math.max(Math.min(widthScale, heightScale), 0.01);
    setBannerBaseScale(nextBaseScale);
    setBannerOffsetX(0);
    setBannerOffsetY(0);
    setBannerZoom(1);
  }, [bannerImage, bannerImageSize, bannerViewportSize]);

  const posterCropHandlers = createCropInteractions({
    getZoom: () => posterZoom,
    setZoom: setPosterZoom,
    getOffsetX: () => posterOffsetX,
    getOffsetY: () => posterOffsetY,
    setOffsetX: setPosterOffsetX,
    setOffsetY: setPosterOffsetY,
    getBaseScale: () => posterBaseScale,
  });

  const bannerCropHandlers = createCropInteractions({
    getZoom: () => bannerZoom,
    setZoom: setBannerZoom,
    getOffsetX: () => bannerOffsetX,
    getOffsetY: () => bannerOffsetY,
    setOffsetX: setBannerOffsetX,
    setOffsetY: setBannerOffsetY,
    getBaseScale: () => bannerBaseScale,
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const filteredGenres = GENRE_OPTIONS.filter(
    (g) => g.toLowerCase().includes(genreInput.toLowerCase()) && !formData.genre.includes(g)
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

  const handlePosterImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setPosterOriginalImage(result);
      setPosterImage(result);
      setPosterZoom(1);
      setPosterOffsetX(0);
      setPosterOffsetY(0);
      setPosterBaseScale(1);
      setPosterImageSize(null);
      setPosterViewportSize(null);
      setShowPosterCrop(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleBannerImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setBannerOriginalImage(result);
      setBannerImage(result);
      setBannerZoom(1);
      setBannerOffsetX(0);
      setBannerOffsetY(0);
      setBannerBaseScale(1);
      setBannerImageSize(null);
      setBannerViewportSize(null);
      setShowBannerCrop(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handlePosterCropConfirm = async () => {
    if (!posterImage) {
      return;
    }

    const viewport = posterViewportSize ?? POSTER_CROP_SIZE;
    const croppedImage = await getCroppedImageData(
      posterImage,
      POSTER_CROP_SIZE,
      posterBaseScale,
      posterZoom,
      posterOffsetX,
      posterOffsetY,
      viewport
    );

    if (!croppedImage) {
      showToast('Unable to crop poster image. Please try again.', 'error');
      return;
    }

    setFormData((prev) => ({ ...prev, posterUrl: croppedImage }));
    setShowPosterCrop(false);
    setPosterImage(null);
    setPosterZoom(1);
    setPosterOffsetX(0);
    setPosterOffsetY(0);
    setPosterBaseScale(1);
    setPosterImageSize(null);
    setPosterViewportSize(null);
    showToast('Poster set successfully', 'success');
  };

  const handleBannerCropConfirm = async () => {
    if (!bannerImage) {
      return;
    }

    const viewport = bannerViewportSize ?? BANNER_CROP_SIZE;
    const croppedImage = await getCroppedImageData(
      bannerImage,
      BANNER_CROP_SIZE,
      bannerBaseScale,
      bannerZoom,
      bannerOffsetX,
      bannerOffsetY,
      viewport
    );

    if (!croppedImage) {
      showToast('Unable to crop banner image. Please try again.', 'error');
      return;
    }

    setFormData((prev) => ({ ...prev, bannerUrl: croppedImage }));
    setShowBannerCrop(false);
    setBannerImage(null);
    setBannerZoom(1);
    setBannerOffsetX(0);
    setBannerOffsetY(0);
    setBannerBaseScale(1);
    setBannerImageSize(null);
    setBannerViewportSize(null);
    showToast('Banner set successfully', 'success');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setShowCensorshipDropdown(false);
    setShowLanguageDropdown(false);
    setShowGenreDropdown(false);

    try {
      if (!formData.title || formData.genre.length === 0 || !formData.duration || !formData.releaseDate) {
        showToast('Please fill in all required fields', 'error');
        return;
      }

      const response = await fetch(`${VITE_API_URL}/api/add-movie/`, {
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
        return;
      }

      showToast('Movie added successfully! 🎬', 'success');

      skipNextPersist.current = true;
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.removeItem(FORM_STORAGE_KEY);
        } catch (error) {
          console.error('Failed to clear stored movie form state', error);
        }
      }

      setFormData(createEmptyFormData());
      setShowPosterCrop(false);
      setShowBannerCrop(false);
      setPosterOriginalImage(null);
      setBannerOriginalImage(null);
      setPosterImage(null);
      setBannerImage(null);
      setPosterZoom(1);
      setPosterOffsetX(0);
      setPosterOffsetY(0);
      setBannerZoom(1);
      setBannerOffsetX(0);
      setBannerOffsetY(0);
      setPosterBaseScale(1);
      setBannerBaseScale(1);
      setPosterImageSize(null);
      setBannerImageSize(null);
      setPosterViewportSize(null);
      setBannerViewportSize(null);
    } catch (error) {
      showToast('An error occurred. Please try again.', 'error');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <AdminNavbar />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-8 md:pt-24 pb-24 md:pb-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Create Movies</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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

          <div>
            <label className="block text-white text-sm font-semibold mb-3">Movie Poster (Card Ratio 3:4):</label>
            <div
              className="relative w-full md:max-w-sm lg:max-w-md mx-auto md:mx-0"
              style={{ aspectRatio: '3 / 4' }}
            >
              {!formData.posterUrl ? (
                <label className="absolute inset-0 border-2 border-dashed border-white/30 rounded-xl flex flex-col items-center justify-center gap-3 bg-black/40 hover:border-yellow-400/80 hover:bg-black/30 transition cursor-pointer">
                  <Upload className="w-10 h-10 text-slate-300" />
                  <div className="text-center">
                    <p className="text-white font-semibold">Select Poster</p>
                    <p className="text-slate-300 text-xs">Tap to upload and crop</p>
                  </div>
                  <input
                    type="file"
                    onChange={handlePosterImageChange}
                    accept="image/*"
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="absolute inset-0 rounded-xl overflow-hidden">
                  <img
                    src={formData.posterUrl}
                    alt="Poster"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 border border-yellow-400/70 pointer-events-none rounded-xl" />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50 opacity-100 md:opacity-0 md:hover:opacity-100 transition flex flex-col justify-end p-4 gap-2">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const sourceImage = posterOriginalImage ?? formData.posterUrl;
                          if (sourceImage) {
                            setPosterImage(sourceImage);
                            setPosterZoom(1);
                            setPosterOffsetX(0);
                            setPosterOffsetY(0);
                            setPosterBaseScale(1);
                            setPosterImageSize(null);
                            setPosterViewportSize(null);
                            setShowPosterCrop(true);
                          }
                        }}
                        className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold rounded-lg transition"
                      >
                        Edit Crop
                      </button>
                      <label className="px-4 py-2 bg-white/90 hover:bg-white text-black font-semibold rounded-lg transition cursor-pointer">
                        Replace
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePosterImageChange}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, posterUrl: '' }));
                          setPosterOriginalImage(null);
                          setPosterImage(null);
                          setPosterZoom(1);
                          setPosterOffsetX(0);
                          setPosterOffsetY(0);
                          setPosterBaseScale(1);
                          setPosterImageSize(null);
                          setPosterViewportSize(null);
                        }}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-white text-sm font-semibold mb-3">Movie Banner (Landscape 16:9):</label>
            <div
              className="relative w-full md:max-w-3xl mx-auto md:mx-0"
              style={{ aspectRatio: '16 / 9' }}
            >
              {!formData.bannerUrl ? (
                <label className="absolute inset-0 border-2 border-dashed border-white/30 rounded-xl flex flex-col items-center justify-center gap-3 bg-black/40 hover:border-yellow-400/80 hover:bg-black/30 transition cursor-pointer">
                  <Upload className="w-10 h-10 text-slate-300" />
                  <div className="text-center">
                    <p className="text-white font-semibold">Select Banner</p>
                    <p className="text-slate-300 text-xs">Tap to upload and crop</p>
                  </div>
                  <input
                    type="file"
                    onChange={handleBannerImageChange}
                    accept="image/*"
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="absolute inset-0 rounded-xl overflow-hidden">
                  <img
                    src={formData.bannerUrl}
                    alt="Banner"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 border border-yellow-400/70 pointer-events-none rounded-xl" />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50 opacity-100 md:opacity-0 md:hover:opacity-100 transition flex flex-col justify-end p-4 gap-2">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const sourceImage = bannerOriginalImage ?? formData.bannerUrl;
                          if (sourceImage) {
                            setBannerImage(sourceImage);
                            setBannerZoom(1);
                            setBannerOffsetX(0);
                            setBannerOffsetY(0);
                            setBannerBaseScale(1);
                            setBannerImageSize(null);
                            setBannerViewportSize(null);
                            setShowBannerCrop(true);
                          }
                        }}
                        className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold rounded-lg transition"
                      >
                        Edit Crop
                      </button>
                      <label className="px-4 py-2 bg-white/90 hover:bg-white text-black font-semibold rounded-lg transition cursor-pointer">
                        Replace
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleBannerImageChange}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, bannerUrl: '' }));
                          setBannerOriginalImage(null);
                          setBannerImage(null);
                          setBannerZoom(1);
                          setBannerOffsetX(0);
                          setBannerOffsetY(0);
                          setBannerBaseScale(1);
                          setBannerImageSize(null);
                          setBannerViewportSize(null);
                        }}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

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

      {showPosterCrop && posterImage && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-b from-slate-900 to-black border border-white/20 rounded-2xl w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
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
                  setPosterBaseScale(1);
                  setPosterImageSize(null);
                  setPosterViewportSize(null);
                }}
                className="text-slate-400 hover:text-white hover:bg-white/10 p-2 rounded-lg transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div
                className="relative mx-auto w-full"
                style={{ width: 'min(100%, 320px)', aspectRatio: '3 / 4' }}
              >
                <div
                  ref={posterViewportRef}
                  className="relative w-full h-full bg-black border-4 border-yellow-400/50 rounded-lg overflow-hidden cursor-grab active:cursor-grabbing touch-none"
                  onMouseDown={posterCropHandlers.onMouseDown}
                  onWheel={posterCropHandlers.onWheel}
                  onTouchStart={posterCropHandlers.onTouchStart}
                >
                  {(posterImageSize || posterViewportSize) && (
                    <img
                      src={posterImage}
                      alt="Crop preview"
                      className="absolute top-1/2 left-1/2 max-w-none select-none pointer-events-none"
                      draggable={false}
                      style={{
                        width: `${(posterImageSize ?? POSTER_CROP_SIZE).width}px`,
                        height: `${(posterImageSize ?? POSTER_CROP_SIZE).height}px`,
                        transform: `translate(-50%, -50%) translate(${posterOffsetX}px, ${posterOffsetY}px) scale(${posterBaseScale * posterZoom})`,
                        transformOrigin: 'center',
                        transition: 'none',
                      }}
                    />
                  )}
                  <div className="absolute inset-0 rounded-lg" style={GRID_OVERLAY_STYLE} />
                  <div className="absolute inset-0 rounded-lg border-2 border-yellow-300/80 pointer-events-none" />
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <p className="text-sm text-blue-200">
                  💡 Desktop: Drag to move • Scroll to zoom | Mobile: Touch drag to move • Pinch to zoom
                </p>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setShowPosterCrop(false);
                    setPosterImage(null);
                    setPosterZoom(1);
                    setPosterOffsetX(0);
                    setPosterOffsetY(0);
                    setPosterBaseScale(1);
                    setPosterImageSize(null);
                    setPosterViewportSize(null);
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

      {showBannerCrop && bannerImage && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-b from-slate-900 to-black border border-white/20 rounded-2xl w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-y-auto">
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
                  setBannerBaseScale(1);
                  setBannerImageSize(null);
                  setBannerViewportSize(null);
                }}
                className="text-slate-400 hover:text-white hover:bg-white/10 p-2 rounded-lg transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div
                className="relative mx-auto w-full"
                style={{ width: 'min(100%, 560px)', aspectRatio: '16 / 9' }}
              >
                <div
                  ref={bannerViewportRef}
                  className="relative w-full h-full bg-black border-4 border-yellow-400/50 rounded-lg overflow-hidden cursor-grab active:cursor-grabbing touch-none"
                  onMouseDown={bannerCropHandlers.onMouseDown}
                  onWheel={bannerCropHandlers.onWheel}
                  onTouchStart={bannerCropHandlers.onTouchStart}
                >
                  {(bannerImageSize || bannerViewportSize) && (
                    <img
                      src={bannerImage}
                      alt="Crop preview"
                      className="absolute top-1/2 left-1/2 max-w-none select-none pointer-events-none"
                      draggable={false}
                      style={{
                        width: `${(bannerImageSize ?? BANNER_CROP_SIZE).width}px`,
                        height: `${(bannerImageSize ?? BANNER_CROP_SIZE).height}px`,
                        transform: `translate(-50%, -50%) translate(${bannerOffsetX}px, ${bannerOffsetY}px) scale(${bannerBaseScale * bannerZoom})`,
                        transformOrigin: 'center',
                        transition: 'none',
                      }}
                    />
                  )}
                  <div className="absolute inset-0 rounded-lg" style={GRID_OVERLAY_STYLE} />
                  <div className="absolute inset-0 rounded-lg border-2 border-yellow-300/80 pointer-events-none" />
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <p className="text-sm text-blue-200">
                  💡 Desktop: Drag to move • Scroll to zoom | Mobile: Touch drag to move • Pinch to zoom
                </p>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setShowBannerCrop(false);
                    setBannerImage(null);
                    setBannerZoom(1);
                    setBannerOffsetX(0);
                    setBannerOffsetY(0);
                    setBannerBaseScale(1);
                    setBannerImageSize(null);
                    setBannerViewportSize(null);
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
