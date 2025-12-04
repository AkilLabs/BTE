import { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { User, Mail, Phone, Edit2, Save, X } from 'lucide-react';
import AdminNavbar from './AdminNavbar';
import AdminBottomNavigation from './AdminBottomNavigation';

interface AdminData {
  id?: string;
  name: string;
  email: string;
  phone_number: string;
  role: string;
  status: string;
  created_at?: string;
  last_login?: string;
}

export default function AdminProfile() {
  const { showToast } = useToast();
  const [adminData, setAdminData] = useState<AdminData>({
    name: 'Admin',
    email: 'admin@gmail.com',
    phone_number: '9677979811',
    role: 'admin',
    status: 'Active',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editedData, setEditedData] = useState<AdminData>(adminData);

  useEffect(() => {
    // Fetch admin profile data
    const fetchProfile = async () => {
      try {
        const response = await fetch('http://68.183.80.191:8000/api/get_user_profile/', {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          const profile = data.profile;
          setAdminData({
            id: profile._id,
            name: profile.name || 'Admin',
            email: profile.email,
            phone_number: profile.phone_number || '',
            role: profile.role || 'admin',
            status: profile.status || 'Active',
            created_at: profile.created_at,
            last_login: profile.last_login,
          });
          setEditedData({
            id: profile._id,
            name: profile.name || 'Admin',
            email: profile.email,
            phone_number: profile.phone_number || '',
            role: profile.role || 'admin',
            status: profile.status || 'Active',
            created_at: profile.created_at,
            last_login: profile.last_login,
          });
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      }
    };

    fetchProfile();
  }, []);

  const handleEdit = () => {
    setIsEditing(true);
    setEditedData(adminData);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedData(adminData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditedData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // In a real app, you'd send this to the backend
      const response = await fetch('http://68.183.80.191:8000/api/update_profile/', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editedData.name,
          phone_number: editedData.phone_number,
        }),
        credentials: 'include',
      });

      if (response.ok) {
        setAdminData(editedData);
        setIsEditing(false);
        showToast('Profile updated successfully! ✨', 'success');
      } else {
        showToast('Failed to update profile', 'error');
      }
    } catch (err) {
      showToast('An error occurred while updating profile', 'error');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <AdminNavbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:pt-24 pb-24 md:pb-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Admin Profile 👤</h1>
          <p className="text-slate-400">Manage your account information</p>
        </div>

        {/* Profile Card */}
        <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
          {/* Cover Background */}
          <div className="h-32 bg-gradient-to-r from-yellow-400/20 to-purple-400/20" />

          {/* Profile Content */}
          <div className="px-8 pb-8">
            {/* Avatar and Name */}
            <div className="flex items-end gap-4 -mt-16 mb-6">
              <div className="w-32 h-32 rounded-xl bg-gradient-to-br from-yellow-400 to-purple-400 flex items-center justify-center border-4 border-slate-900">
                <User className="w-16 h-16 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white">{adminData.name}</h2>
                <p className="text-slate-400">{adminData.role.charAt(0).toUpperCase() + adminData.role.slice(1)}</p>
              </div>
              {!isEditing && (
                <button
                  onClick={handleEdit}
                  className="ml-auto bg-yellow-400 hover:bg-yellow-500 text-black px-6 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition"
                >
                  <Edit2 className="w-5 h-5" />
                  Edit Profile
                </button>
              )}
            </div>

            {/* Profile Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Email */}
              <div className="bg-slate-800 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="w-5 h-5 text-yellow-400" />
                  <label className="text-slate-400 text-sm font-semibold">Email Address</label>
                </div>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={editedData.email}
                    disabled
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white opacity-50 cursor-not-allowed"
                  />
                ) : (
                  <p className="text-white text-lg">{adminData.email}</p>
                )}
              </div>

              {/* Phone */}
              <div className="bg-slate-800 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Phone className="w-5 h-5 text-yellow-400" />
                  <label className="text-slate-400 text-sm font-semibold">Phone Number</label>
                </div>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone_number"
                    value={editedData.phone_number}
                    onChange={handleInputChange}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:border-yellow-400 focus:outline-none transition"
                  />
                ) : (
                  <p className="text-white text-lg">{adminData.phone_number || 'N/A'}</p>
                )}
              </div>

              {/* Role */}
              <div className="bg-slate-800 rounded-lg p-6">
                <label className="text-slate-400 text-sm font-semibold block mb-2">Role</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedData.role}
                    disabled
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white opacity-50 cursor-not-allowed"
                  />
                ) : (
                  <p className="text-white text-lg capitalize">{adminData.role}</p>
                )}
              </div>

              {/* Status */}
              <div className="bg-slate-800 rounded-lg p-6">
                <label className="text-slate-400 text-sm font-semibold block mb-2">Status</label>
                <div className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${adminData.status === 'Active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {adminData.status}
                </div>
              </div>

              {/* Name (Editable) */}
              <div className="bg-slate-800 rounded-lg p-6 md:col-span-2">
                <label className="text-slate-400 text-sm font-semibold block mb-2">Full Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={editedData.name}
                    onChange={handleInputChange}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:border-yellow-400 focus:outline-none transition"
                  />
                ) : (
                  <p className="text-white text-lg">{adminData.name}</p>
                )}
              </div>
            </div>

            {/* Account Information */}
            {adminData.created_at && (
              <div className="bg-slate-800 rounded-lg p-6 mb-8">
                <h3 className="text-white font-semibold mb-4">Account Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-400 text-sm">Created At</p>
                    <p className="text-white">{new Date(adminData.created_at).toLocaleDateString()}</p>
                  </div>
                  {adminData.last_login && (
                    <div>
                      <p className="text-slate-400 text-sm">Last Login</p>
                      <p className="text-white">{new Date(adminData.last_login).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Edit Actions */}
            {isEditing && (
              <div className="flex gap-4">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black font-bold rounded-lg px-6 py-3 flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-5 h-5" />
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg px-6 py-3 flex items-center justify-center gap-2 transition"
                >
                  <X className="w-5 h-5" />
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <AdminBottomNavigation />
    </div>
  );
}
