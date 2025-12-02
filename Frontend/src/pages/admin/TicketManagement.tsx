import { useState, useEffect } from 'react';
import { Search, Filter, Eye, CheckCircle, XCircle, Clock } from 'lucide-react';
import AdminNavbar from './AdminNavbar';
import AdminBottomNavigation from './AdminBottomNavigation';

interface Ticket {
  id: string;
  bookingId: string;
  movieName: string;
  userName: string;
  userEmail: string;
  seats: string[];
  totalPrice: number;
  bookingDate: string;
  showDate: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  quantity: number;
}

export default function TicketManagement() {
  const [tickets, setTickets] = useState<Ticket[]>([
    {
      id: '1',
      bookingId: 'BT001',
      movieName: 'Inception',
      userName: 'Harlee',
      userEmail: 'harlee@gmail.com',
      seats: ['A1', 'A2'],
      totalPrice: 500,
      bookingDate: '2025-11-28',
      showDate: '2025-12-01',
      status: 'confirmed',
      quantity: 2,
    },
    {
      id: '2',
      bookingId: 'BT002',
      movieName: 'Parasakshi',
      userName: 'John',
      userEmail: 'john@gmail.com',
      seats: ['B5', 'B6', 'B7'],
      totalPrice: 750,
      bookingDate: '2025-11-29',
      showDate: '2025-12-02',
      status: 'pending',
      quantity: 3,
    },
    {
      id: '3',
      bookingId: 'BT003',
      movieName: 'Bahadur',
      userName: 'Sarah',
      userEmail: 'sarah@gmail.com',
      seats: ['C3', 'C4'],
      totalPrice: 500,
      bookingDate: '2025-11-27',
      showDate: '2025-11-30',
      status: 'confirmed',
      quantity: 2,
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'confirmed' | 'pending' | 'cancelled'>('all');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.bookingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.movieName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.userEmail.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-400" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500/20 text-green-400 border border-green-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400 border border-red-500/30';
      default:
        return '';
    }
  };

  const stats = [
    { label: 'Total Tickets', value: tickets.length, color: 'text-blue-400' },
    { label: 'Confirmed', value: tickets.filter((t) => t.status === 'confirmed').length, color: 'text-green-400' },
    { label: 'Pending', value: tickets.filter((t) => t.status === 'pending').length, color: 'text-yellow-400' },
    { label: 'Cancelled', value: tickets.filter((t) => t.status === 'cancelled').length, color: 'text-red-400' },
  ];

  return (
    <div className="min-h-screen bg-black">
      <AdminNavbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:pt-24 pb-24 md:pb-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Ticket Management 🎟️</h1>
          <p className="text-slate-400">Monitor and manage all ticket bookings</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-slate-900 border border-slate-700 rounded-lg p-4">
              <p className="text-slate-400 text-sm mb-1">{stat.label}</p>
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Search and Filter */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="Search by booking ID, movie, or user..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:border-yellow-400 focus:outline-none transition"
            />
          </div>
          <div className="flex gap-2">
            <Filter className="w-5 h-5 text-slate-400 self-center" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-yellow-400 focus:outline-none transition"
            >
              <option value="all">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Tickets Table */}
        <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800 border-b border-slate-700">
                <tr>
                  <th className="px-6 py-4 text-left text-white font-semibold">Booking ID</th>
                  <th className="px-6 py-4 text-left text-white font-semibold">Movie</th>
                  <th className="px-6 py-4 text-left text-white font-semibold">User</th>
                  <th className="px-6 py-4 text-left text-white font-semibold">Seats</th>
                  <th className="px-6 py-4 text-left text-white font-semibold">Price</th>
                  <th className="px-6 py-4 text-left text-white font-semibold">Show Date</th>
                  <th className="px-6 py-4 text-left text-white font-semibold">Status</th>
                  <th className="px-6 py-4 text-center text-white font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.length > 0 ? (
                  filteredTickets.map((ticket) => (
                    <tr key={ticket.id} className="border-b border-slate-700 hover:bg-slate-800/50 transition">
                      <td className="px-6 py-4 text-white font-semibold">{ticket.bookingId}</td>
                      <td className="px-6 py-4 text-slate-300">{ticket.movieName}</td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-white">{ticket.userName}</p>
                          <p className="text-slate-400 text-sm">{ticket.userEmail}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-300">{ticket.seats.join(', ')}</td>
                      <td className="px-6 py-4 text-white font-semibold">₹{ticket.totalPrice}</td>
                      <td className="px-6 py-4 text-slate-300">{ticket.showDate}</td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(ticket.status)}`}>
                          {getStatusIcon(ticket.status)}
                          {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => setSelectedTicket(ticket)}
                          className="bg-yellow-400 hover:bg-yellow-500 text-black px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 mx-auto transition"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                      No tickets found matching your criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Ticket Details Modal */}
        {selectedTicket && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-8">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-white">Ticket Details</h2>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="text-slate-400 hover:text-white transition"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-slate-400 text-sm">Booking ID</p>
                  <p className="text-white font-semibold">{selectedTicket.bookingId}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Movie</p>
                  <p className="text-white font-semibold">{selectedTicket.movieName}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Passenger</p>
                  <p className="text-white font-semibold">{selectedTicket.userName}</p>
                  <p className="text-slate-400 text-sm">{selectedTicket.userEmail}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Seats</p>
                  <div className="flex gap-2 mt-1">
                    {selectedTicket.seats.map((seat) => (
                      <span key={seat} className="bg-yellow-400/20 text-yellow-400 px-2 py-1 rounded text-sm font-semibold border border-yellow-400/30">
                        {seat}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Total Price</p>
                  <p className="text-2xl font-bold text-yellow-400">₹{selectedTicket.totalPrice}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-400 text-sm">Booking Date</p>
                    <p className="text-white font-semibold">{selectedTicket.bookingDate}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Show Date</p>
                    <p className="text-white font-semibold">{selectedTicket.showDate}</p>
                  </div>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Status</p>
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mt-1 ${getStatusBadge(selectedTicket.status)}`}>
                    {getStatusIcon(selectedTicket.status)}
                    {selectedTicket.status.charAt(0).toUpperCase() + selectedTicket.status.slice(1)}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedTicket(null)}
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold rounded-lg px-4 py-2.5 transition"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
      <AdminBottomNavigation />
    </div>
  );
}
