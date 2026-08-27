import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Search, Filter, X, Banknote } from 'lucide-react';

const emptyForm = {
  agent_id: '', visa_id: '', ticket_id: '', name: '',
  amount: '', date: '', payment_method: 'cash', comments: '',
};

export default function CashOut() {
  const [cashouts, setCashouts] = useState([]);
  const [agents, setAgents] = useState([]);
  const [search, setSearch] = useState('');
  const [filterAgent, setFilterAgent] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  const load = () => {
    const params = {};
    if (filterAgent) params.agent_id = filterAgent;
    if (search) params.search = search;
    api.get('/cashouts/', { params }).then(res => setCashouts(res.data));
  };

  useEffect(() => { api.get('/agents/').then(res => setAgents(res.data)); }, []);
  useEffect(() => { load(); }, [filterAgent, search]);

  const openAdd = () => { setForm(emptyForm); setEditingId(null); setModalOpen(true); };
  const openEdit = (c) => {
    setForm({
      agent_id: c.agent_id || '', visa_id: c.visa_id || '', ticket_id: c.ticket_id || '',
      name: c.name, amount: c.amount, date: c.date,
      payment_method: c.payment_method, comments: c.comments,
    });
    setEditingId(c.id);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      ...form,
      agent_id: form.agent_id ? Number(form.agent_id) : null,
      visa_id: form.visa_id ? Number(form.visa_id) : null,
      ticket_id: form.ticket_id ? Number(form.ticket_id) : null,
      amount: Number(form.amount) || 0,
    };
    try {
      if (editingId) { await api.put(`/cashouts/${editingId}`, data); toast.success('Updated'); }
      else { await api.post('/cashouts/', data); toast.success('Created'); }
      setModalOpen(false);
      load();
    } catch (err) { toast.error('Error saving'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete?')) return;
    await api.delete(`/cashouts/${id}`);
    toast.success('Deleted');
    load();
  };

  const totalCash = cashouts.filter(c => c.payment_method === 'cash').reduce((s, c) => s + c.amount, 0);
  const totalBank = cashouts.filter(c => c.payment_method === 'online_bank').reduce((s, c) => s + c.amount, 0);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-[22px] font-normal text-[#202124]">Cash Out</h1>
          <p className="text-[13px] text-[#5f6368] mt-0.5">{cashouts.length} record{cashouts.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-[#E74C3C] text-white px-5 py-2.5 rounded-full text-[13px] font-medium hover:bg-[#C0392B] transition-all">
          <Plus size={18} /> New Cash Out
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div className="bg-white rounded-xl border border-[#e0e0e0] p-5 hover:shadow-[0_1px_3px_0_rgba(60,64,67,0.3),0_4px_8px_3px_rgba(60,64,67,0.15)] transition-shadow">
          <p className="text-[12px] text-[#5f6368] uppercase tracking-wide font-medium">Total Cash Out</p>
          <p className="text-[24px] font-normal text-[#202124] mt-1">SAR {(totalCash + totalBank).toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-[#e0e0e0] p-5 hover:shadow-[0_1px_3px_0_rgba(60,64,67,0.3),0_4px_8px_3px_rgba(60,64,67,0.15)] transition-shadow">
          <p className="text-[12px] text-[#5f6368] uppercase tracking-wide font-medium">Cash Payments</p>
          <p className="text-[24px] font-normal text-[#e37400] mt-1">SAR {totalCash.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-[#e0e0e0] p-5 hover:shadow-[0_1px_3px_0_rgba(60,64,67,0.3),0_4px_8px_3px_rgba(60,64,67,0.15)] transition-shadow">
          <p className="text-[12px] text-[#5f6368] uppercase tracking-wide font-medium">Bank Transfers</p>
          <p className="text-[24px] font-normal text-[#E74C3C] mt-1">SAR {totalBank.toLocaleString()}</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-xl border border-[#e0e0e0] mb-4 overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex-1 flex items-center gap-2 bg-[#f1f3f4] rounded-full px-4 py-2">
            <Search size={18} className="text-[#5f6368]" />
            <input type="text" placeholder="Search cash out..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-transparent outline-none text-[13px] text-[#202124] placeholder:text-[#5f6368]" />
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
            {filterAgent && <button onClick={() => setFilterAgent('')} className="flex items-center gap-1 text-[13px] text-[#E74C3C] hover:underline"><X size={14} /> Clear</button>}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#e0e0e0] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e0e0e0]">
                {['Name', 'Agent', 'Amount', 'Date', 'Method', 'Comments', 'Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-2.5 text-[11px] font-medium text-[#5f6368] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cashouts.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-16 text-center">
                  <Banknote size={48} className="mx-auto text-[#dadce0] mb-3" />
                  <p className="text-[14px] text-[#5f6368]">No cash out records</p>
                </td></tr>
              ) : cashouts.map((c) => (
                <tr key={c.id} className="border-b border-[#f0f0f0] last:border-0 gmail-row cursor-pointer" onClick={() => navigate(`/cashout/${c.id}`)}>
                  <td className="px-5 py-3 text-[13px] font-medium text-[#202124]">{c.name}</td>
                  <td className="px-5 py-3 text-[13px] text-[#5f6368]">{c.agent_name || '—'}</td>
                  <td className="px-5 py-3 text-[13px] text-[#202124]">SAR {c.amount.toLocaleString()}</td>
                  <td className="px-5 py-3 text-[13px] text-[#5f6368]">{c.date}</td>
                  <td className="px-5 py-3">
                    <span className={`gmail-badge ${c.payment_method === 'cash' ? 'bg-[#fef7e0] text-[#e37400]' : 'bg-[#f0f0f0] text-[#E74C3C]'}`}>
                      {c.payment_method === 'cash' ? 'Cash' : 'Bank'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-[13px] text-[#5f6368] max-w-[180px] truncate">{c.comments || '—'}</td>
                  <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(c)} className="p-1.5 rounded-full hover:bg-[#f1f3f4]"><Edit2 size={16} className="text-[#5f6368]" /></button>
                      <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-full hover:bg-[#fce8e6]"><Trash2 size={16} className="text-[#d93025]" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Cash Out' : 'New Cash Out'}>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-medium text-[#5f6368] mb-1.5 uppercase tracking-wider">Name *</label>
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="w-full px-3 py-2.5 border border-[#dadce0] rounded-lg text-[13px] focus:border-[#E74C3C] focus:ring-0 outline-none" />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[#5f6368] mb-1.5 uppercase tracking-wider">Agent</label>
              <select value={form.agent_id} onChange={e => setForm({...form, agent_id: e.target.value})} className="w-full px-3 py-2.5 border border-[#dadce0] rounded-lg text-[13px] focus:ring-0 outline-none bg-white">
                <option value="">None</option>
                {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[#5f6368] mb-1.5 uppercase tracking-wider">Amount *</label>
              <input type="number" step="0.01" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required className="w-full px-3 py-2.5 border border-[#dadce0] rounded-lg text-[13px] focus:border-[#E74C3C] focus:ring-0 outline-none" />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[#5f6368] mb-1.5 uppercase tracking-wider">Date *</label>
              <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required className="w-full px-3 py-2.5 border border-[#dadce0] rounded-lg text-[13px] focus:border-[#E74C3C] focus:ring-0 outline-none" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[12px] font-medium text-[#5f6368] mb-1.5 uppercase tracking-wider">Payment Method</label>
              <select value={form.payment_method} onChange={e => setForm({...form, payment_method: e.target.value})} className="w-full px-3 py-2.5 border border-[#dadce0] rounded-lg text-[13px] focus:ring-0 outline-none bg-white">
                <option value="cash">Cash</option>
                <option value="online_bank">Online Bank</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[12px] font-medium text-[#5f6368] mb-1.5 uppercase tracking-wider">Comments</label>
            <textarea value={form.comments} onChange={e => setForm({...form, comments: e.target.value})} rows={3} className="w-full px-3 py-2.5 border border-[#dadce0] rounded-lg text-[13px] focus:border-[#E74C3C] focus:ring-0 outline-none resize-none" />
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
