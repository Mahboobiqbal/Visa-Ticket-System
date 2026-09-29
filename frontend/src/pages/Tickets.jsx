import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Search, Filter, X, Ticket, Download } from 'lucide-react';

const emptyForm = {
  agent_id: '', pnr_number: '',
  passenger_name: '', contact_number: '', dob: '', passport_number: '', passport_expiry: '',
  sector: '', airline: '',
  trip_type: 'one_way', departure_date: '', return_date: '',
  total_payment: '', received_payment: '', payment_method: 'cash', payment_remarks: '',
  purchase_rate: '',
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

export default function Tickets() {
  const [tickets, setTickets] = useState([]);
  const [agents, setAgents] = useState([]);
  const [airlines, setAirlines] = useState([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterAgent, setFilterAgent] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const searchTimeout = useRef(null);

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(searchTimeout.current);
  }, [search]);

  const load = useCallback(() => {
    setLoading(true);
    const params = {};
    if (filterAgent) params.agent_id = filterAgent;
    if (debouncedSearch) params.search = debouncedSearch;
    api.get('/tickets/', { params })
      .then(res => setTickets(res.data))
      .catch(() => toast.error('Failed to load tickets'))
      .finally(() => setLoading(false));
  }, [filterAgent, debouncedSearch]);

  const exportCSV = () => {
    const params = {};
    if (filterAgent) params.agent_id = filterAgent;
    if (debouncedSearch) params.search = debouncedSearch;
    api.get('/tickets/export', { params, responseType: 'blob' }).then(res => {
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'tickets_export.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    }).catch(() => toast.error('Export failed'));
  };

  useEffect(() => {
    api.get('/agents/').then(res => setAgents(res.data)).catch(() => {});
    api.get('/settings/airlines').then(res => setAirlines(res.data.value.split(','))).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (location.state?.editId) {
      const editId = location.state.editId;
      api.get(`/tickets/${editId}`).then(res => {
        openEdit(res.data);
      }).catch(() => {});
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const getSelectedAgent = () => agents.find(a => a.id === Number(form.agent_id));

  const openAdd = () => { setForm(emptyForm); setEditingId(null); setModalOpen(true); };
  const openEdit = (t) => {
    setForm({
      agent_id: t.agent_id || '', pnr_number: t.pnr_number || '',
      passenger_name: t.passenger_name || '', contact_number: t.contact_number || '',
      dob: t.dob || '', passport_number: t.passport_number || '',
      passport_expiry: t.passport_expiry || '',
      sector: t.sector || '', airline: t.airline || '',
      trip_type: t.trip_type || 'one_way', departure_date: t.departure_date || '',
      return_date: t.return_date || '',
      total_payment: t.total_payment || '', received_payment: t.received_payment || '',
      payment_method: t.payment_method || 'cash', payment_remarks: t.payment_remarks || '',
      purchase_rate: t.purchase_rate || '',
    });
    setEditingId(t.id);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      agent_id: Number(form.agent_id),
      pnr_number: form.pnr_number,
      passenger_name: form.passenger_name,
      contact_number: form.contact_number,
      dob: form.dob,
      passport_number: form.passport_number,
      passport_expiry: form.passport_expiry,
      sector: form.sector,
      airline: form.airline,
      trip_type: form.trip_type,
      departure_date: form.departure_date,
      return_date: form.trip_type === 'return' ? form.return_date : '',
      total_payment: Number(form.total_payment) || 0,
      received_payment: Number(form.received_payment) || 0,
      payment_method: form.payment_method,
      payment_remarks: form.payment_remarks,
      purchase_rate: Number(form.purchase_rate) || 0,
    };
    try {
      if (editingId) { await api.put(`/tickets/${editingId}`, data); toast.success('Ticket updated'); }
      else { await api.post('/tickets/', data); toast.success('Ticket created'); }
      setModalOpen(false);
      load();
    } catch (err) { toast.error(err.response?.data?.detail || 'Error saving ticket'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this ticket?')) return;
    try {
      await api.delete(`/tickets/${id}`);
      toast.success('Ticket deleted');
      load();
    } catch (err) { toast.error('Error deleting ticket'); }
  };

  const calcPreview = () => {
    const total = Number(form.total_payment) || 0;
    const received = Number(form.received_payment) || 0;
    const purchase = Number(form.purchase_rate) || 0;
    const agent = getSelectedAgent();
    const pct = agent ? (agent.commission_rate || 0) : 0;
    const dues = total - received;
    const profit = total - purchase;
    const agentComm = profit * pct / 100;
    return { dues, profit, agentComm, pct };
  };
  const preview = calcPreview();

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-[22px] font-normal text-[#202124]">Ticket Bookings</h1>
          <p className="text-[13px] text-[#5f6368] mt-0.5">{tickets.length} booking{tickets.length !== 1 ? 's' : ''} total</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="flex items-center gap-2 bg-white border border-[#dadce0] text-[#5f6368] px-4 py-2.5 rounded-full text-[13px] font-medium hover:bg-[#f1f3f4] transition-all">
            <Download size={16} /> Export CSV
          </button>
          <button onClick={openAdd} className="flex items-center gap-2 bg-[#E74C3C] text-white px-5 py-2.5 rounded-full text-[13px] font-medium hover:bg-[#C0392B] hover:shadow-[0_1px_3px_0_rgba(60,64,67,0.3)] transition-all">
            <Plus size={18} /> New Booking
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#e0e0e0] mb-4 overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex-1 flex items-center gap-2 bg-[#f1f3f4] rounded-full px-4 py-2">
            <Search size={18} className="text-[#5f6368]" />
            <input type="text" placeholder="Search bookings..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent outline-none text-[13px] text-[#202124] placeholder:text-[#5f6368]" />
            {search && <button onClick={() => setSearch('')} className="p-0.5 rounded-full hover:bg-[#e8eaed]"><X size={16} className="text-[#5f6368]" /></button>}
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-[13px] transition-colors ${showFilters ? 'bg-[#f0f0f0] text-[#2E2E2E]' : 'text-[#5f6368] hover:bg-[#f1f3f4]'}`}>
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
                  {['Agent', 'Passenger', 'PNR', 'Sector', 'Airline', 'Trip', 'Departure', 'Total', 'Dues', 'Payment', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-[11px] font-medium text-[#5f6368] uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tickets.length === 0 ? (
                  <tr><td colSpan={11} className="px-5 py-16 text-center">
                    <Ticket size={48} className="mx-auto text-[#dadce0] mb-3" />
                    <p className="text-[14px] text-[#5f6368]">No bookings found</p>
                  </td></tr>
                ) : tickets.map((t) => (
                  <tr key={t.id} className="border-b border-[#f0f0f0] last:border-0 gmail-row cursor-pointer" onClick={() => navigate(`/tickets/${t.id}`)}>
                    <td className="px-4 py-3 text-[13px] text-[#202124]">{t.agent_name}</td>
                    <td className="px-4 py-3 text-[13px] font-medium text-[#202124]">{t.passenger_name}</td>
                    <td className="px-4 py-3 text-[13px] text-[#5f6368]">{t.pnr_number || '—'}</td>
                    <td className="px-4 py-3 text-[13px] text-[#5f6368]">{t.sector}</td>
                    <td className="px-4 py-3 text-[13px] text-[#5f6368]">{t.airline}</td>
                    <td className="px-4 py-3 text-[13px] text-[#5f6368]">{t.trip_type === 'return' ? 'Return' : 'One Way'}</td>
                    <td className="px-4 py-3 text-[13px] text-[#5f6368]">{t.departure_date}</td>
                    <td className="px-4 py-3 text-[13px] text-[#202124]">PKR {t.total_payment.toLocaleString()}</td>
                    <td className="px-4 py-3 text-[13px] text-[#d93025] font-medium">{t.dues > 0 ? `PKR ${t.dues.toLocaleString()}` : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`gmail-badge ${t.payment_status === 'paid' ? 'bg-[#e6f4ea] text-[#1e8e3e]' : t.payment_status === 'partial' ? 'bg-[#fef7e0] text-[#e37400]' : 'bg-[#fce8e6] text-[#d93025]'}`}>{t.payment_status}</span>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(t)} className="p-1.5 rounded-full hover:bg-[#f1f3f4]"><Edit2 size={16} className="text-[#5f6368]" /></button>
                        <button onClick={() => handleDelete(t.id)} className="p-1.5 rounded-full hover:bg-[#fce8e6]"><Trash2 size={16} className="text-[#d93025]" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Booking' : 'New Booking'} wide>
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* 1. Agent + Commission % */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Agent" required value={form.agent_id} onChange={e => setForm({...form, agent_id: e.target.value})}>
              <option value="">Select Agent</option>
              {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </Select>
            <Input label="Agent Commission %" readOnly value={getSelectedAgent()?.commission_rate ? `${getSelectedAgent().commission_rate}%` : '—'} />
          </div>

          {/* 2. PNR */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="PNR Number" value={form.pnr_number} onChange={e => setForm({...form, pnr_number: e.target.value})} />
          </div>

          {/* 3. Passenger Info */}
          <div className="border-t border-[#e0e0e0] pt-4">
            <p className="text-[12px] font-medium text-[#E74C3C] uppercase tracking-wider mb-3">Passenger Information</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Passenger Name" required value={form.passenger_name} onChange={e => setForm({...form, passenger_name: e.target.value})} />
            <Input label="Contact Number" value={form.contact_number} onChange={e => setForm({...form, contact_number: e.target.value})} />
            <Input label="Date of Birth" type="date" value={form.dob} onChange={e => setForm({...form, dob: e.target.value})} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Passport Number" value={form.passport_number} onChange={e => setForm({...form, passport_number: e.target.value})} />
            <Input label="Passport Expiry" type="date" value={form.passport_expiry} onChange={e => setForm({...form, passport_expiry: e.target.value})} />
          </div>

          {/* 4. Flight Info */}
          <div className="border-t border-[#e0e0e0] pt-4">
            <p className="text-[12px] font-medium text-[#E74C3C] uppercase tracking-wider mb-3">Flight Information</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Sector" value={form.sector} onChange={e => setForm({...form, sector: e.target.value})} placeholder="e.g. JED-MNL" />
            <Select label="Airline" value={form.airline} onChange={e => setForm({...form, airline: e.target.value})}>
              <option value="">Select Airline</option>
              {airlines.map(a => <option key={a} value={a.trim()}>{a.trim()}</option>)}
            </Select>
          </div>

          {/* 5. Trip Type */}
          <div className="border-t border-[#e0e0e0] pt-4">
            <p className="text-[12px] font-medium text-[#E74C3C] uppercase tracking-wider mb-3">Trip Type</p>
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="trip_type" value="one_way" checked={form.trip_type === 'one_way'}
                onChange={e => setForm({...form, trip_type: e.target.value, return_date: ''})}
                className="w-4 h-4 text-[#E74C3C] focus:ring-[#E74C3C]" />
              <span className="text-[13px] text-[#202124] font-medium">One Way</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="trip_type" value="return" checked={form.trip_type === 'return'}
                onChange={e => setForm({...form, trip_type: e.target.value})}
                className="w-4 h-4 text-[#E74C3C] focus:ring-[#E74C3C]" />
              <span className="text-[13px] text-[#202124] font-medium">Return</span>
            </label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Departure Date" required type="datetime-local" value={form.departure_date} onChange={e => setForm({...form, departure_date: e.target.value})} />
            {form.trip_type === 'return' && (
              <Input label="Return / Arrival Date" type="datetime-local" value={form.return_date} onChange={e => setForm({...form, return_date: e.target.value})} />
            )}
          </div>

          {/* 6. Payment Info */}
          <div className="border-t border-[#e0e0e0] pt-4">
            <p className="text-[12px] font-medium text-[#E74C3C] uppercase tracking-wider mb-3">Payment Information</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Total Payment" type="number" step="0.01" min="0" required value={form.total_payment}
              onChange={e => setForm({...form, total_payment: e.target.value})} placeholder="Amount from passenger" />
            <Input label="Received Payment" type="number" step="0.01" min="0" value={form.received_payment}
              onChange={e => setForm({...form, received_payment: e.target.value})} placeholder="Amount received" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Payment Method" value={form.payment_method} onChange={e => setForm({...form, payment_method: e.target.value})}>
              <option value="cash">Cash</option>
              <option value="bank">Bank Transfer</option>
            </Select>
            <Input label="Payment Remarks" value={form.payment_remarks} onChange={e => setForm({...form, payment_remarks: e.target.value})} placeholder="e.g. Received 50,000 cash" />
          </div>

          {/* 7. Dues */}
          <div className="bg-[#fef7e0] rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-[13px] font-medium text-[#5f6368]">Dues (Total - Received)</span>
              <span className={`text-[16px] font-medium ${preview.dues > 0 ? 'text-[#d93025]' : 'text-[#1e8e3e]'}`}>
                PKR {preview.dues.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* 8. Purchase Rate */}
          <div className="border-t border-[#e0e0e0] pt-4">
            <p className="text-[12px] font-medium text-[#E74C3C] uppercase tracking-wider mb-3">Cost & Profit</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Purchase Rate" type="number" step="0.01" min="0" required value={form.purchase_rate}
              onChange={e => setForm({...form, purchase_rate: e.target.value})} placeholder="Cost from airline/supplier" />
          </div>

          {/* 9. Calculated profits */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[#e6f4ea] rounded-lg p-4">
              <p className="text-[11px] text-[#5f6368] uppercase tracking-wider font-medium mb-1">Ticket Profit / Commission</p>
              <p className="text-[18px] font-medium text-[#1e8e3e]">
                PKR {preview.profit.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-[#5f6368] mt-1">= Total Payment - Purchase Rate</p>
            </div>
            <div className="bg-[#e8f0fe] rounded-lg p-4">
              <p className="text-[11px] text-[#5f6368] uppercase tracking-wider font-medium mb-1">Agent Commission ({preview.pct}%)</p>
              <p className="text-[18px] font-medium text-[#1a73e8]">
                PKR {preview.agentComm.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-[#5f6368] mt-1">= Ticket Profit x {preview.pct}%</p>
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
