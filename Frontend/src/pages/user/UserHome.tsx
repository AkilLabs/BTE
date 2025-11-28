import { useEffect, useState } from 'react';
import UserNavbar from '../../components/UserNavbar';
import MovieCard from '../../components/MovieCard';

const mockTrendingImage = 'https://picsum.photos/1200/420?random=1';

type Movie = { id: number; title: string; image: string };

const initialMockMovies: Movie[] = [
  { id: 1, title: 'Jana Mayagan', image: 'https://picsum.photos/300/420?random=11' },
  { id: 2, title: 'Dheep Classic', image: 'https://picsum.photos/300/420?random=12' },
  { id: 3, title: 'Lik', image: 'https://picsum.photos/300/420?random=13' },
  { id: 4, title: 'Kalki', image: 'https://picsum.photos/300/420?random=14' },
];

export default function UserHome() {
  const [movies, setMovies] = useState<Movie[]>([]);

  useEffect(() => {
    // Simulate fetching movies from backend (mock data for now)
    const timeout = setTimeout(() => {
      setMovies(initialMockMovies);
    }, 400);
    return () => clearTimeout(timeout);
  }, []);
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto">
        <UserNavbar />

        <main className="px-6 py-8">
          {/* Trending */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold">Trending Around You !</h3>
            </div>
            <div className="mb-8">
              <div className="h-0.5 w-full bg-slate-800 mb-4" />
              <div className="rounded-xl overflow-hidden border border-slate-800 shadow-lg">
                <img src={mockTrendingImage} alt="Trending" className="w-full h-64 md:h-96 object-cover" />
              </div>
            </div>
          </section>

          {/* Recent Movies - horizontal scroll */}
          <section className="mt-6">
            <div className="flex items-center justify-between">
              <h4 className="text-xl font-semibold">Recent Movies</h4>
              <button className="text-sm font-semibold bg-yellow-400 text-black px-3 py-1 rounded-full shadow">See More</button>
            </div>

            <div className="mt-4 pb-4 overflow-x-auto">
              <div className="flex gap-4 items-start">
                {movies.map((m) => (
                  <MovieCard key={m.id} title={m.title} image={m.image} />
                ))}
              </div>
            </div>
          </section>

          {/* Partners */}
          <section className="mt-10">
            <h4 className="text-xl font-semibold mb-4">Our Partners</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="h-16 rounded-lg bg-white bg-opacity-5"></div>
              <div className="h-16 rounded-lg bg-white bg-opacity-5"></div>
              <div className="h-16 rounded-lg bg-white bg-opacity-5"></div>
              <div className="h-16 rounded-lg bg-white bg-opacity-5"></div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
