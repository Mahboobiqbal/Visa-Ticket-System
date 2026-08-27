import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Search, Filter, X, Ticket } from 'lucide-react';

const emptyForm = {
  agent_id: '', passenger_name: '', passport_number: '', passport_expiry: '',
  phone: '', airline: '', flight_from: '', flight_to: '', booking_ref: '',
  departure_date: '', return_date: '', ticket_price: '', selling_price: '',
  commission: '', payment_received: '', payment_status: 'pending', notes: '',
};

export default function Tickets() {
  const [tickets, setTickets] = useState([]);
  const [agents, setAgents] = useState([]);
  const [airlines, setAirlines] = useState([]);
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
    api.get('/tickets/', { params }).then(res => setTickets(res.data));
  };

  useEffect(() => {
    api.get('/agents/').then(res => setAgents(res.data));
    api.get('/settings/airlines').then(res => setAirlines(res.data.value.split(','))).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [filterAgent, search]);

  const openAdd = () => { setForm(emptyForm); setEditingId(null); setModalOpen(true); };
  const openEdit = (t) => {
    setForm({
      agent_id: t.agent_id, passenger_name: t.passenger_name,
      passport_number: t.passport_number, passport_expiry: t.passport_expiry,
      phone: t.phone, airline: t.airline, flight_from: t.flight_from,
      flight_to: t.flight_to, booking_ref: t.booking_ref,
      departure_date: t.departure_date, return_date: t.return_date,
      ticket_price: t.ticket_price, selling_price: t.selling_price,
      commission: t.commission, payment_received: t.payment_received,
      payment_status: t.payment_status, notes: t.notes,
    });
    setEditingId(t.id);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = { ...form, agent_id: Number(form.agent_id), ticket_price: Number(form.ticket_price) || 0, selling_price: Number(form.selling_price) || 0, commission: Number(form.commission) || 0, payment_received: Number(form.payment_received) || 0 };
    try {
      if (editingId) { await api.put(`/tickets/${editingId}`, data); toast.success('Ticket updated'); }
      else { await api.post('/tickets/', data); toast.success('Ticket created'); }
      setModalOpen(false);
      load();
    } catch (err) { toast.error('Error saving ticket'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this ticket?')) return;
    await api.delete(`/tickets/${id}`);
    toast.success('Ticket deleted');
    load();
  };

  const InputField = ({ label, ...props }) => (
    <div>
      <label className="block text-[12px] font-medium text-[#5f6368] mb-1.5 uppercase tracking-wider">{label}</label>
      <input {...props} className="w-full px-3 py-2.5 border border-[#dadce0] rounded-lg text-[13px] text-[#202124] focus:border-[#E74C3C] focus:ring-0 outline-none transition-colors" />
    </div>
  );

  const SelectField = ({ label, children, ...props }) => (
    <div>
      <label className="block text-[12px] font-medium text-[#5f6368] mb-1.5 uppercase tracking-wider">{label}</label>
      <select {...props} className="w-full px-3 py-2.5 border border-[#dadce0] rounded-lg text-[13px] text-[#202124] focus:border-[#E74C3C] focus:ring-0 outline-none transition-colors bg-white">
        {children}
      </select>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-[22px] font-normal text-[#202124]">Ticket Bookings</h1>
          <p className="text-[13px] text-[#5f6368] mt-0.5">{tickets.length} booking{tickets.length !== 1 ? 's' : ''} total</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-[#E74C3C] text-white px-5 py-2.5 rounded-full text-[13px] font-medium hover:bg-[#C0392B] hover:shadow-[0_1px_3px_0_rgba(60,64,67,0.3)] transition-all">
          <Plus size={18} /> New Booking
        </button>
      </div>

      {/* Search & Filter bar */}
      <div className="bg-white rounded-xl border border-[#e0e0e0] mb-4 overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex-1 flex items-center gap-2 bg-[#f1f3f4] rounded-full px-4 py-2">
            <Search size={18} className="text-[#5f6368]" />
            <input
              type="text"
              placeholder="Search bookings..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent outline-none text-[13px] text-[#202124] placeholder:text-[#5f6368]"
            />
            {search && (
              <button onClick={() => setSearch('')} className="p-0.5 rounded-full hover:bg-[#e8eaed]">
                <X size={16} className="text-[#5f6368]" />
              </button>
            )}
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-[13px] transition-colors ${showFilters ? 'bg-[#f0f0f0] text-[#2E2E2E]' : 'text-[#5f6368] hover:bg-[#f1f3f4]'}`}>
            <Filter size={16} />
            <span>Filter</span>
          </button>
        </div>
        {showFilters && (
          <div className="px-4 pb-3 flex items-center gap-3 border-t border-[#f0f0f0] pt-3">
            <select value={filterAgent} onChange={(e) => setFilterAgent(e.target.value)} className="px-3 py-2 border border-[#dadce0] rounded-lg text-[13px] focus:ring-0 outline-none bg-white">
              <option value="">All Agents</option>
              {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            {filterAgent && (
              <button onClick={() => setFilterAgent('')} className="flex items-center gap-1 text-[13px] text-[#E74C3C] hover:underline">
                <X size={14} /> Clear filter
              </button>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#e0e0e0] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e0e0e0]">
                {['Agent', 'Passenger', 'Route', 'Airline', 'Departure', 'Price', 'Commission', 'Payment', 'Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-2.5 text-[11px] font-medium text-[#5f6368] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tickets.length === 0 ? (
                <tr><td colSpan={9} className="px-5 py-16 text-center">
                  <Ticket size={48} className="mx-auto text-[#dadce0] mb-3" />
                  <p className="text-[14px] text-[#5f6368]">No bookings found</p>
                  <p className="text-[12px] text-[#9aa0a6] mt-1">Create your first booking to get started</p>
                </td></tr>
              ) : tickets.map((t) => (
                <tr key={t.id} className="border-b border-[#f0f0f0] last:border-0 gmail-row cursor-pointer" onClick={() => navigate(`/tickets/${t.id}`)}>
                  <td className="px-5 py-3 text-[13px] text-[#202124]">{t.agent_name}</td>
                  <td className="px-5 py-3 text-[13px] font-medium text-[#202124]">{t.passenger_name}</td>
                  <td className="px-5 py-3 text-[13px] text-[#5f6368]">{t.flight_from} → {t.flight_to}</td>
                  <td className="px-5 py-3 text-[13px] text-[#5f6368]">{t.airline}</td>
                  <td className="px-5 py-3 text-[13px] text-[#5f6368]">{t.departure_date}</td>
                  <td className="px-5 py-3 text-[13px] text-[#202124]">SAR {t.selling_price.toLocaleString()}</td>
                  <td className="px-5 py-3 text-[13px] text-[#1e8e3e] font-medium">SAR {t.commission.toLocaleString()}</td>
                  <td className="px-5 py-3">
                    <span className={`gmail-badge ${
                      t.payment_status === 'paid' ? 'bg-[#e6f4ea] text-[#1e8e3e]' : 'bg-[#fef7e0] text-[#e37400]'
                    }`}>{t.payment_status}</span>
                  </td>
                  <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
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
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Booking' : 'New Booking'} wide>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SelectField label="Agent *" value={form.agent_id} onChange={e => setForm({...form, agent_id: e.target.value})} required>
              <option value="">Select Agent</option>
              {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </SelectField>
            <InputField label="Passenger Name *" value={form.passenger_name} onChange={e => setForm({...form, passenger_name: e.target.value})} required />
            <InputField label="Phone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <InputField label="Passport Number" value={form.passport_number} onChange={e => setForm({...form, passport_number: e.target.value})} />
            <InputField label="Passport Expiry" type="date" value={form.passport_expiry} onChange={e => setForm({...form, passport_expiry: e.target.value})} />
            <InputField label="Booking Ref" value={form.booking_ref} onChange={e => setForm({...form, booking_ref: e.target.value})} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SelectField label="Airline" value={form.airline} onChange={e => setForm({...form, airline: e.target.value})}>
              <option value="">Select Airline</option>
              {airlines.map(a => <option key={a} value={a.trim()}>{a.trim()}</option>)}
            </SelectField>
            <InputField label="From *" value={form.flight_from} onChange={e => setForm({...form, flight_from: e.target.value})} required placeholder="e.g. JED" />
            <InputField label="To *" value={form.flight_to} onChange={e => setForm({...form, flight_to: e.target.value})} required placeholder="e.g. MNL" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <InputField label="Departure Date *" type="date" value={form.departure_date} onChange={e => setForm({...form, departure_date: e.target.value})} required />
            <InputField label="Return Date" type="date" value={form.return_date} onChange={e => setForm({...form, return_date: e.target.value})} />
            <SelectField label="Payment Status" value={form.payment_status} onChange={e => setForm({...form, payment_status: e.target.value})}>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
            </SelectField>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <InputField label="Ticket Price" type="number" step="0.01" value={form.ticket_price} onChange={e => setForm({...form, ticket_price: e.target.value})} />
            <InputField label="Selling Price" type="number" step="0.01" value={form.selling_price} onChange={e => setForm({...form, selling_price: e.target.value})} />
            <InputField label="Commission" type="number" step="0.01" value={form.commission} onChange={e => setForm({...form, commission: e.target.value})} />
            <InputField label="Payment Received" type="number" step="0.01" value={form.payment_received} onChange={e => setForm({...form, payment_received: e.target.value})} />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-[#5f6368] mb-1.5 uppercase tracking-wider">Notes</label>
            <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={3} className="w-full px-3 py-2.5 border border-[#dadce0] rounded-lg text-[13px] text-[#202124] focus:border-[#E74C3C] focus:ring-0 outline-none transition-colors resize-none" />
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
