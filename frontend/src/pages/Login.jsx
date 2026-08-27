import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(username, password);
      toast.success('Signed in successfully');
      navigate('/');
    } catch (err) {
      toast.error('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5]">
      <div className="bg-white rounded-2xl shadow-[0_1px_3px_0_rgba(0,0,0,0.15),0_4px_8px_3px_rgba(0,0,0,0.1)] p-10 w-full max-w-[400px]">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-[#E74C3C] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-lg">VT</span>
          </div>
          <h1 className="text-[22px] font-normal text-[#2E2E2E]">Sign in</h1>
          <p className="text-[13px] text-[#4A4A4A] mt-1">to continue to Visa & Ticket System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-[#d4d4d4] rounded-lg text-[14px] text-[#2E2E2E] focus:border-[#E74C3C] focus:ring-0 outline-none transition-colors"
              placeholder="Username"
              required
            />
          </div>

          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-[#d4d4d4] rounded-lg text-[14px] text-[#2E2E2E] focus:border-[#E74C3C] focus:ring-0 outline-none transition-colors"
              placeholder="Password"
              required
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#E74C3C] text-white py-3 rounded-full text-[14px] font-medium hover:bg-[#C0392B] transition-all disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Next'}
            </button>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-[#e0e0e0]">
          <p className="text-center text-[12px] text-[#999]">
            Default: <span className="font-medium text-[#4A4A4A]">admin / admin123</span>
          </p>
        </div>
      </div>
    </div>
  );
}
