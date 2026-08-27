import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Users, CheckCircle, XCircle } from 'lucide-react';

const emptyForm = { name: '', phone: '', email: '', commission_rate: 10, status: 'active' };

export default function Agents() {
  const [agents, setAgents] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const navigate = useNavigate();

  const load = () => api.get('/agents/').then(res => setAgents(res.data));
  useEffect(() => { load(); }, []);

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
    await api.delete(`/agents/${id}`);
    toast.success('Agent deleted');
    load();
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-[22px] font-normal text-[#202124]">Agents</h1>
          <p className="text-[13px] text-[#5f6368] mt-0.5">{agents.length} agent{agents.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-[#E74C3C] text-white px-5 py-2.5 rounded-full text-[13px] font-medium hover:bg-[#C0392B] transition-all">
          <Plus size={18} /> Add Agent
        </button>
      </div>

      {/* Agent Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl border border-[#e0e0e0] px-5 py-16 text-center">
            <Users size={48} className="mx-auto text-[#dadce0] mb-3" />
            <p className="text-[14px] text-[#5f6368]">No agents yet</p>
            <p className="text-[12px] text-[#9aa0a6] mt-1">Add your first agent to get started</p>
          </div>
        ) : agents.map((a) => (
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
