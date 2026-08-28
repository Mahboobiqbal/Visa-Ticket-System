import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Ticket, Stamp, Users, Banknote, AlertTriangle, TrendingUp, Clock, ArrowRight } from 'lucide-react';

const periods = [
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'This Year', value: 'year' },
  { label: 'All Time', value: 'all' },
];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState({ passport: { count: 0, alerts: [] }, payments: { count: 0, total_due: 0, alerts: [] } });
  const [period, setPeriod] = useState('all');
  const navigate = useNavigate();

  const load = () => {
    api.get('/dashboard/', { params: { period } }).then(res => setStats(res.data));
    api.get('/alerts/passport-expiry').then(res => setAlerts(prev => ({ ...prev, passport: res.data }))).catch(() => {});
    api.get('/alerts/pending-payments').then(res => setAlerts(prev => ({ ...prev, payments: res.data }))).catch(() => {});
  };

  useEffect(() => { load(); }, [period]);

  if (!stats) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E74C3C]"></div></div>;

  const maxRevenue = Math.max(...stats.monthly_revenue.map(m => m.revenue), 1);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-[22px] font-normal text-[#202124]">Dashboard</h1>
          <p className="text-[13px] text-[#5f6368] mt-0.5">Welcome back, {localStorage.getItem('token') ? 'Admin' : 'User'}</p>
        </div>
        <div className="flex gap-1 bg-white rounded-full border border-[#dadce0] p-1">
          {periods.map(p => (
            <button key={p.value} onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors ${period === p.value ? 'bg-[#E74C3C] text-white' : 'text-[#5f6368] hover:bg-[#f1f3f4]'}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Alert Banners */}
      {(alerts.passport.count > 0 || alerts.payments.count > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {alerts.passport.count > 0 && (
            <div className="bg-[#fef7e0] border border-[#f9e0a0] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={18} className="text-[#e37400]" />
                <span className="text-[13px] font-medium text-[#e37400]">Passport Expiry Alerts</span>
              </div>
              <p className="text-[12px] text-[#5f6368]">{alerts.passport.count} passport(s) expiring within 30 days</p>
              <button onClick={() => navigate('/tickets')} className="text-[12px] text-[#E74C3C] mt-1 hover:underline">View Details →</button>
            </div>
          )}
          {alerts.payments.count > 0 && (
            <div className="bg-[#fce8e6] border border-[#f5b7b1] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={18} className="text-[#d93025]" />
                <span className="text-[13px] font-medium text-[#d93025]">Pending Payments</span>
              </div>
              <p className="text-[12px] text-[#5f6368]">{alerts.payments.count} record(s) — SAR {alerts.payments.total_due.toLocaleString()} due</p>
              <button onClick={() => navigate('/cashout')} className="text-[12px] text-[#E74C3C] mt-1 hover:underline">View Details →</button>
            </div>
          )}
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Ticket, label: 'Total Bookings', value: stats.total_tickets, color: '#E74C3C', link: '/tickets' },
          { icon: Stamp, label: 'Total Visas', value: stats.total_visas, color: '#e37400', link: '/visas' },
          { icon: Users, label: 'Active Agents', value: stats.total_agents, color: '#1e8e3e', link: '/agents' },
          { icon: Banknote, label: 'Total Revenue', value: `SAR ${stats.total_revenue.toLocaleString()}`, color: '#1a73e8', link: '/cashout' },
        ].map(({ icon: Icon, label, value, color, link }) => (
          <div key={label} onClick={() => navigate(link)} className="bg-white rounded-xl border border-[#e0e0e0] p-5 cursor-pointer hover:shadow-[0_1px_3px_0_rgba(60,64,67,0.3),0_4px_8px_3px_rgba(60,64,67,0.15)] transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[12px] text-[#5f6368] uppercase tracking-wide font-medium">{label}</p>
                <p className="text-[24px] font-normal text-[#202124] mt-1">{value}</p>
              </div>
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
                <Icon size={20} style={{ color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-[#e0e0e0] p-5">
          <p className="text-[12px] text-[#5f6368] uppercase tracking-wide font-medium">Total Commission</p>
          <p className="text-[20px] font-normal text-[#1e8e3e] mt-1">SAR {stats.total_commission.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-[#e0e0e0] p-5">
          <p className="text-[12px] text-[#5f6368] uppercase tracking-wide font-medium">Total Expenses</p>
          <p className="text-[20px] font-normal text-[#d93025] mt-1">SAR {stats.total_expenses.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-[#e0e0e0] p-5">
          <p className="text-[12px] text-[#5f6368] uppercase tracking-wide font-medium">Pending Payments</p>
          <p className="text-[20px] font-normal text-[#e37400] mt-1">SAR {stats.pending_payments.toLocaleString()}</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Monthly Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#e0e0e0] p-5">
          <h3 className="text-[14px] font-medium text-[#202124] mb-4">Monthly Revenue</h3>
          <div className="flex items-end gap-3 h-40">
            {stats.monthly_revenue.map((m, i) => {
              const height = maxRevenue > 0 ? (m.revenue / maxRevenue) * 100 : 0;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-[#5f6368]">{m.revenue > 0 ? `SAR ${(m.revenue / 1000).toFixed(0)}k` : ''}</span>
                  <div className="w-full rounded-t-md bg-[#E74C3C] transition-all duration-500" style={{ height: `${Math.max(height, 2)}%` }}></div>
                  <span className="text-[10px] text-[#5f6368]">{m.month.split(' ')[0]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Agents */}
        <div className="bg-white rounded-xl border border-[#e0e0e0] p-5">
          <h3 className="text-[14px] font-medium text-[#202124] mb-4">Top Agents</h3>
          {stats.top_agents.length === 0 ? (
            <p className="text-[13px] text-[#5f6368] text-center py-8">No agent data yet</p>
          ) : (
            <div className="space-y-3">
              {stats.top_agents.map((a, i) => (
                <div key={a.id} onClick={() => navigate(`/agents/${a.id}`)} className="flex items-center gap-3 cursor-pointer hover:bg-[#f8f8f8] p-2 rounded-lg transition-colors">
                  <div className="w-8 h-8 rounded-full bg-[#E74C3C] flex items-center justify-center text-white text-[12px] font-medium">{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-[#202124] truncate">{a.name}</p>
                    <p className="text-[11px] text-[#5f6368]">SAR {a.revenue.toLocaleString()}</p>
                  </div>
                  <ArrowRight size={14} className="text-[#5f6368]" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Tickets */}
        <div className="bg-white rounded-xl border border-[#e0e0e0] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#e0e0e0]">
            <h3 className="text-[14px] font-medium text-[#202124]">Recent Bookings</h3>
            <button onClick={() => navigate('/tickets')} className="text-[12px] text-[#E74C3C] hover:underline">View All</button>
          </div>
          <div className="divide-y divide-[#f0f0f0]">
            {stats.recent_tickets.length === 0 ? (
              <p className="px-5 py-8 text-center text-[13px] text-[#5f6368]">No bookings yet</p>
            ) : stats.recent_tickets.map(t => (
              <div key={t.id} onClick={() => navigate(`/tickets/${t.id}`)} className="flex items-center justify-between px-5 py-3 cursor-pointer hover:bg-[#f8f8f8] transition-colors">
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-[#202124] truncate">{t.passenger_name}</p>
                  <p className="text-[11px] text-[#5f6368]">{t.flight_from} → {t.flight_to} · {t.agent_name}</p>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <p className="text-[13px] text-[#202124]">SAR {t.selling_price.toLocaleString()}</p>
                  <span className={`text-[11px] ${t.payment_status === 'paid' ? 'text-[#1e8e3e]' : 'text-[#e37400]'}`}>{t.payment_status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Visas */}
        <div className="bg-white rounded-xl border border-[#e0e0e0] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#e0e0e0]">
            <h3 className="text-[14px] font-medium text-[#202124]">Recent Visas</h3>
            <button onClick={() => navigate('/visas')} className="text-[12px] text-[#E74C3C] hover:underline">View All</button>
          </div>
          <div className="divide-y divide-[#f0f0f0]">
            {stats.recent_visas.length === 0 ? (
              <p className="px-5 py-8 text-center text-[13px] text-[#5f6368]">No visa records yet</p>
            ) : stats.recent_visas.map(v => (
              <div key={v.id} onClick={() => navigate(`/visas/${v.id}`)} className="flex items-center justify-between px-5 py-3 cursor-pointer hover:bg-[#f8f8f8] transition-colors">
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-[#202124] truncate">{v.passenger_name}</p>
                  <p className="text-[11px] text-[#5f6368]">{v.visa_type} · {v.package} · {v.agent_name}</p>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <p className="text-[13px] text-[#202124]">SAR {v.total_charges.toLocaleString()}</p>
                  <span className={`text-[11px] ${v.status === 'approved' ? 'text-[#1e8e3e]' : v.status === 'rejected' ? 'text-[#d93025]' : 'text-[#e37400]'}`}>{v.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
