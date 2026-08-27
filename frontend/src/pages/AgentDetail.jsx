import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Edit2, Trash2, User, Phone, Mail,
  Percent, CheckCircle, XCircle, Ticket, Stamp, Banknote,
} from 'lucide-react';

export default function AgentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [agent, setAgent] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [visas, setVisas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/agents/${id}`),
      api.get(`/tickets/`, { params: { agent_id: id } }),
      api.get(`/visas/`, { params: { agent_id: id } }),
    ]).then(([agentRes, ticketsRes, visasRes]) => {
      setAgent(agentRes.data);
      setTickets(ticketsRes.data);
      setVisas(visasRes.data);
      setLoading(false);
    }).catch(() => { toast.error('Agent not found'); navigate('/agents'); });
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('Delete this agent and all their records?')) return;
    await api.delete(`/agents/${id}`);
    toast.success('Agent deleted');
    navigate('/agents');
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E74C3C]"></div>
    </div>
  );
  if (!agent) return null;

  const totalRevenue = tickets.reduce((sum, t) => sum + t.selling_price, 0) + visas.reduce((sum, v) => sum + v.total_charges, 0);
  const totalCommission = tickets.reduce((sum, t) => sum + t.commission, 0) + visas.reduce((sum, v) => sum + v.total_commission, 0);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/agents')} className="p-2 rounded-full hover:bg-[#f1f3f4] transition-colors">
          <ArrowLeft size={22} className="text-[#5f6368]" />
        </button>
        <div className="flex-1">
          <h1 className="text-[22px] font-normal text-[#202124]">Agent Details</h1>
          <p className="text-[13px] text-[#5f6368]">{agent.name}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/agents', { state: { editId: agent.id } })} className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#dadce0] text-[13px] font-medium text-[#5f6368] hover:bg-[#f1f3f4] transition-colors">
            <Edit2 size={16} /> Edit
          </button>
          <button onClick={handleDelete} className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#fce8e6] text-[13px] font-medium text-[#d93025] hover:bg-[#fce8e6] transition-colors">
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-xl border border-[#e0e0e0] overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-[#E74C3C] to-[#C0392B] px-6 py-8">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-white text-3xl font-bold">
              {agent.name?.charAt(0)}
            </div>
            <div className="text-white">
              <h2 className="text-[24px] font-medium">{agent.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[12px] font-medium ${
                  agent.status === 'active' ? 'bg-[#e6f4ea] text-[#1e8e3e]' : 'bg-[#fce8e6] text-[#d93025]'
                }`}>
                  {agent.status === 'active' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                  {agent.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#f1f3f4] flex items-center justify-center">
              <Phone size={18} className="text-[#5f6368]" />
            </div>
            <div>
              <p className="text-[11px] text-[#5f6368] uppercase tracking-wider font-medium">Phone</p>
              <p className="text-[14px] text-[#202124]">{agent.phone || '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#f1f3f4] flex items-center justify-center">
              <Mail size={18} className="text-[#5f6368]" />
            </div>
            <div>
              <p className="text-[11px] text-[#5f6368] uppercase tracking-wider font-medium">Email</p>
              <p className="text-[14px] text-[#202124]">{agent.email || '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#f1f3f4] flex items-center justify-center">
              <Percent size={18} className="text-[#5f6368]" />
            </div>
            <div>
              <p className="text-[11px] text-[#5f6368] uppercase tracking-wider font-medium">Commission Rate</p>
              <p className="text-[14px] text-[#202124]">{agent.commission_rate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Tickets', value: tickets.length, icon: Ticket, bg: '#f0f0f0', color: '#E74C3C' },
          { label: 'Visas', value: visas.length, icon: Stamp, bg: '#e6f4ea', color: '#1e8e3e' },
          { label: 'Revenue', value: `SAR ${totalRevenue.toLocaleString()}`, icon: Banknote, bg: '#fef7e0', color: '#e37400' },
          { label: 'Commission', value: `SAR ${totalCommission.toLocaleString()}`, icon: Percent, bg: '#fce8e6', color: '#d93025' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-[#e0e0e0] p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: s.bg }}>
                <s.icon size={18} style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-[11px] text-[#5f6368] uppercase tracking-wider font-medium">{s.label}</p>
                <p className="text-[16px] font-medium text-[#202124]">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Tickets */}
      <div className="bg-white rounded-xl border border-[#e0e0e0] overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-[#e0e0e0] flex items-center justify-between">
          <h3 className="text-[14px] font-medium text-[#202124]">Recent Tickets</h3>
          <button onClick={() => navigate('/tickets')} className="text-[12px] text-[#E74C3C] font-medium hover:underline">View all</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e0e0e0]">
                <th className="text-left px-5 py-2.5 text-[11px] font-medium text-[#5f6368] uppercase tracking-wider">Passenger</th>
                <th className="text-left px-5 py-2.5 text-[11px] font-medium text-[#5f6368] uppercase tracking-wider">Route</th>
                <th className="text-left px-5 py-2.5 text-[11px] font-medium text-[#5f6368] uppercase tracking-wider">Amount</th>
                <th className="text-left px-5 py-2.5 text-[11px] font-medium text-[#5f6368] uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {tickets.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-[13px] text-[#5f6368]">No tickets yet</td></tr>
              ) : tickets.slice(0, 5).map(t => (
                <tr key={t.id} className="border-b border-[#f0f0f0] last:border-0 gmail-row cursor-pointer" onClick={() => navigate(`/tickets/${t.id}`)}>
                  <td className="px-5 py-3 text-[13px] text-[#202124] font-medium">{t.passenger_name}</td>
                  <td className="px-5 py-3 text-[13px] text-[#5f6368]">{t.flight_from} → {t.flight_to}</td>
                  <td className="px-5 py-3 text-[13px] text-[#202124]">SAR {t.selling_price.toLocaleString()}</td>
                  <td className="px-5 py-3">
                    <span className={`gmail-badge ${t.payment_status === 'paid' ? 'bg-[#e6f4ea] text-[#1e8e3e]' : 'bg-[#fef7e0] text-[#e37400]'}`}>{t.payment_status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Visas */}
      <div className="bg-white rounded-xl border border-[#e0e0e0] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#e0e0e0] flex items-center justify-between">
          <h3 className="text-[14px] font-medium text-[#202124]">Recent Visas</h3>
          <button onClick={() => navigate('/visas')} className="text-[12px] text-[#E74C3C] font-medium hover:underline">View all</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e0e0e0]">
                <th className="text-left px-5 py-2.5 text-[11px] font-medium text-[#5f6368] uppercase tracking-wider">Passenger</th>
                <th className="text-left px-5 py-2.5 text-[11px] font-medium text-[#5f6368] uppercase tracking-wider">Type</th>
                <th className="text-left px-5 py-2.5 text-[11px] font-medium text-[#5f6368] uppercase tracking-wider">Charges</th>
                <th className="text-left px-5 py-2.5 text-[11px] font-medium text-[#5f6368] uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {visas.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-[13px] text-[#5f6368]">No visas yet</td></tr>
              ) : visas.slice(0, 5).map(v => (
                <tr key={v.id} className="border-b border-[#f0f0f0] last:border-0 gmail-row cursor-pointer" onClick={() => navigate(`/visas/${v.id}`)}>
                  <td className="px-5 py-3 text-[13px] text-[#202124] font-medium">{v.passenger_name}</td>
                  <td className="px-5 py-3 text-[13px] text-[#5f6368] capitalize">{v.visa_type}</td>
                  <td className="px-5 py-3 text-[13px] text-[#202124]">SAR {v.total_charges.toLocaleString()}</td>
                  <td className="px-5 py-3">
                    <span className={`gmail-badge ${v.status === 'approved' ? 'bg-[#e6f4ea] text-[#1e8e3e]' : v.status === 'rejected' ? 'bg-[#fce8e6] text-[#d93025]' : 'bg-[#fef7e0] text-[#e37400]'}`}>{v.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
