import { useEffect, useRef, useState } from 'react';
import AdminNavbar from './AdminNavbar';
import AdminBottomNavigation from './AdminBottomNavigation';
import { useToast } from '../../context/ToastContext';
import MovieCard from '../../components/MovieCard';
import { Star, UploadCloud, X, ChevronLeft, ChevronRight } from 'lucide-react';

const API_URL = 'http://127.0.0.1:8000/api';

type TrendingItem = {
    id: string;
    image_url: string;
    title?: string;
};

type Movie = {
    _id: string;
    title: string;
    poster_url?: string;
    is_recent?: boolean;
};

// Crop helpers (copied / simplified from NewMovie implementation)
const clampZoom = (value: number) => Math.max(1, Math.min(6, value));

type Size = { width: number; height: number };

const getImageSize = (src: string): Promise<Size> =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.src = src;
        image.onload = () => {
            resolve({ width: image.naturalWidth || image.width, height: image.naturalHeight || image.height });
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
    if (!imageSrc) return '';
    return new Promise((resolve) => {
        const image = new Image();
        image.src = imageSrc;
        image.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = outputSize.width;
            canvas.height = outputSize.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return resolve('');

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
    setOffsetX: (v: number) => void,
    setOffsetY: (v: number) => void
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
    setOffsetX: (v: number) => void,
    setOffsetY: (v: number) => void
) => {
    const startX = touch.clientX;
    const startY = touch.clientY;

    const handleTouchMove = (moveEvent: TouchEvent) => {
        if (moveEvent.touches.length !== 1) return;
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
        if (remainingTouches && remainingTouches.length > 0) return;
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', cleanup);
        document.removeEventListener('touchcancel', cleanup);
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', cleanup);
    document.addEventListener('touchcancel', cleanup);
};

const startTouchPinch = (touches: TouchList, getZoom: () => number, setZoom: (v: number) => void) => {
    const touch1 = touches[0];
    const touch2 = touches[1];
    const startDistance = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
    const initialZoom = getZoom();

    const handleTouchMove = (moveEvent: TouchEvent) => {
        if (moveEvent.touches.length !== 2) return;
        moveEvent.preventDefault();
        const moveTouch1 = moveEvent.touches[0];
        const moveTouch2 = moveEvent.touches[1];
        const currentDistance = Math.hypot(moveTouch1.clientX - moveTouch2.clientX, moveTouch1.clientY - moveTouch2.clientY);
        const scale = currentDistance / startDistance;
        setZoom(clampZoom(initialZoom * scale));
    };

    const cleanup = (event: Event) => {
        const remainingTouches = (event as TouchEvent).touches;
        if (remainingTouches && remainingTouches.length > 0) return;
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
}: {
    getZoom: () => number;
    setZoom: (v: number) => void;
    getOffsetX: () => number;
    getOffsetY: () => number;
    setOffsetX: (v: number) => void;
    setOffsetY: (v: number) => void;
    getBaseScale: () => number;
}) => ({
    onMouseDown: (event: React.MouseEvent<HTMLDivElement>) => {
        event.preventDefault();
        startMouseDrag(event.clientX, event.clientY, getOffsetX(), getOffsetY(), getZoom, getBaseScale, setOffsetX, setOffsetY);
    },
    onWheel: (event: React.WheelEvent<HTMLDivElement>) => {
        event.preventDefault();
        const direction = event.deltaY > 0 ? -0.1 : 0.1;
        setZoom((prev) => clampZoom(prev + direction));
    },
    onTouchStart: (event: React.TouchEvent<HTMLDivElement>) => {
        if (event.touches.length === 1) {
            event.preventDefault();
            startTouchDrag(event.touches[0], getOffsetX(), getOffsetY(), getZoom, getBaseScale, setOffsetX, setOffsetY);
        } else if (event.touches.length === 2) {
            event.preventDefault();
            startTouchPinch(event.touches, getZoom, setZoom);
        }
    },
});

export default function TrendingManagement() {
    const { showToast } = useToast();
    const [trending, setTrending] = useState<TrendingItem[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [movies, setMovies] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    // crop state
    const [showCrop, setShowCrop] = useState(false);
    const [cropSrc, setCropSrc] = useState<string | null>(null);
    const [cropZoom, setCropZoom] = useState(1);
    const [cropOffsetX, setCropOffsetX] = useState(0);
    const [cropOffsetY, setCropOffsetY] = useState(0);
    const [cropBaseScale, setCropBaseScale] = useState(1);
    const [cropImageSize, setCropImageSize] = useState<Size | null>(null);
    const [cropViewportSize, setCropViewportSize] = useState<Size | null>(null);
    const cropViewportRef = useRef<HTMLDivElement | null>(null);

    // confirmation modal state
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    const getAuthToken = (): string | null => {
        const match = typeof document !== 'undefined' ? document.cookie.match(/(?:^|; )jwt=([^;]+)/) : null;
        if (match && match[1]) return decodeURIComponent(match[1]);
        try {
            const t = localStorage.getItem('jwt') || localStorage.getItem('token');
            if (t) return t;
        } catch (e) { }
        return null;
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const resT = await fetch(`${API_URL}/admin/trending/`);
            const tdata = resT.ok ? await resT.json() : { trending: [] };
            const tList = tdata.trending || [];
            setTrending(tList);
            setCurrentIndex(0);

            const resM = await fetch(`${API_URL}/get-movies/`);
            const mdata = resM.ok ? await resM.json() : { movies: [] };
            setMovies(mdata.movies || []);
        } catch (err) {
            console.error('Failed to load trending/movies', err);
            showToast('Failed to load data', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (currentIndex >= trending.length) {
            setCurrentIndex(Math.max(0, trending.length - 1));
        }
    }, [trending, currentIndex]);

    // when crop viewport opens compute base scale
    useEffect(() => {
        if (!cropSrc) return;
        let cancelled = false;
        getImageSize(cropSrc)
            .then((size) => {
                if (cancelled) return;
                setCropImageSize(size);
            })
            .catch(() => setCropImageSize(null));
        return () => { cancelled = true; };
    }, [cropSrc]);

    useEffect(() => {
        if (!showCrop) { setCropViewportSize(null); return; }
        const update = () => {
            if (!cropViewportRef.current) return;
            const rect = cropViewportRef.current.getBoundingClientRect();
            if (rect.width && rect.height) setCropViewportSize({ width: rect.width, height: rect.height });
        };
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, [showCrop]);

    useEffect(() => {
        if (!cropImageSize || !cropViewportSize) return;
        const widthScale = cropViewportSize.width / cropImageSize.width;
        const heightScale = cropViewportSize.height / cropImageSize.height;
        const nextBaseScale = Math.max(Math.min(widthScale, heightScale), 0.01);
        setCropBaseScale(nextBaseScale);
        setCropOffsetX(0);
        setCropOffsetY(0);
        setCropZoom(1);
    }, [cropImageSize, cropViewportSize]);

    const cropHandlers = createCropInteractions({
        getZoom: () => cropZoom,
        setZoom: setCropZoom,
        getOffsetX: () => cropOffsetX,
        getOffsetY: () => cropOffsetY,
        setOffsetX: setCropOffsetX,
        setOffsetY: setCropOffsetY,
        getBaseScale: () => cropBaseScale,
    });

    const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            setCropSrc(result);
            setShowCrop(true);
        };
        reader.readAsDataURL(f);
        e.target.value = '';
    };

    const confirmCropAndUpload = async () => {
        if (!cropSrc || !cropViewportSize) return;
        const OUTPUT: Size = { width: 1600, height: 900 };
        const dataUrl = await getCroppedImageData(cropSrc, OUTPUT, cropBaseScale, cropZoom, cropOffsetX, cropOffsetY, cropViewportSize);
        if (!dataUrl) { showToast('Failed to crop image', 'error'); return; }

        // convert dataURL to blob
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const file = new File([blob], `trending_${Date.now()}.png`, { type: blob.type });

        // upload
        setUploading(true);
        try {
            const token = getAuthToken();
            const fd = new FormData();
            fd.append('image', file);
            fd.append('title', 'Trending Image');
            const r = await fetch(`${API_URL}/admin/trending/`, {
                method: 'POST',
                credentials: 'include',
                headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                body: fd,
            });
            if (!r.ok) throw new Error('Upload failed');
            showToast('Uploaded trending image', 'success');
            setShowCrop(false);
            setCropSrc(null);
            fetchData();
        } catch (err) {
            console.error(err);
            showToast('Failed to upload', 'error');
        } finally {
            setUploading(false);
        }
    };

    const onRemoveTrendingClick = (id: string) => {
        setDeleteConfirmId(id);
        setShowConfirmDelete(true);
    };

    const confirmDelete = async () => {
        if (!deleteConfirmId) return;
        try {
            const token = getAuthToken();
            const res = await fetch(`${API_URL}/admin/trending/${deleteConfirmId}/`, { 
                method: 'DELETE', 
                credentials: 'include', 
                headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } 
            });
            if (!res.ok) throw new Error('Delete failed');
            showToast('Removed', 'success');
            
            // Update state properly to avoid blank page
            setTrending((prevTrending) => {
                const updated = prevTrending.filter((t) => t.id !== deleteConfirmId);
                // Clamp currentIndex if needed
                if (currentIndex >= updated.length && updated.length > 0) {
                    setCurrentIndex(updated.length - 1);
                } else if (updated.length === 0) {
                    setCurrentIndex(0);
                }
                return updated;
            });
            
            setShowConfirmDelete(false);
            setDeleteConfirmId(null);
        } catch (err) {
            console.error(err);
            showToast('Failed to remove', 'error');
            setShowConfirmDelete(false);
            setDeleteConfirmId(null);
        }
    };

    const cancelDelete = () => {
        setShowConfirmDelete(false);
        setDeleteConfirmId(null);
    };

    const handleAfterDelete = () => {
        setShowConfirmDelete(false);
        setDeleteConfirmId(null);
        // Clamp currentIndex if it's out of bounds
        setCurrentIndex((prev) => {
            const newLength = trending.length > 0 ? trending.length - 1 : 0;
            return prev >= newLength ? Math.max(0, newLength - 1) : prev;
        });
    };

    const toggleMovieRecent = async (movieId: string, current: boolean | undefined) => {
        try {
            const token = getAuthToken();
            const res = await fetch(`${API_URL}/admin/movies/${movieId}/`, {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                body: JSON.stringify({ is_recent: !current }),
            });
            if (!res.ok) throw new Error('Failed');
            setMovies((p) => p.map((m) => (m._id === movieId ? { ...m, is_recent: !current } : m)));
        } catch (err) {
            console.error(err);
            showToast('Update failed', 'error');
        }
    };

    return (
        <div className="min-h-screen bg-black text-white">
            <div className="max-w-7xl mx-auto">
                <AdminNavbar />

                <main className="px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 pb-8 sm:pb-24 md:pb-8 md:pt-32">
                    {/* Top row - title + upload button top-right */}
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2">Trending Around You !</h3>
                        <div className="flex items-center gap-2">
                            <label htmlFor="trending-upload" className="inline-flex items-center gap-2 bg-yellow-400 text-black px-4 py-2 rounded-full hover:bg-yellow-500 cursor-pointer">
                                <UploadCloud />
                                <span className="hidden sm:inline font-bold">Upload</span>
                            </label>
                            <input id="trending-upload" type="file" accept="image/*" onChange={onFileSelected} className="hidden" />
                        </div>
                    </div>

                    {/* Carousel area (preview user POV) */}
                    <section>
                        <div className="mb-8">
                            <div className="h-0.5 w-full bg-slate-800 mb-4" />
                            <div className="relative rounded-xl overflow-hidden border border-slate-800 shadow-lg group">
                                {trending.length === 0 && !loading ? (
                                    <div className="w-full h-48 sm:h-64 md:h-96 flex items-center justify-center text-slate-500">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center text-yellow-400">
                                                <UploadCloud size={36} />
                                            </div>
                                            <div className="text-sm">No trending images yet. Click Upload to add.</div>
                                        </div>
                                    </div>
                                ) : (
                                    <img src={trending.length ? trending[currentIndex].image_url : ''} alt="trending preview" className="w-full h-48 sm:h-64 md:h-96 object-cover transition-all duration-500" />
                                )}

                                {trending.length > 1 && (
                                    <>
                                        <button
                                            onClick={() => setCurrentIndex((i) => (i - 1 + trending.length) % trending.length)}
                                            aria-label="previous"
                                            className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/60 p-2 rounded-full text-white hover:bg-black/70"
                                        >
                                            <ChevronLeft />
                                        </button>
                                        <button
                                            onClick={() => setCurrentIndex((i) => (i + 1) % trending.length)}
                                            aria-label="next"
                                            className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/60 p-2 rounded-full text-white hover:bg-black/70"
                                        >
                                            <ChevronRight />
                                        </button>
                                    </>
                                )}

                                {/* top-right remove/upload overlay (upload already top-right button) */}
                                <div className="absolute top-3 right-3 flex items-center gap-2">
                                    {/* show remove for current item as quick action */}
                                    {trending.length > 0 && (
                                        <button onClick={() => onRemoveTrendingClick(trending[currentIndex].id)} className="bg-black/60 text-white px-2 py-1 rounded-full text-xs hover:bg-black/80 transition">Remove</button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Recent Movies grid - show as user but with star overlay on card */}
                    <section className="mt-6 sm:mt-8">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-xl sm:text-1xl md:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2">Recent Movies</h4>
                        </div>
                        <div className="h-0.5 w-full bg-slate-800 mb-4" />
                        <div className="mt-4">
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 sm:gap-5 md:gap-6 lg:gap-8">
                                {movies.map((m) => (
                                    <div key={m._id} className="relative">
                                        <div className="relative">
                                            <MovieCard movieId={m._id} title={m.title} image={m.poster_url || ''} />
                                            <button
                                                onClick={() => toggleMovieRecent(m._id, m.is_recent)}
                                                aria-label="toggle recent"
                                                className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-sm ${m.is_recent ? 'bg-yellow-400 text-black' : 'bg-white/8 text-white'}`}
                                            >
                                                <Star size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                </main>

                <AdminBottomNavigation />
            </div>

            {/* Crop modal */}
            {showCrop && cropSrc && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-gradient-to-b from-slate-900 to-black border border-white/20 rounded-2xl w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-4 border-b border-white/10 sticky top-0 bg-gradient-to-b from-slate-900">
                            <div className="text-lg font-semibold">Crop Trending Image</div>
                            <div className="flex items-center gap-2">
                                <button className="px-3 py-2 rounded-md text-white/80" onClick={() => { setShowCrop(false); setCropSrc(null); }}><X /></button>
                                <button onClick={confirmCropAndUpload} className="bg-yellow-400 text-black px-4 py-2 rounded-full">{uploading ? 'Uploading...' : 'Upload'}</button>
                            </div>
                        </div>

                        <div className="p-4">
                            <div ref={cropViewportRef} className="w-full h-96 bg-black/30 rounded-md overflow-hidden touch-none" {...(cropHandlers as any)}>
                                <img src={cropSrc} alt="crop" className="w-full h-full object-contain" style={{ transform: `translate(${cropOffsetX}px, ${cropOffsetY}px) scale(${cropZoom})` }} />
                            </div>
                            <div className="mt-4 flex items-center gap-3">
                                <label className="text-sm text-slate-400">Zoom</label>
                                <input type="range" min={1} max={6} step={0.01} value={cropZoom} onChange={(e) => setCropZoom(Number(e.target.value))} className="w-full" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {showConfirmDelete && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1c1c1c] border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl">
                        <div className="flex items-center justify-between p-6 border-b border-white/10">
                            <div className="text-lg font-semibold text-white">Confirm Delete</div>
                            <button className="text-white/60 hover:text-white transition" onClick={cancelDelete}><X /></button>
                        </div>

                        <div className="p-6">
                            <p className="text-white/80 mb-6">Are you sure you want to remove this trending image? This action cannot be undone.</p>
                            <div className="flex gap-3 justify-end">
                                <button 
                                    onClick={cancelDelete}
                                    className="px-6 py-2 rounded-full border border-slate-600 text-white hover:bg-white/10 transition font-medium"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={confirmDelete}
                                    className="px-6 py-2 rounded-full bg-yellow-400 hover:bg-yellow-500 text-black transition font-bold"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
