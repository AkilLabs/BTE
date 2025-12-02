import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../hooks/useUser';
import UserNavbar from '../../components/UserNavbar';
import BottomNavigation from '../../components/BottomNavigation';
import MovieCard from '../../components/MovieCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Trending carousel images
const trendingImages = [
  'https://images.filmibeat.com/img/2025/03/jananayaganmain-1742791702.jpg',
  'https://webneel.com/daily/sites/default/files/images/daily/01-2019/6-movie-poster-design-kollywood-tamil-imaikanodigal-prathoolnt.jpg',
  'https://images.ottplay.com/images/sj-suryah-1722082237.jpg?impolicy=ottplay-202501_high&width=350&height=200',
];

// Movie poster URLs for Recent Movies
const moviePosters = [
  'https://media-cache.cinematerial.com/p/500x/fsrcfxma/sk25-indian-movie-poster.jpg?v=1738154160',
  'https://media-cache.cinematerial.com/p/500x/rim7jkfa/jana-nayagan-indian-movie-poster.jpg?v=1739966840',
  'https://media-cache.cinematerial.com/p/500x/5yjmdctf/lik-love-insurance-kompany-indian-movie-poster.jpg?v=1740686943',
  'https://media-cache.cinematerial.com/p/500x/otee0vmo/idly-kadai-indian-movie-poster.jpg?v=1736470603',
];

type Movie = { id: number; title: string; image: string };

const initialMockMovies: Movie[] = [
  { id: 1, title: 'Movie 1', image: moviePosters[0] },
  { id: 2, title: 'Movie 2', image: moviePosters[1] },
  { id: 3, title: 'Movie 3', image: moviePosters[2] },
  { id: 4, title: 'Movie 4', image: moviePosters[3] },
  { id: 5, title: 'Movie 5', image: moviePosters[0] },
  { id: 6, title: 'Movie 6', image: moviePosters[1] },
  { id: 7, title: 'Movie 7', image: moviePosters[2] },
  { id: 8, title: 'Movie 8', image: moviePosters[3] },
];

export default function UserHome() {
  const navigate = useNavigate();
  const { user, loading, isAuthenticated } = useUser();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [currentTrendingIndex, setCurrentTrendingIndex] = useState(0);

  useEffect(() => {
    // Simulate fetching movies from backend (mock data for now)
    const timeout = setTimeout(() => {
      setMovies(initialMockMovies);
    }, 400);
    return () => clearTimeout(timeout);
  }, []);

  // Auto-slide carousel every 3.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTrendingIndex((prev) => (prev === trendingImages.length - 1 ? 0 : prev + 1));
    }, 3500);
    return () => clearInterval(interval);
  }, []);

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
      <div className="max-w-6xl mx-auto">
        <UserNavbar />

        <main className="px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 pb-8 sm:pb-24 md:pb-8 md:pt-32">
          {/* Trending Carousel */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl sm:text-2xl font-bold">Trending Around You !</h3>
            </div>
            <div className="mb-8">
              <div className="h-0.5 w-full bg-slate-800 mb-4" />
              <div className="relative rounded-xl overflow-hidden border border-slate-800 shadow-lg group">
                {/* Carousel Image */}
                <img 
                  src={trendingImages[currentTrendingIndex]} 
                  alt={`Trending ${currentTrendingIndex + 1}`} 
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
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentTrendingIndex ? 'bg-yellow-400 w-6' : 'bg-white/40'
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
              <h4 className="text-lg sm:text-xl font-semibold">Recent Movies</h4>
              <button 
                onClick={handleSeeMore}
                className="text-xs sm:text-sm font-semibold bg-yellow-400 text-black px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow hover:bg-yellow-500 transition-colors"
              >
                See More
              </button>
            </div>

            <div className="mt-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 sm:gap-5 md:gap-6 lg:gap-8">
                {movies.map((m) => (
                  <div key={m.id}>
                    <MovieCard title={m.title} image={m.image} />
                  </div>
                ))}
              </div>
            </div>
          </section>

        </main>
      </div>
      <BottomNavigation />
    </div>
  );
}
