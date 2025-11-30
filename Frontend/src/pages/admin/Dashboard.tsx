import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, Film, Ticket } from 'lucide-react';
import AdminNavbar from './AdminNavbar';
import AdminBottomNavigation from './AdminBottomNavigation';

// Sample data for charts
const revenueData = [
  { month: 'Jan', revenue: 4000, bookings: 2400 },
  { month: 'Feb', revenue: 3000, bookings: 1398 },
  { month: 'Mar', revenue: 2000, bookings: 9800 },
  { month: 'Apr', revenue: 2780, bookings: 3908 },
  { month: 'May', revenue: 1890, bookings: 4800 },
  { month: 'Jun', revenue: 2390, bookings: 3800 },
];

const movieDistribution = [
  { name: 'Action', value: 35 },
  { name: 'Comedy', value: 25 },
  { name: 'Drama', value: 20 },
  { name: 'Horror', value: 20 },
];

const COLORS = ['#FBBB00', '#FF6B6B', '#4ECDC4', '#45B7D1'];

interface StatCard {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

export default function AdminDashboard() {
  const [adminName, setAdminName] = useState<string>('Admin');

  useEffect(() => {
    // In a real app, you'd fetch the admin name from the profile
    const email = localStorage.getItem('userEmail') || 'Admin';
    setAdminName(email.split('@')[0]);
  }, []);

  const stats: StatCard[] = [
    {
      title: 'Total Revenue',
      value: '₹45,200',
      icon: <TrendingUp className="w-8 h-8" />,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
    },
    {
      title: 'Total Bookings',
      value: '1,234',
      icon: <Ticket className="w-8 h-8" />,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Active Movies',
      value: '24',
      icon: <Film className="w-8 h-8" />,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Total Users',
      value: '5,890',
      icon: <Users className="w-8 h-8" />,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
    },
  ];

  return (
    <div className="min-h-screen bg-black">
      <AdminNavbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:pt-24 pb-24 md:pb-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Welcome back, {adminName}! 👋</h1>
          <p className="text-slate-400">Here's your movie theater performance overview</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`${stat.bgColor} border border-slate-700 rounded-xl p-6 hover:border-slate-600 transition`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-400 text-sm mb-2">{stat.title}</p>
                  <p className="text-white text-3xl font-bold">{stat.value}</p>
                </div>
                <div className={stat.color}>{stat.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Revenue & Bookings Chart */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-700 rounded-xl p-6">
            <h2 className="text-white text-lg font-semibold mb-6">Revenue & Bookings Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563' }}
                  labelStyle={{ color: '#FBBB00' }}
                />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#FBBB00" strokeWidth={2} dot={{ fill: '#FBBB00' }} />
                <Line type="monotone" dataKey="bookings" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Movie Genre Distribution */}
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
            <h2 className="text-white text-lg font-semibold mb-6">Movie Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={movieDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {movieDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563' }}
                  labelStyle={{ color: '#FBBB00' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Revenue Bar Chart */}
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
          <h2 className="text-white text-lg font-semibold mb-6">Monthly Revenue Comparison</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563' }}
                labelStyle={{ color: '#FBBB00' }}
              />
              <Legend />
              <Bar dataKey="revenue" fill="#FBBB00" radius={[8, 8, 0, 0]} />
              <Bar dataKey="bookings" fill="#10B981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Activities */}
        <div className="mt-8 bg-slate-900 border border-slate-700 rounded-xl p-6">
          <h2 className="text-white text-lg font-semibold mb-6">Recent Activities</h2>
          <div className="space-y-4">
            {[
              { action: 'New booking', movie: 'Inception', user: 'Harlee', time: '2 hours ago' },
              { action: 'Movie added', movie: 'Parasakshi', user: 'Admin', time: '5 hours ago' },
              { action: 'Payment received', movie: 'Bahadur', user: 'John', time: '1 day ago' },
              { action: 'New booking', movie: 'Janaaygan', user: 'Sarah', time: '1 day ago' },
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-slate-700 last:border-b-0">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-yellow-400/20 flex items-center justify-center">
                    <Film className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{activity.action}</p>
                    <p className="text-slate-400 text-sm">{activity.movie} • {activity.user}</p>
                  </div>
                </div>
                <p className="text-slate-500 text-sm">{activity.time}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <AdminBottomNavigation />
    </div>
  );
}
