import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';
import { Search, Filter, X, Banknote, Download, Ticket, Stamp } from 'lucide-react';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [agents, setAgents] = useState([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterAgent, setFilterAgent] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const searchTimeout = useRef(null);

  const load = () => {
    setLoading(true);
    const params = {};
    if (filterAgent) params.agent_id = filterAgent;
    if (filterType) params.type = filterType;
    if (debouncedSearch) params.search = debouncedSearch;
    Promise.allSettled([
      api.get('/payments/', { params }),
      api.get('/payments/summary', { params: { agent_id: filterAgent || undefined } }),
    ]).then(([payRes, sumRes]) => {
      if (payRes.status === 'fulfilled') setPayments(payRes.value.data);
      if (sumRes.status === 'fulfilled') setSummary(sumRes.value.data);
    }).catch(() => toast.error('Failed to load payments'))
      .finally(() => setLoading(false));
  };

  const exportCSV = () => {
    const params = {};
    if (filterAgent) params.agent_id = filterAgent;
    if (filterType) params.type = filterType;
    if (debouncedSearch) params.search = debouncedSearch;
    api.get('/payments/', { params }).then(res => {
      const rows = res.data;
      const header = 'Type,Passenger,Agent,Booking Ref,Total,Received,Dues,Method,Remarks,Created\n';
      const csv = rows.map(r =>
        `${r.type},${r.passenger_name},${r.agent_name},${r.booking_ref},${r.total_amount},${r.received},${r.dues},${r.payment_method},${r.payment_remarks},${r.created_at}`
      ).join('\n');
      const blob = new Blob([header + csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'payments_export.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    });
  };

  useEffect(() => { api.get('/agents/').then(res => setAgents(res.data)); }, []);
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(searchTimeout.current);
  }, [search]);
  useEffect(() => { load(); }, [filterAgent, filterType, debouncedSearch]);

  const handleClick = (r) => {
    if (r.type === 'ticket') navigate(`/tickets/${r.id}`);
    else navigate(`/visas/${r.id}`);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-[22px] font-normal text-[#202124]">Payment Ledger</h1>
          <p className="text-[13px] text-[#5f6368] mt-0.5">{payments.length} payment{payments.length !== 1 ? 's' : ''} recorded</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="flex items-center gap-2 bg-white border border-[#dadce0] text-[#5f6368] px-4 py-2.5 rounded-full text-[13px] font-medium hover:bg-[#f1f3f4] transition-all">
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4">
          <div className="bg-white rounded-xl border border-[#e0e0e0] p-5 hover:shadow-[0_1px_3px_0_rgba(60,64,67,0.3)] transition-shadow">
            <p className="text-[12px] text-[#5f6368] uppercase tracking-wide font-medium">Total Expected</p>
            <p className="text-[22px] font-normal text-[#202124] mt-1">PKR {(summary.total_expected || 0).toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl border border-[#e0e0e0] p-5 hover:shadow-[0_1px_3px_0_rgba(60,64,67,0.3)] transition-shadow">
            <p className="text-[12px] text-[#5f6368] uppercase tracking-wide font-medium">Total Received</p>
            <p className="text-[22px] font-normal text-[#1e8e3e] mt-1">PKR {(summary.total_received || 0).toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl border border-[#e0e0e0] p-5 hover:shadow-[0_1px_3px_0_rgba(60,64,67,0.3)] transition-shadow">
            <p className="text-[12px] text-[#5f6368] uppercase tracking-wide font-medium">Total Dues</p>
            <p className="text-[22px] font-normal text-[#d93025] mt-1">PKR {(summary.total_dues || 0).toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl border border-[#e0e0e0] p-5 hover:shadow-[0_1px_3px_0_rgba(60,64,67,0.3)] transition-shadow">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-[12px] text-[#5f6368] uppercase tracking-wide font-medium">By Type</p>
                <div className="flex gap-3 mt-1.5">
                  <span className="text-[12px] text-[#5f6368]">Tickets: <span className="text-[#202124] font-medium">PKR {(summary.ticket_received || 0).toLocaleString()}</span></span>
                </div>
                <div className="flex gap-3 mt-0.5">
                  <span className="text-[12px] text-[#5f6368]">Visas: <span className="text-[#202124] font-medium">PKR {(summary.visa_received || 0).toLocaleString()}</span></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="bg-white rounded-xl border border-[#e0e0e0] mb-4 overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex-1 flex items-center gap-2 bg-[#f1f3f4] rounded-full px-4 py-2">
            <Search size={18} className="text-[#5f6368]" />
            <input type="text" placeholder="Search by passenger name or booking ref..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-transparent outline-none text-[13px] text-[#202124] placeholder:text-[#5f6368]" />
            {search && <button onClick={() => setSearch('')} className="p-0.5 rounded-full hover:bg-[#e8eaed]"><X size={16} className="text-[#5f6368]" /></button>}
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-[13px] transition-colors ${showFilters ? 'bg-[#f0f0f0] text-[#E74C3C]' : 'text-[#5f6368] hover:bg-[#f1f3f4]'}`}>
            <Filter size={16} /><span>Filter</span>
          </button>
        </div>
        {showFilters && (
          <div className="px-4 pb-3 flex items-center gap-3 border-t border-[#f0f0f0] pt-3">
            <select value={filterAgent} onChange={(e) => setFilterAgent(e.target.value)} className="px-3 py-2 border border-[#dadce0] rounded-lg text-[13px] focus:ring-0 outline-none bg-white">
              <option value="">All Agents</option>
              {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-3 py-2 border border-[#dadce0] rounded-lg text-[13px] focus:ring-0 outline-none bg-white">
              <option value="">All Types</option>
              <option value="ticket">Tickets</option>
              <option value="visa">Visas</option>
            </select>
            {(filterAgent || filterType) && (
              <button onClick={() => { setFilterAgent(''); setFilterType(''); }} className="flex items-center gap-1 text-[13px] text-[#E74C3C] hover:underline">
                <X size={14} /> Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#e0e0e0] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E74C3C]"></div></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#e0e0e0]">
                  {['Type', 'Passenger', 'Agent', 'Booking Ref', 'Total', 'Received', 'Dues', 'Method', 'Remarks'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-[11px] font-medium text-[#5f6368] uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr><td colSpan={9} className="px-5 py-16 text-center">
                    <Banknote size={48} className="mx-auto text-[#dadce0] mb-3" />
                    <p className="text-[14px] text-[#5f6368]">No payments found</p>
                  </td></tr>
                ) : payments.map((r, i) => (
                  <tr key={`${r.type}-${r.id}-${i}`} className="border-b border-[#f0f0f0] last:border-0 gmail-row cursor-pointer" onClick={() => handleClick(r)}>
                    <td className="px-4 py-3">
                      <span className={`gmail-badge flex items-center gap-1 w-fit ${r.type === 'ticket' ? 'bg-[#e8f0fe] text-[#1a73e8]' : 'bg-[#fef7e0] text-[#e37400]'}`}>
                        {r.type === 'ticket' ? <Ticket size={12} /> : <Stamp size={12} />}
                        {r.type === 'ticket' ? 'Ticket' : 'Visa'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[13px] font-medium text-[#202124]">{r.passenger_name}</td>
                    <td className="px-4 py-3 text-[13px] text-[#5f6368]">{r.agent_name || '—'}</td>
                    <td className="px-4 py-3 text-[13px] text-[#5f6368]">{r.booking_ref || '—'}</td>
                    <td className="px-4 py-3 text-[13px] text-[#202124]">PKR {(r.total_amount || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-[13px] text-[#1e8e3e] font-medium">PKR {(r.received || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-[13px] text-[#d93025] font-medium">{(r.dues || 0) > 0 ? `PKR ${(r.dues || 0).toLocaleString()}` : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`gmail-badge ${r.payment_method === 'cash' ? 'bg-[#fef7e0] text-[#e37400]' : 'bg-[#f0f0f0] text-[#E74C3C]'}`}>
                        {r.payment_method === 'cash' ? 'Cash' : 'Bank'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-[#5f6368] max-w-[150px] truncate">{r.payment_remarks || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
