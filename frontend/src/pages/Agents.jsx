import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Users, CheckCircle, XCircle, Search, Download, Filter, X } from 'lucide-react';

const emptyForm = { name: '', phone: '', email: '', commission_rate: 10, status: 'active' };

export default function Agents() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const searchTimeout = useRef(null);

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(searchTimeout.current);
  }, [search]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/agents/');
      setAgents(res.data);
    } catch (err) {
      toast.error('Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (location.state?.editId) {
      api.get(`/agents/${location.state.editId}`).then(res => {
        openEdit(res.data);
      }).catch(() => {});
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const openAdd = () => { setForm(emptyForm); setEditingId(null); setModalOpen(true); };
  const openEdit = (a) => {
    setForm({ name: a.name, phone: a.phone, email: a.email, commission_rate: a.commission_rate, status: a.status });
    setEditingId(a.id);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = { ...form, commission_rate: Number(form.commission_rate) || 10 };
    try {
      if (editingId) { await api.put(`/agents/${editingId}`, data); toast.success('Agent updated'); }
      else { await api.post('/agents/', data); toast.success('Agent created'); }
      setModalOpen(false);
      load();
    } catch (err) { toast.error('Error saving agent'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this agent and all their records?')) return;
    try {
      await api.delete(`/agents/${id}`);
      toast.success('Agent deleted');
      load();
    } catch (err) {
      toast.error('Error deleting agent');
    }
  };

  const exportCSV = () => {
    const rows = [
      ['Name', 'Phone', 'Email', 'Commission Rate', 'Status'],
      ...filteredAgents.map(a => [a.name, a.phone || '', a.email || '', a.commission_rate, a.status]),
    ];
    const csv = rows.map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'agents_export.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredAgents = agents.filter((agent) => {
    const matchesSearch = !debouncedSearch || [agent.name, agent.phone, agent.email].join(' ').toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchesStatus = !statusFilter || agent.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-[22px] font-normal text-[#202124]">Agents</h1>
          <p className="text-[13px] text-[#5f6368] mt-0.5">{agents.length} agent{agents.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="flex items-center gap-2 bg-white border border-[#dadce0] text-[#5f6368] px-4 py-2.5 rounded-full text-[13px] font-medium hover:bg-[#f1f3f4] transition-all">
            <Download size={16} /> Export CSV
          </button>
          <button onClick={openAdd} className="flex items-center gap-2 bg-[#E74C3C] text-white px-5 py-2.5 rounded-full text-[13px] font-medium hover:bg-[#C0392B] transition-all">
            <Plus size={18} /> Add Agent
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#e0e0e0] mb-4 overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex-1 flex items-center gap-2 bg-[#f1f3f4] rounded-full px-4 py-2">
            <Search size={18} className="text-[#5f6368]" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search agents..." className="w-full bg-transparent outline-none text-[13px] text-[#202124] placeholder:text-[#5f6368]" />
            {search && <button onClick={() => setSearch('')} className="p-0.5 rounded-full hover:bg-[#e8eaed]"><X size={16} className="text-[#5f6368]" /></button>}
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-[13px] transition-colors ${showFilters ? 'bg-[#f0f0f0] text-[#2E2E2E]' : 'text-[#5f6368] hover:bg-[#f1f3f4]'}`}>
            <Filter size={16} /><span>Filter</span>
          </button>
        </div>
        {showFilters && (
          <div className="px-4 pb-3 flex items-center gap-3 border-t border-[#f0f0f0] pt-3">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-[#dadce0] rounded-lg text-[13px] focus:ring-0 outline-none bg-white">
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            {statusFilter && <button onClick={() => setStatusFilter('')} className="flex items-center gap-1 text-[13px] text-[#E74C3C] hover:underline"><X size={14} /> Clear</button>}
          </div>
        )}
      </div>

      {/* Agent Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full bg-white rounded-xl border border-[#e0e0e0] px-5 py-16 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-[#E74C3C]" />
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl border border-[#e0e0e0] px-5 py-16 text-center">
            <Users size={48} className="mx-auto text-[#dadce0] mb-3" />
            <p className="text-[14px] text-[#5f6368]">No agents found</p>
            <p className="text-[12px] text-[#9aa0a6] mt-1">Try a different search or add your first agent</p>
          </div>
        ) : filteredAgents.map((a) => (
          <div key={a.id} className="bg-white rounded-xl border border-[#e0e0e0] overflow-hidden hover:shadow-[0_1px_3px_0_rgba(60,64,67,0.3),0_4px_8px_3px_rgba(60,64,67,0.15)] transition-all cursor-pointer group" onClick={() => navigate(`/agents/${a.id}`)}>
            {/* Color bar */}
            <div className={`h-1.5 ${a.status === 'active' ? 'bg-gradient-to-r from-[#E74C3C] to-[#C0392B]' : 'bg-[#dadce0]'}`}></div>
            <div className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#E74C3C] to-[#C0392B] flex items-center justify-center text-white text-lg font-bold">
                    {a.name?.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-[15px] font-medium text-[#202124] group-hover:text-[#E74C3C] transition-colors">{a.name}</h3>
                    <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                      a.status === 'active' ? 'text-[#1e8e3e]' : 'text-[#d93025]'
                    }`}>
                      {a.status === 'active' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                      {a.status}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => openEdit(a)} className="p-1.5 rounded-full hover:bg-[#f1f3f4]"><Edit2 size={16} className="text-[#5f6368]" /></button>
                  <button onClick={() => handleDelete(a.id)} className="p-1.5 rounded-full hover:bg-[#fce8e6]"><Trash2 size={16} className="text-[#d93025]" /></button>
                </div>
              </div>
              <div className="space-y-2 text-[13px]">
                {a.phone && <p className="text-[#5f6368]">📱 {a.phone}</p>}
                {a.email && <p className="text-[#5f6368]">✉️ {a.email}</p>}
                <p className="text-[#202124] font-medium">Commission: {a.commission_rate}%</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Agent' : 'New Agent'}>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-medium text-[#5f6368] mb-1.5 uppercase tracking-wider">Name *</label>
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="w-full px-3 py-2.5 border border-[#dadce0] rounded-lg text-[13px] focus:border-[#E74C3C] focus:ring-0 outline-none" />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[#5f6368] mb-1.5 uppercase tracking-wider">Phone</label>
              <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full px-3 py-2.5 border border-[#dadce0] rounded-lg text-[13px] focus:border-[#E74C3C] focus:ring-0 outline-none" />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[#5f6368] mb-1.5 uppercase tracking-wider">Email</label>
              <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-3 py-2.5 border border-[#dadce0] rounded-lg text-[13px] focus:border-[#E74C3C] focus:ring-0 outline-none" />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[#5f6368] mb-1.5 uppercase tracking-wider">Commission Rate (%)</label>
              <input type="number" step="0.1" value={form.commission_rate} onChange={e => setForm({...form, commission_rate: e.target.value})} className="w-full px-3 py-2.5 border border-[#dadce0] rounded-lg text-[13px] focus:border-[#E74C3C] focus:ring-0 outline-none" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[12px] font-medium text-[#5f6368] mb-1.5 uppercase tracking-wider">Status</label>
              <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full px-3 py-2.5 border border-[#dadce0] rounded-lg text-[13px] focus:ring-0 outline-none bg-white">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-[#e0e0e0]">
            <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 rounded-full text-[13px] font-medium text-[#5f6368] hover:bg-[#f1f3f4]">Cancel</button>
            <button type="submit" className="px-5 py-2.5 bg-[#E74C3C] text-white rounded-full text-[13px] font-medium hover:bg-[#C0392B]">{editingId ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
