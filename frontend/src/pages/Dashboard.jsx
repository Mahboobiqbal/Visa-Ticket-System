import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useHeaderActions } from '../components/Layout';
import {
  Ticket, Stamp, Users, DollarSign, TrendingUp, Clock,
  ArrowUpRight, Plus, Plane, BarChart3,
} from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/dashboard/').then(res => { setStats(res.data); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E74C3C]"></div>
    </div>
  );
  if (!stats) return null;

  const statCards = [
    { label: 'Total Tickets', value: stats.total_tickets, icon: Ticket, bg: '#f0f0f0', color: '#333', onClick: () => navigate('/tickets') },
    { label: 'Total Visas', value: stats.total_visas, icon: Stamp, bg: '#f0f0f0', color: '#333', onClick: () => navigate('/visas') },
    { label: 'Total Agents', value: stats.total_agents, icon: Users, bg: '#f0f0f0', color: '#333', onClick: () => navigate('/agents') },
    { label: 'Total Revenue', value: `SAR ${stats.total_revenue.toLocaleString()}`, icon: DollarSign, bg: '#f0f0f0', color: '#333', onClick: () => navigate('/tickets') },
    { label: 'Total Commission', value: `SAR ${stats.total_commission.toLocaleString()}`, icon: TrendingUp, bg: '#f0f0f0', color: '#333', onClick: () => navigate('/visas') },
    { label: 'Pending Payments', value: `SAR ${stats.pending_payments.toLocaleString()}`, icon: Clock, bg: '#f0f0f0', color: '#333', onClick: () => navigate('/cashout') },
  ];

  const quickActions = [
    { label: 'New Ticket', icon: Ticket, action: () => navigate('/tickets') },
    { label: 'New Visa', icon: Stamp, action: () => navigate('/visas') },
    { label: 'New Agent', icon: Users, action: () => navigate('/agents') },
    { label: 'Cash Out', icon: DollarSign, action: () => navigate('/cashout') },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Quick Actions */}
      <div className="mb-6">
        <h2 className="text-[13px] font-medium text-[#888] uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          {quickActions.map(({ label, icon: Icon, action }) => (
            <button
              key={label}
              onClick={action}
              className="flex items-center gap-2.5 px-5 py-3 bg-white rounded-xl border border-[#d4d4d4] hover:shadow-[0_1px_3px_0_rgba(0,0,0,0.15)] transition-all text-[13px] font-medium text-[#2E2E2E]"
            >
              <div className="w-9 h-9 rounded-full bg-[#f0f0f0] flex items-center justify-center">
                <Icon size={18} className="text-[#4A4A4A]" />
              </div>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-6">
        <h2 className="text-[13px] font-medium text-[#888] uppercase tracking-wider mb-3">Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {statCards.map((card) => (
            <div
              key={card.label}
              onClick={card.onClick}
              className="bg-white rounded-xl border border-[#d4d4d4] p-5 cursor-pointer hover:shadow-[0_1px_3px_0_rgba(0,0,0,0.15)] transition-all group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[12px] text-[#888] uppercase tracking-wide font-medium">{card.label}</p>
                  <p className="text-[26px] font-normal text-[#2E2E2E] mt-1">{card.value}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: card.bg }}>
                    <card.icon size={20} style={{ color: card.color }} />
                  </div>
                  <ArrowUpRight size={16} className="text-[#ccc] group-hover:text-[#4A4A4A] transition-colors" />
                </div>
              </div>
              <p className="text-[12px] text-[#E74C3C] mt-3 opacity-0 group-hover:opacity-100 transition-opacity">View details →</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tickets */}
        <div className="bg-white rounded-xl border border-[#d4d4d4] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#e0e0e0] flex items-center justify-between">
            <h3 className="text-[14px] font-medium text-[#2E2E2E]">Recent Tickets</h3>
            <button onClick={() => navigate('/tickets')} className="text-[12px] text-[#E74C3C] font-medium hover:underline">View all</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#e0e0e0]">
                  <th className="text-left px-5 py-2.5 text-[11px] font-medium text-[#888] uppercase tracking-wider">Passenger</th>
                  <th className="text-left px-5 py-2.5 text-[11px] font-medium text-[#888] uppercase tracking-wider">Route</th>
                  <th className="text-left px-5 py-2.5 text-[11px] font-medium text-[#888] uppercase tracking-wider">Amount</th>
                  <th className="text-left px-5 py-2.5 text-[11px] font-medium text-[#888] uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_tickets.length === 0 ? (
                  <tr><td colSpan={4} className="px-5 py-10 text-center">
                    <Plane size={40} className="mx-auto text-[#ddd] mb-2" />
                    <p className="text-[13px] text-[#999]">No tickets yet</p>
                    <button onClick={() => navigate('/tickets')} className="mt-2 text-[12px] text-[#E74C3C] font-medium hover:underline">Add your first ticket</button>
                  </td></tr>
                ) : stats.recent_tickets.map((t) => (
                  <tr key={t.id} className="border-b border-[#f0f0f0] last:border-0 gmail-row cursor-pointer" onClick={() => navigate('/tickets')}>
                    <td className="px-5 py-3 text-[13px] text-[#2E2E2E]">{t.passenger_name}</td>
                    <td className="px-5 py-3 text-[13px] text-[#4A4A4A]">{t.flight_from} → {t.flight_to}</td>
                    <td className="px-5 py-3 text-[13px] text-[#2E2E2E]">SAR {t.selling_price.toLocaleString()}</td>
                    <td className="px-5 py-3">
                      <span className={`gmail-badge ${
                        t.payment_status === 'paid' ? 'bg-[#e6f4ea] text-[#1e8e3e]' : 'bg-[#fef7e0] text-[#e37400]'
                      }`}>{t.payment_status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Visas */}
        <div className="bg-white rounded-xl border border-[#d4d4d4] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#e0e0e0] flex items-center justify-between">
            <h3 className="text-[14px] font-medium text-[#2E2E2E]">Recent Visas</h3>
            <button onClick={() => navigate('/visas')} className="text-[12px] text-[#E74C3C] font-medium hover:underline">View all</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#e0e0e0]">
                  <th className="text-left px-5 py-2.5 text-[11px] font-medium text-[#888] uppercase tracking-wider">Passenger</th>
                  <th className="text-left px-5 py-2.5 text-[11px] font-medium text-[#888] uppercase tracking-wider">Type</th>
                  <th className="text-left px-5 py-2.5 text-[11px] font-medium text-[#888] uppercase tracking-wider">Charges</th>
                  <th className="text-left px-5 py-2.5 text-[11px] font-medium text-[#888] uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_visas.length === 0 ? (
                  <tr><td colSpan={4} className="px-5 py-10 text-center">
                    <BarChart3 size={40} className="mx-auto text-[#ddd] mb-2" />
                    <p className="text-[13px] text-[#999]">No visas yet</p>
                    <button onClick={() => navigate('/visas')} className="mt-2 text-[12px] text-[#E74C3C] font-medium hover:underline">Add your first visa</button>
                  </td></tr>
                ) : stats.recent_visas.map((v) => (
                  <tr key={v.id} className="border-b border-[#f0f0f0] last:border-0 gmail-row cursor-pointer" onClick={() => navigate('/visas')}>
                    <td className="px-5 py-3 text-[13px] text-[#2E2E2E]">{v.passenger_name}</td>
                    <td className="px-5 py-3 text-[13px] text-[#4A4A4A] capitalize">{v.visa_type}</td>
                    <td className="px-5 py-3 text-[13px] text-[#2E2E2E]">SAR {v.total_charges.toLocaleString()}</td>
                    <td className="px-5 py-3">
                      <span className={`gmail-badge ${
                        v.status === 'approved' ? 'bg-[#e6f4ea] text-[#1e8e3e]' :
                        v.status === 'rejected' ? 'bg-[#fce8e6] text-[#d93025]' : 'bg-[#fef7e0] text-[#e37400]'
                      }`}>{v.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
