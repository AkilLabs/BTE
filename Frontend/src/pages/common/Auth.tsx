// Using JSX transform; no need to import React directly
import BTlogo from '../../assets/BTlogo.png';
import { Link } from 'react-router-dom';

export default function Auth() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="w-full max-w-md text-center px-6">
        <img src={BTlogo} alt="BlackTicket" className="mx-auto w-48 mb-8" />

        <div className="space-y-4">
          <Link
            to="/signup"
            className="block w-full bg-[#FBBB00] text-black font-semibold rounded-full px-6 py-3 shadow-md"
          >
            Sign Up
          </Link>

          <button
            className="w-full bg-black border border-white text-white font-medium rounded-full px-6 py-3"
            type="button"
          >
            Login
          </button>
        </div>

        <p className="text-xs text-slate-400 mt-6">
          By sign in or sign up, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
