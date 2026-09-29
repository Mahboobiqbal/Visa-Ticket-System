import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Search, Filter, X, Stamp, Download } from 'lucide-react';

const emptyForm = {
  agent_id: '', passenger_name: '', contact_number: '', passport_number: '',
  dob: '', passport_expiry: '', visa_type: 'umrah', visa_number: '',
  sponsor_number: '', occupation: '',
  visa_process_charges: '', medical_token_charges: '', agreement_paper_charges: '',
  extra_charges: '', received: '', purchase_rate: '', status: 'pending',
};

function Field({ label, children, required }) {
  return (
    <div>
      <label className="block text-[12px] font-medium text-[#5f6368] mb-1.5 uppercase tracking-wider">
        {label} {required && <span className="text-[#d93025]">*</span>}
      </label>
      {children}
    </div>
  );
}

function Input({ label, required, readOnly, className = '', ...props }) {
  return (
    <Field label={label} required={required}>
      <input
        {...props}
        readOnly={readOnly}
        className={`w-full px-3 py-2.5 border border-[#dadce0] rounded-lg text-[13px] text-[#202124] focus:border-[#E74C3C] focus:ring-0 outline-none transition-colors ${readOnly ? 'bg-[#f8f9fa] text-[#5f6368]' : 'bg-white'} ${className}`}
      />
    </Field>
  );
}

function Select({ label, required, readOnly, children, ...props }) {
  return (
    <Field label={label} required={required}>
      <select
        {...props}
        disabled={readOnly}
        className={`w-full px-3 py-2.5 border border-[#dadce0] rounded-lg text-[13px] text-[#202124] focus:border-[#E74C3C] focus:ring-0 outline-none transition-colors bg-white ${readOnly ? 'bg-[#f8f9fa] text-[#5f6368]' : ''}`}
      >
        {children}
      </select>
    </Field>
  );
}

