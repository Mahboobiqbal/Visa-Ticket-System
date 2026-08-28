import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Search, Filter, X, Stamp, Download } from 'lucide-react';

const emptyForm = {
  agent_id: '', passenger_name: '', passport_number: '', phone: '',
  occupation: '', visa_type: 'umrah', package: 'basic',
  total_charges: '', package_price: '', total_commission: '',
  payment_received: '', payment_type: 'cash', payment_cash: '',
  payment_bank: '', total_expenses: '', analysis: '', status: 'pending',
};

function InputField({ label, type = "text", ...props }) {
  return (
    <div>
      <label className="block text-[12px] font-medium text-[#5f6368] mb-1.5 uppercase tracking-wider">{label}</label>
      <input type={type} {...props} className="w-full px-3 py-2.5 border border-[#dadce0] rounded-lg text-[13px] text-[#202124] focus:border-[#E74C3C] focus:ring-0 outline-none transition-colors" />
    </div>
  );
}

function SelectField({ label, children, ...props }) {
  return (
    <div>
      <label className="block text-[12px] font-medium text-[#5f6368] mb-1.5 uppercase tracking-wider">{label}</label>
      <select {...props} className="w-full px-3 py-2.5 border border-[#dadce0] rounded-lg text-[13px] text-[#202124] focus:border-[#E74C3C] focus:ring-0 outline-none transition-colors bg-white">
        {children}
      </select>
    </div>
  );
}

