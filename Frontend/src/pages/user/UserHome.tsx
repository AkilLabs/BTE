import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../hooks/useUser';
import UserNavbar from '../../components/UserNavbar';
import BottomNavigation from '../../components/BottomNavigation';
import MovieCard from '../../components/MovieCard';
import UserFooter from '../../components/UserFooter';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Types
type TrendingItem = { id: string; image_url: string; title?: string };
type Movie = { _id?: string; id?: number; title: string; image?: string; poster_url?: string };

export default function UserHome() {
  const navigate = useNavigate();
  const { user, loading, isAuthenticated } = useUser();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [currentTrendingIndex, setCurrentTrendingIndex] = useState(0);
  const [trendingImages, setTrendingImages] = useState<TrendingItem[]>([]);

  useEffect(() => {
    // Fetch trending images and recent movies from backend
    const API = 'http://68.183.80.191:8000/api';

    const fetchTrending = async () => {
      try {
        const res = await fetch(`${API}/admin/trending/`);
        if (!res.ok) throw new Error('Failed to load trending');
        const data = await res.json();
        setTrendingImages(data.trending || []);
      } catch (err) {
        console.error('Trending fetch error', err);
      }
    };

    const fetchRecentMovies = async () => {
      try {
        const res = await fetch(`${API}/get-movies/`);
        if (!res.ok) throw new Error('Failed to load movies');
        const data = await res.json();
        const moviesRaw = data.movies || [];
        // filter recent movies (is_recent flag)
        let recent = moviesRaw.filter((m: any) => m.is_recent);

        // If backend doesn't have any is_recent flags, fallback to newest movies by created_at/release_date
        if (!recent || recent.length === 0) {
          recent = moviesRaw.slice().sort((a: any, b: any) => {
            const ta = Date.parse(a.created_at || a.release_date || '') || 0;
            const tb = Date.parse(b.created_at || b.release_date || '') || 0;
            return tb - ta;
          }).slice(0, 8); // show up to 8 recent
        }

        const mapped = recent.map((m: any) => ({ _id: m._id, title: m.title, image: m.poster_url || m.image_url || '' }));
        setMovies(mapped);
      } catch (err) {
        console.error('Movies fetch error', err);
      }
    };

    fetchTrending();
    fetchRecentMovies();
  }, []);

  // Auto-slide carousel every 3.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTrendingIndex((prev) => (trendingImages.length ? (prev === trendingImages.length - 1 ? 0 : prev + 1) : 0));
    }, 3500);
    return () => clearInterval(interval);
  }, [trendingImages]);

  const handlePreviousTrending = () => {
    setCurrentTrendingIndex((prev) => (prev === 0 ? trendingImages.length - 1 : prev - 1));
  };

  const handleNextTrending = () => {
    setCurrentTrendingIndex((prev) => (prev === trendingImages.length - 1 ? 0 : prev + 1));
  };

  const handleSeeMore = () => {
    navigate('/movies');
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto">
        <UserNavbar />

        <main className="px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 pb-8 sm:pb-24 md:pb-8 md:pt-32">
          {/* Trending Carousel */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2">Trending Around You !</h3>
            </div>
            <div className="mb-8">
              <div className="h-0.5 w-full bg-slate-800 mb-4" />
              <div className="relative rounded-xl overflow-hidden border border-slate-800 shadow-lg group">
                {/* Carousel Image */}
                <img
                  src={trendingImages.length ? trendingImages[currentTrendingIndex]?.image_url : ''}
                  alt={trendingImages.length ? (trendingImages[currentTrendingIndex]?.title || `Trending ${currentTrendingIndex + 1}`) : 'Trending'}
                  className="w-full h-48 sm:h-64 md:h-96 object-cover transition-all duration-500"
                />

                {/* Previous Button */}
                <button
                  onClick={handlePreviousTrending}
                  className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full transition-all opacity-0 group-hover:opacity-100"
                >
                  <ChevronLeft size={20} className="sm:w-6 sm:h-6" />
                </button>

                {/* Next Button */}
                <button
                  onClick={handleNextTrending}
                  className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full transition-all opacity-0 group-hover:opacity-100"
                >
                  <ChevronRight size={20} className="sm:w-6 sm:h-6" />
                </button>

                {/* Carousel Indicators */}
                <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-2">
                  {trendingImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentTrendingIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all ${index === currentTrendingIndex ? 'bg-yellow-400 w-6' : 'bg-white/40'
                        }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Recent Movies - Grid */}
          <section className="mt-6 sm:mt-8">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xl sm:text-1xl md:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2">Recent Movies</h4>
              <button
                onClick={handleSeeMore}
                className="text-xs sm:text-sm font-semibold bg-yellow-400 text-black px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow hover:bg-yellow-500 transition-colors"
              >
                See More
              </button>
            </div>

            <div className="mt-4">
                                      <div className="h-0.5 w-full bg-slate-800 mb-4" />

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 sm:gap-5 md:gap-6 lg:gap-8">
                {movies.map((m) => (
                  <div key={m._id || m.id}>
                    <MovieCard movieId={m._id || String(m.id)} title={m.title} image={m.image || ''} />
                  </div>
                ))}
              </div>
            </div>
          </section>

        </main>
      </div>
      <UserFooter />
      <BottomNavigation />
    </div>
  );
}
