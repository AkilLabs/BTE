import { useEffect, useState } from 'react';
import UserNavbar from '../../components/UserNavbar';
import BottomNavigation from '../../components/BottomNavigation';
import MovieCard from '../../components/MovieCard';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

type Movie = { 
  _id: string; 
  title: string; 
  poster_url: string;
  image_url: string;
  banner_url: string;
  status: string;
};

const MOVIES_PER_PAGE = 12;
const API_URL = 'http://127.0.0.1:8000/api';

// // Movie poster URLs
// const moviePosters = [
//   'https://media-cache.cinematerial.com/p/500x/fsrcfxma/sk25-indian-movie-poster.jpg?v=1738154160',
//   'https://media-cache.cinematerial.com/p/500x/rim7jkfa/jana-nayagan-indian-movie-poster.jpg?v=1739966840',
//   'https://media-cache.cinematerial.com/p/500x/5yjmdctf/lik-love-insurance-kompany-indian-movie-poster.jpg?v=1740686943',
//   'https://media-cache.cinematerial.com/p/500x/otee0vmo/idly-kadai-indian-movie-poster.jpg?v=1736470603',
// ];

// // Mock movies data with random poster selection
// const allMockMovies: Movie[] = Array.from({ length: 48 }, (_, i) => {
//   const img = moviePosters[i % moviePosters.length];
//   return {
//     _id: String(i + 1),
//     title: `Movie ${i + 1}`,
//     poster_url: img,
//     image_url: img,
//     banner_url: img,
//     status: 'available',
//   } as Movie;
// });

export default function Movies() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/get-movies/`);
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();

        // Sort movies so the most recent appear first.
        // Prefer `created_at` (ISO string) if present, otherwise `release_date`.
        const moviesRaw = data.movies || [];
        const sorted = moviesRaw.slice().sort((a: any, b: any) => {
          const getTime = (m: any) => {
            if (m?.created_at) return Date.parse(m.created_at);
            if (m?.release_date) return Date.parse(m.release_date);
            return 0;
          };
          return getTime(b) - getTime(a);
        });

        setMovies(sorted);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch movies:', err);
        setError('Failed to load movies. Please try again later.');
        setMovies([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  // Filter movies based on search query
  const filteredMovies = movies.filter((movie) =>
    movie.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate pagination
  const totalPages = Math.ceil(filteredMovies.length / MOVIES_PER_PAGE);
  const startIndex = (currentPage - 1) * MOVIES_PER_PAGE;
  const endIndex = startIndex + MOVIES_PER_PAGE;
  const currentMovies = filteredMovies.slice(startIndex, endIndex);

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto">
        <UserNavbar />

        <main className="px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 pb-8 sm:pb-24 md:pb-8 md:pt-32">
          {/* Page Title */}
          <div className="mb-4 sm:mb-6 md:mb-8">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2">All Movies</h1>
            <p className="text-slate-400 text-xs sm:text-sm md:text-base">Discover and book tickets for your favorite movies</p>
          </div>

          {/* Search Bar */}
          <div className="mb-4 sm:mb-6 md:mb-8">
            <div className="relative">
              <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 sm:w-5 h-4 sm:h-5" />
              <input
                type="text"
                placeholder="Search movies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/20 border border-white/15 rounded-full px-9 sm:px-12 py-2 sm:py-3 text-xs sm:text-sm md:text-base text-white placeholder-slate-400 outline-none focus:border-white/30 focus:bg-white/25 caret-white transition duration-200"
              />
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12 sm:py-16">
              <p className="text-slate-400 text-sm sm:text-base md:text-lg">Loading movies...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="text-center py-12 sm:py-16">
              <p className="text-red-400 text-sm sm:text-base md:text-lg">{error}</p>
            </div>
          )}

          {/* Movies Grid */}
          {!loading && !error && currentMovies.length > 0 ? (
            <div className="mb-8 sm:mb-10 md:mb-12 pb-24">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 sm:gap-5 md:gap-6 lg:gap-8">
                {currentMovies.map((movie) => (
                  <MovieCard 
                    movieId={movie._id}
                    key={movie._id} 
                    title={movie.title} 
                    image={movie.poster_url || movie.image_url} 
                  />
                ))}
              </div>
            </div>
          ) : !loading && !error ? (
            <div className="text-center py-12 sm:py-16">
              <p className="text-slate-400 text-sm sm:text-base md:text-lg">No movies found matching your search</p>
            </div>
          ) : null}

          {/* Pagination */}
          {filteredMovies.length > 0 && (
            <div className="flex items-center justify-center gap-2 sm:gap-4">
              <button
                onClick={handlePrevious}
                disabled={currentPage === 1}
                className="flex items-center gap-2 px-3 sm:px-6 py-2 sm:py-3 border border-slate-600 rounded-full text-white text-xs sm:text-sm md:text-base hover:bg-white/10 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium whitespace-nowrap"
              >
                <ChevronLeft size={16} className="sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Previous</span>
              </button>

              <div className="flex items-center gap-1 sm:gap-2">
                {(() => {
                  // For mobile: show 3 page numbers around current page
                  const isMobile = window.innerWidth < 768;
                  let pages: number[] = [];
                  
                  if (isMobile) {
                    // Show current page ± 1, max 3 pages
                    const start = Math.max(1, currentPage - 1);
                    const end = Math.min(totalPages, start + 2);
                    pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);
                  } else {
                    // Show all pages on larger screens
                    pages = Array.from({ length: totalPages }, (_, i) => i + 1);
                  }
                  
                  return pages.map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full text-xs sm:text-sm font-medium transition duration-200 flex-shrink-0 ${
                        currentPage === page
                          ? 'bg-yellow-400 text-black'
                          : 'bg-white/8 border border-white/15 text-white hover:bg-white/12'
                      }`}
                    >
                      {page}
                    </button>
                  ));
                })()}
              </div>

              <button
                onClick={handleNext}
                disabled={currentPage === totalPages}
                className="flex items-center gap-2 px-3 sm:px-6 py-2 sm:py-3 bg-yellow-400 text-black rounded-full text-xs sm:text-sm md:text-base hover:bg-yellow-500 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-bold whitespace-nowrap"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight size={16} className="sm:w-5 sm:h-5" />
              </button>
            </div>
          )}
        </main>
      </div>
      <BottomNavigation />
    </div>
  );
}