export default function Visas() {
  const [visas, setVisas] = useState([]);
  const [agents, setAgents] = useState([]);
  const [visaTypes, setVisaTypes] = useState([]);
  const [visaPackages, setVisaPackages] = useState([]);
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
    api.get('/visas/', { params }).then(res => setVisas(res.data));
  };

  const exportCSV = () => {
    const params = {};
    if (filterAgent) params.agent_id = filterAgent;
    if (search) params.search = search;
    api.get('/visas/export', { params, responseType: 'blob' }).then(res => {
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'visas_export.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    });
  };

  useEffect(() => {
    api.get('/agents/').then(res => setAgents(res.data));
    api.get('/settings/visa_types').then(res => setVisaTypes(res.data.value.split(','))).catch(() => {});
    api.get('/settings/visa_packages').then(res => setVisaPackages(res.data.value.split(','))).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [filterAgent, search]);

  const openAdd = () => { setForm(emptyForm); setEditingId(null); setModalOpen(true); };
  const openEdit = (v) => {
    setForm({
      agent_id: v.agent_id, passenger_name: v.passenger_name,
      passport_number: v.passport_number, phone: v.phone,
      occupation: v.occupation, visa_type: v.visa_type, package: v.package,
      total_charges: v.total_charges, package_price: v.package_price,
      total_commission: v.total_commission, payment_received: v.payment_received,
      payment_type: v.payment_type, payment_cash: v.payment_cash,
      payment_bank: v.payment_bank, total_expenses: v.total_expenses,
      analysis: v.analysis, status: v.status,
    });
    setEditingId(v.id);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = { ...form, agent_id: Number(form.agent_id), total_charges: Number(form.total_charges) || 0, package_price: Number(form.package_price) || 0, total_commission: Number(form.total_commission) || 0, payment_received: Number(form.payment_received) || 0, payment_cash: Number(form.payment_cash) || 0, payment_bank: Number(form.payment_bank) || 0, total_expenses: Number(form.total_expenses) || 0 };
    try {
      if (editingId) { await api.put(`/visas/${editingId}`, data); toast.success('Visa updated'); }
      else { await api.post('/visas/', data); toast.success('Visa created'); }
      setModalOpen(false);
      load();
    } catch (err) { toast.error('Error saving visa'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this visa?')) return;
    await api.delete(`/visas/${id}`);
    toast.success('Visa deleted');
    load();
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-[22px] font-normal text-[#202124]">Visa Processing</h1>
          <p className="text-[13px] text-[#5f6368] mt-0.5">{visas.length} record{visas.length !== 1 ? 's' : ''} total</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="flex items-center gap-2 bg-white border border-[#dadce0] text-[#5f6368] px-4 py-2.5 rounded-full text-[13px] font-medium hover:bg-[#f1f3f4] transition-all">
            <Download size={16} /> Export CSV
          </button>
          <button onClick={openAdd} className="flex items-center gap-2 bg-[#E74C3C] text-white px-5 py-2.5 rounded-full text-[13px] font-medium hover:bg-[#C0392B] hover:shadow-[0_1px_3px_0_rgba(60,64,67,0.3)] transition-all">
            <Plus size={18} /> New Visa
          </button>
        </div>
      </div>

      {/* Search & Filter bar */}
      <div className="bg-white rounded-xl border border-[#e0e0e0] mb-4 overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex-1 flex items-center gap-2 bg-[#f1f3f4] rounded-full px-4 py-2">
            <Search size={18} className="text-[#5f6368]" />
            <input type="text" placeholder="Search visas..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-transparent outline-none text-[13px] text-[#202124] placeholder:text-[#5f6368]" />
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
                {['Agent', 'Passenger', 'Type', 'Package', 'Charges', 'Commission', 'Payment', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-2.5 text-[11px] font-medium text-[#5f6368] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visas.length === 0 ? (
                <tr><td colSpan={9} className="px-5 py-16 text-center">
                  <Stamp size={48} className="mx-auto text-[#dadce0] mb-3" />
                  <p className="text-[14px] text-[#5f6368]">No visa records found</p>
                  <p className="text-[12px] text-[#9aa0a6] mt-1">Create your first visa record to get started</p>
                </td></tr>
              ) : visas.map((v) => (
                <tr key={v.id} className="border-b border-[#f0f0f0] last:border-0 gmail-row cursor-pointer" onClick={() => navigate(`/visas/${v.id}`)}>
                  <td className="px-5 py-3 text-[13px] text-[#202124]">{v.agent_name}</td>
                  <td className="px-5 py-3 text-[13px] font-medium text-[#202124]">{v.passenger_name}</td>
                  <td className="px-5 py-3 text-[13px] text-[#5f6368] capitalize">{v.visa_type}</td>
                  <td className="px-5 py-3 text-[13px] text-[#5f6368] capitalize">{v.package}</td>
                  <td className="px-5 py-3 text-[13px] text-[#202124]">SAR {v.total_charges.toLocaleString()}</td>
                  <td className="px-5 py-3 text-[13px] text-[#1e8e3e] font-medium">SAR {v.total_commission.toLocaleString()}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5">
                      {v.payment_cash > 0 && <span className="gmail-badge bg-[#fef7e0] text-[#e37400]">Cash {v.payment_cash}</span>}
                      {v.payment_bank > 0 && <span className="gmail-badge bg-[#f0f0f0] text-[#E74C3C]">Bank {v.payment_bank}</span>}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`gmail-badge ${
                      v.status === 'approved' ? 'bg-[#e6f4ea] text-[#1e8e3e]' :
                      v.status === 'rejected' ? 'bg-[#fce8e6] text-[#d93025]' : 'bg-[#fef7e0] text-[#e37400]'
                    }`}>{v.status}</span>
                  </td>
                  <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(v)} className="p-1.5 rounded-full hover:bg-[#f1f3f4]"><Edit2 size={16} className="text-[#5f6368]" /></button>
                      <button onClick={() => handleDelete(v.id)} className="p-1.5 rounded-full hover:bg-[#fce8e6]"><Trash2 size={16} className="text-[#d93025]" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Visa' : 'New Visa'} wide>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SelectField label="Agent *" value={form.agent_id} onChange={e => setForm({...form, agent_id: e.target.value})} required>
              <option value="">Select Agent</option>
              {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </SelectField>
            <InputField label="Passenger Name *" value={form.passenger_name} onChange={e => setForm({...form, passenger_name: e.target.value})} required />
            <InputField label="Phone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <InputField label="Passport Number" value={form.passport_number} onChange={e => setForm({...form, passport_number: e.target.value})} />
            <InputField label="Occupation" value={form.occupation} onChange={e => setForm({...form, occupation: e.target.value})} />
            <SelectField label="Visa Type" value={form.visa_type} onChange={e => setForm({...form, visa_type: e.target.value})}>
              {visaTypes.map(v => <option key={v} value={v.trim()}>{v.trim()}</option>)}
            </SelectField>
            <SelectField label="Package" value={form.package} onChange={e => setForm({...form, package: e.target.value})}>
              {visaPackages.map(p => <option key={p} value={p.trim()}>{p.trim()}</option>)}
            </SelectField>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <InputField label="Total Charges" type="number" step="0.01" value={form.total_charges} onChange={e => setForm({...form, total_charges: e.target.value})} />
            <InputField label="Package Price" type="number" step="0.01" value={form.package_price} onChange={e => setForm({...form, package_price: e.target.value})} />
            <InputField label="Commission" type="number" step="0.01" value={form.total_commission} onChange={e => setForm({...form, total_commission: e.target.value})} />
            <InputField label="Expenses" type="number" step="0.01" value={form.total_expenses} onChange={e => setForm({...form, total_expenses: e.target.value})} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <InputField label="Payment Received" type="number" step="0.01" value={form.payment_received} onChange={e => setForm({...form, payment_received: e.target.value})} />
            <InputField label="Cash Amount" type="number" step="0.01" value={form.payment_cash} onChange={e => setForm({...form, payment_cash: e.target.value})} />
            <InputField label="Bank Amount" type="number" step="0.01" value={form.payment_bank} onChange={e => setForm({...form, payment_bank: e.target.value})} />
            <SelectField label="Status" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </SelectField>
          </div>
          <div>
            <label className="block text-[12px] font-medium text-[#5f6368] mb-1.5 uppercase tracking-wider">Analysis</label>
            <textarea value={form.analysis} onChange={e => setForm({...form, analysis: e.target.value})} rows={3} className="w-full px-3 py-2.5 border border-[#dadce0] rounded-lg text-[13px] text-[#202124] focus:border-[#E74C3C] focus:ring-0 outline-none transition-colors resize-none" />
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
