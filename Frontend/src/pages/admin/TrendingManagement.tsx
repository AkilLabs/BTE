import { useEffect, useState } from 'react';
import AdminNavbar from './AdminNavbar';
import AdminBottomNavigation from './AdminBottomNavigation';
import { useToast } from '../../context/ToastContext';
import MovieCard from '../../components/MovieCard';

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

export default function TrendingManagement() {
  const { showToast } = useToast();
  const [trending, setTrending] = useState<TrendingItem[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const getAuthToken = (): string | null => {
    const match = typeof document !== 'undefined' ? document.cookie.match(/(?:^|; )jwt=([^;]+)/) : null;
    if (match && match[1]) return decodeURIComponent(match[1]);
    try {
      const t = localStorage.getItem('jwt') || localStorage.getItem('token');
      if (t) return t;
    } catch (e) {}
    return null;
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // trending list (admin)
      const resT = await fetch(`${API_URL}/admin/trending/`);
      const tdata = resT.ok ? await resT.json() : { trending: [] };
      setTrending(tdata.trending || []);

      // all movies (reusing existing endpoint)
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return showToast('Please choose an image to upload', 'warning');
    setUploading(true);
    try {
      const token = getAuthToken();
      const fd = new FormData();
      fd.append('image', file);
      // optional: allow title
      fd.append('title', file.name);

      const res = await fetch(`${API_URL}/admin/trending/`, {
        method: 'POST',
        credentials: 'include',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: fd,
      });

      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      showToast('Trending image uploaded', 'success');
      setFile(null);
      fetchData();
    } catch (err) {
      console.error(err);
      showToast('Failed to upload image', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveTrending = async (id: string) => {
    if (!confirm('Remove this trending image?')) return;
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_URL}/admin/trending/${id}/`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (!res.ok) throw new Error('Delete failed');
      showToast('Trending image removed', 'success');
      setTrending((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error(err);
      showToast('Failed to remove trending', 'error');
    }
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
      if (!res.ok) throw new Error('Failed to update movie');
      showToast(!current ? 'Added to recent movies' : 'Removed from recent movies', 'success');
      setMovies((prev) => prev.map((m) => (m._id === movieId ? { ...m, is_recent: !current } : m)));
    } catch (err) {
      console.error(err);
      showToast('Failed to update movie status', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto">
        <AdminNavbar />

        <main className="px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 pb-8 sm:pb-24 md:pb-8 md:pt-28">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Trending Management</h1>
              <p className="text-slate-400 text-sm">Upload/remove trending images and mark movies as recent</p>
            </div>
          </div>

          <section className="mb-8">
            <div className="rounded-lg border border-white/10 p-4">
              <h2 className="font-semibold mb-3">Upload Trending Image (landscape)</h2>
              <div className="flex items-center gap-3">
                <input type="file" accept="image/*" onChange={handleFileChange} />
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="bg-yellow-400 text-black px-4 py-2 rounded-full hover:bg-yellow-500 transition duration-200 disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
              <p className="text-slate-400 text-xs mt-2">Images will be stored in cloud under `Trending Movies` folder. Removing here should delete from cloud.</p>
            </div>
          </section>

          <section className="mb-8">
            <h3 className="font-semibold mb-3">Current Trending Images</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {loading ? (
                <div className="text-slate-400">Loading...</div>
              ) : trending.length === 0 ? (
                <div className="text-slate-400">No trending images</div>
              ) : (
                trending.map((t) => (
                  <div key={t.id} className="relative">
                    <img src={t.image_url} alt={t.title || 'trending'} className="w-full h-36 object-cover rounded-md" />
                    <button
                      onClick={() => handleRemoveTrending(t.id)}
                      className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded-full text-xs"
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

          <section>
            <h3 className="font-semibold mb-3">All Movies (click star to mark recent)</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {movies.map((m) => (
                <div key={m._id} className="space-y-2">
                  <MovieCard movieId={m._id} title={m.title} image={m.poster_url} />
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-slate-400 text-sm">{m.title}</div>
                    <button
                      onClick={() => toggleMovieRecent(m._id, m.is_recent)}
                      className={`px-3 py-1 rounded-full text-sm ${m.is_recent ? 'bg-yellow-400 text-black' : 'bg-white/8 text-white'}`}
                    >
                      {m.is_recent ? '★ Recent' : '☆ Add'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>

        <AdminBottomNavigation />
      </div>
    </div>
  );
}