export default function Visas() {
  const [visas, setVisas] = useState([]);
  const [agents, setAgents] = useState([]);
  const [visaTypes, setVisaTypes] = useState([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterAgent, setFilterAgent] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const searchTimeout = useRef(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    const params = {};
    if (filterAgent) params.agent_id = filterAgent;
    if (debouncedSearch) params.search = debouncedSearch;
    api.get('/visas/', { params }).then(res => setVisas(res.data)).catch(() => toast.error('Failed to load visas')).finally(() => setLoading(false));
  };

  const exportCSV = () => {
    const params = {};
    if (filterAgent) params.agent_id = filterAgent;
    if (debouncedSearch) params.search = debouncedSearch;
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
  }, []);

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(searchTimeout.current);
  }, [search]);

  useEffect(() => { load(); }, [filterAgent, debouncedSearch]);

  useEffect(() => {
    return () => clearTimeout(searchTimeout.current);
  }, []);

  useEffect(() => {
    if (location.state?.editId) {
      api.get(`/visas/${location.state.editId}`).then(res => openEdit(res.data)).catch(() => {});
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const openAdd = () => { setForm(emptyForm); setEditingId(null); setModalOpen(true); };
  const openEdit = (v) => {
    setForm({
      agent_id: v.agent_id || '', passenger_name: v.passenger_name || '',
      contact_number: v.contact_number || '', passport_number: v.passport_number || '',
      dob: v.dob || '', passport_expiry: v.passport_expiry || '',
      visa_type: v.visa_type || 'umrah', visa_number: v.visa_number || '',
      sponsor_number: v.sponsor_number || '', occupation: v.occupation || '',
      visa_process_charges: v.visa_process_charges || '', medical_token_charges: v.medical_token_charges || '',
      agreement_paper_charges: v.agreement_paper_charges || '', extra_charges: v.extra_charges || '',
      received: v.received || '', purchase_rate: v.purchase_rate || '', status: v.status || 'pending',
    });
    setEditingId(v.id);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      agent_id: Number(form.agent_id),
      passenger_name: form.passenger_name,
      contact_number: form.contact_number,
      passport_number: form.passport_number,
      dob: form.dob,
      passport_expiry: form.passport_expiry,
      visa_type: form.visa_type,
      visa_number: form.visa_number,
      sponsor_number: form.sponsor_number,
      occupation: form.occupation,
      visa_process_charges: Number(form.visa_process_charges) || 0,
      medical_token_charges: Number(form.medical_token_charges) || 0,
      agreement_paper_charges: Number(form.agreement_paper_charges) || 0,
      extra_charges: Number(form.extra_charges) || 0,
      received: Number(form.received) || 0,
      purchase_rate: Number(form.purchase_rate) || 0,
      status: form.status,
    };
    try {
      if (editingId) { await api.put(`/visas/${editingId}`, data); toast.success('Visa updated'); }
      else { await api.post('/visas/', data); toast.success('Visa created'); }
      setModalOpen(false);
      load();
    } catch (err) { toast.error(err.response?.data?.detail || 'Error saving visa'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this visa?')) return;
    try {
      await api.delete(`/visas/${id}`);
      toast.success('Visa deleted');
      load();
    } catch (err) {
      toast.error('Error deleting visa');
    }
  };

  const calcPreview = () => {
    const vp = Number(form.visa_process_charges) || 0;
    const mt = Number(form.medical_token_charges) || 0;
    const ap = Number(form.agreement_paper_charges) || 0;
    const ec = Number(form.extra_charges) || 0;
    const received = Number(form.received) || 0;
    const purchase = Number(form.purchase_rate) || 0;
    const total = vp + mt + ap + ec;
    const dues = total - received;
    const commission = total - purchase;
    return { total, dues, commission };
  };
  const preview = calcPreview();

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

      <div className="bg-white rounded-xl border border-[#e0e0e0] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E74C3C]"></div></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#e0e0e0]">
                  {['Agent', 'Passenger', 'Visa Type', 'Visa No', 'Charges', 'Received', 'Dues', 'Commission', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-[11px] font-medium text-[#5f6368] uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visas.length === 0 ? (
                  <tr><td colSpan={10} className="px-5 py-16 text-center">
                    <Stamp size={48} className="mx-auto text-[#dadce0] mb-3" />
                    <p className="text-[14px] text-[#5f6368]">No visa records found</p>
                  </td></tr>
                ) : visas.map((v) => (
                  <tr key={v.id} className="border-b border-[#f0f0f0] last:border-0 gmail-row cursor-pointer" onClick={() => navigate(`/visas/${v.id}`)}>
                    <td className="px-4 py-3 text-[13px] text-[#202124]">{v.agent_name}</td>
                    <td className="px-4 py-3 text-[13px] font-medium text-[#202124]">{v.passenger_name}</td>
                    <td className="px-4 py-3 text-[13px] text-[#5f6368] capitalize">{v.visa_type}</td>
                    <td className="px-4 py-3 text-[13px] text-[#5f6368]">{v.visa_number || '—'}</td>
                    <td className="px-4 py-3 text-[13px] text-[#202124]">PKR {v.total_charges.toLocaleString()}</td>
                    <td className="px-4 py-3 text-[13px] text-[#1e8e3e]">PKR {v.received.toLocaleString()}</td>
                    <td className="px-4 py-3 text-[13px] text-[#d93025] font-medium">{v.dues > 0 ? `PKR ${v.dues.toLocaleString()}` : '—'}</td>
                    <td className="px-4 py-3 text-[13px] text-[#1e8e3e] font-medium">PKR {v.commission.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`gmail-badge ${
                        v.status === 'approved' ? 'bg-[#e6f4ea] text-[#1e8e3e]' :
                        v.status === 'rejected' ? 'bg-[#fce8e6] text-[#d93025]' : 'bg-[#fef7e0] text-[#e37400]'
                      }`}>{v.status}</span>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
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
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Visa' : 'New Visa'} wide>
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* 1. Passenger Information */}
          <div className="border-t border-[#e0e0e0] pt-4">
            <p className="text-[12px] font-medium text-[#E74C3C] uppercase tracking-wider mb-3">Passenger Information</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Passenger Name" required value={form.passenger_name} onChange={e => setForm({...form, passenger_name: e.target.value})} />
            <Input label="Contact Number" value={form.contact_number} onChange={e => setForm({...form, contact_number: e.target.value})} />
            <Input label="Passport Number" value={form.passport_number} onChange={e => setForm({...form, passport_number: e.target.value})} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Date of Birth" type="date" value={form.dob} onChange={e => setForm({...form, dob: e.target.value})} />
            <Input label="Passport Expiry" type="date" value={form.passport_expiry} onChange={e => setForm({...form, passport_expiry: e.target.value})} />
            <Input label="Occupation" value={form.occupation} onChange={e => setForm({...form, occupation: e.target.value})} />
          </div>

          {/* 2. Visa Details */}
          <div className="border-t border-[#e0e0e0] pt-4">
            <p className="text-[12px] font-medium text-[#E74C3C] uppercase tracking-wider mb-3">Visa Details</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select label="Visa Type" value={form.visa_type} onChange={e => setForm({...form, visa_type: e.target.value})}>
              {visaTypes.map(v => <option key={v} value={v.trim()}>{v.trim()}</option>)}
            </Select>
            <Input label="Visa Number" value={form.visa_number} onChange={e => setForm({...form, visa_number: e.target.value})} />
            <Input label="Sponsor Number" value={form.sponsor_number} onChange={e => setForm({...form, sponsor_number: e.target.value})} />
          </div>

          {/* 3. Agent */}
          <div className="border-t border-[#e0e0e0] pt-4">
            <p className="text-[12px] font-medium text-[#E74C3C] uppercase tracking-wider mb-3">Agent</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Agent" required value={form.agent_id} onChange={e => setForm({...form, agent_id: e.target.value})}>
              <option value="">Select Agent</option>
              {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </Select>
            <Select label="Status" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </Select>
          </div>

          {/* 4. Visa Charges */}
          <div className="border-t border-[#e0e0e0] pt-4">
            <p className="text-[12px] font-medium text-[#E74C3C] uppercase tracking-wider mb-3">Visa Charges</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Visa Process Charges" type="number" step="0.01" min="0" value={form.visa_process_charges}
              onChange={e => setForm({...form, visa_process_charges: e.target.value})} placeholder="0" />
            <Input label="Medical Token Charges" type="number" step="0.01" min="0" value={form.medical_token_charges}
              onChange={e => setForm({...form, medical_token_charges: e.target.value})} placeholder="0" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Agreement Paper Charges" type="number" step="0.01" min="0" value={form.agreement_paper_charges}
              onChange={e => setForm({...form, agreement_paper_charges: e.target.value})} placeholder="0" />
            <Input label="Extra Charges" type="number" step="0.01" min="0" value={form.extra_charges}
              onChange={e => setForm({...form, extra_charges: e.target.value})} placeholder="0" />
          </div>
          <Input label="Total Charges" readOnly value={`PKR ${preview.total.toLocaleString()}`} />

          {/* 5. Payment */}
          <div className="border-t border-[#e0e0e0] pt-4">
            <p className="text-[12px] font-medium text-[#E74C3C] uppercase tracking-wider mb-3">Payment</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Received" type="number" step="0.01" min="0" value={form.received}
              onChange={e => setForm({...form, received: e.target.value})} placeholder="Amount received" />
          </div>
          <div className="bg-[#fef7e0] rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-[13px] font-medium text-[#5f6368]">Dues (Total Charges - Received)</span>
              <span className={`text-[16px] font-medium ${preview.dues > 0 ? 'text-[#d93025]' : 'text-[#1e8e3e]'}`}>
                PKR {preview.dues.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* 6. Purchase & Profit */}
          <div className="border-t border-[#e0e0e0] pt-4">
            <p className="text-[12px] font-medium text-[#E74C3C] uppercase tracking-wider mb-3">Purchase & Profit</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Purchase Rate" type="number" step="0.01" min="0" value={form.purchase_rate}
              onChange={e => setForm({...form, purchase_rate: e.target.value})} placeholder="Cost from supplier" />
          </div>
          <div className="bg-[#e6f4ea] rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-[13px] font-medium text-[#5f6368]">Commission (Total Charges - Purchase Rate)</span>
              <span className="text-[16px] font-medium text-[#1e8e3e]">
                PKR {preview.commission.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[#e0e0e0]">
            <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 rounded-full text-[13px] font-medium text-[#5f6368] hover:bg-[#f1f3f4] transition-colors">Cancel</button>
            <button type="submit" className="px-5 py-2.5 bg-[#E74C3C] text-white rounded-full text-[13px] font-medium hover:bg-[#C0392B] hover:shadow-[0_1px_3px_0_rgba(60,64,67,0.3)] transition-all">{editingId ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
