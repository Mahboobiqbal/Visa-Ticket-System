import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';
import PrintSlip, { SlipRow, SlipSection } from '../components/PrintSlip';
import {
  ArrowLeft, Edit2, Trash2, Plane, Calendar, CreditCard,
  User, Phone, Globe, FileText, Clock, CheckCircle, AlertCircle, Printer,
} from 'lucide-react';

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [printOpen, setPrintOpen] = useState(false);

  useEffect(() => {
    let active = true;
    api.get(`/tickets/${id}`)
      .then(res => { if (active) setTicket(res.data); })
      .catch(() => { if (active) { toast.error('Ticket not found'); navigate('/tickets'); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!confirm('Delete this ticket permanently?')) return;
    try {
      await api.delete(`/tickets/${id}`);
      toast.success('Ticket deleted');
      navigate('/tickets');
    } catch (err) {
      toast.error('Error deleting ticket');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E74C3C]"></div>
    </div>
  );
  if (!ticket) return null;

  const InfoRow = ({ icon: Icon, label, value, color = '#5f6368' }) => (
    <div className="flex items-start gap-3 py-3">
      <div className="w-9 h-9 rounded-full bg-[#f1f3f4] flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon size={18} style={{ color }} />
      </div>
      <div>
        <p className="text-[11px] text-[#5f6368] uppercase tracking-wider font-medium">{label}</p>
        <p className="text-[14px] text-[#202124] mt-0.5">{value || '—'}</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/tickets')} className="p-2 rounded-full hover:bg-[#f1f3f4] transition-colors">
          <ArrowLeft size={22} className="text-[#5f6368]" />
        </button>
        <div className="flex-1">
          <h1 className="text-[22px] font-normal text-[#202124]">Ticket Details</h1>
          <p className="text-[13px] text-[#5f6368]">Booking #{ticket.booking_ref || ticket.id}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setPrintOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#d4d4d4] text-[13px] font-medium text-[#4A4A4A] hover:bg-[#f0f0f0] transition-colors">
            <Printer size={16} /> Print Slip
          </button>
          <button onClick={() => navigate('/tickets', { state: { editId: ticket.id } })} className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#d4d4d4] text-[13px] font-medium text-[#4A4A4A] hover:bg-[#f0f0f0] transition-colors">
            <Edit2 size={16} /> Edit
          </button>
          <button onClick={handleDelete} className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#fce8e6] text-[13px] font-medium text-[#d93025] hover:bg-[#fce8e6] transition-colors">
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info Card */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#e0e0e0] overflow-hidden">
          {/* Status Banner */}
          <div className={`px-6 py-4 flex items-center gap-3 ${
            ticket.payment_status === 'paid' ? 'bg-[#e6f4ea]' :
            ticket.payment_status === 'partial' ? 'bg-[#fef7e0]' : 'bg-[#fce8e6]'
          }`}>
            {ticket.payment_status === 'paid' ? <CheckCircle size={20} className="text-[#1e8e3e]" /> :
             ticket.payment_status === 'partial' ? <Clock size={20} className="text-[#e37400]" /> :
             <AlertCircle size={20} className="text-[#d93025]" />}
            <span className={`text-[14px] font-medium capitalize ${
              ticket.payment_status === 'paid' ? 'text-[#1e8e3e]' :
              ticket.payment_status === 'partial' ? 'text-[#e37400]' : 'text-[#d93025]'
            }`}>Payment {ticket.payment_status}</span>
          </div>

          <div className="p-6">
            {/* Route Header */}
            <div className="flex items-center justify-between mb-6 pb-6 border-b border-[#f0f0f0]">
              <div className="text-center">
                <p className="text-[28px] font-normal text-[#202124]">{ticket.flight_from}</p>
                <p className="text-[12px] text-[#5f6368]">From</p>
              </div>
              <div className="flex-1 flex items-center justify-center px-6">
                <div className="w-full border-t-2 border-dashed border-[#dadce0] relative">
                  <Plane size={24} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#E74C3C] bg-white px-2" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-[28px] font-normal text-[#202124]">{ticket.flight_to}</p>
                <p className="text-[12px] text-[#5f6368]">To</p>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
              <InfoRow icon={User} label="Passenger" value={ticket.passenger_name} color="#202124" />
              <InfoRow icon={Globe} label="Airline" value={ticket.airline} color="#E74C3C" />
              <InfoRow icon={FileText} label="Passport" value={ticket.passport_number} />
              <InfoRow icon={Calendar} label="Passport Expiry" value={ticket.passport_expiry} />
              <InfoRow icon={Phone} label="Phone" value={ticket.phone} />
              <InfoRow icon={FileText} label="Booking Reference" value={ticket.booking_ref} />
              <InfoRow icon={Calendar} label="Departure" value={ticket.departure_date} color="#E74C3C" />
              <InfoRow icon={Calendar} label="Return" value={ticket.return_date} />
            </div>

            {ticket.notes && (
              <div className="mt-6 pt-4 border-t border-[#f0f0f0]">
                <p className="text-[11px] text-[#5f6368] uppercase tracking-wider font-medium mb-2">Notes</p>
                <p className="text-[13px] text-[#202124] bg-[#f8f9fa] rounded-lg p-4">{ticket.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Financial Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-[#e0e0e0] p-6">
            <h3 className="text-[13px] font-medium text-[#5f6368] uppercase tracking-wider mb-4">Financial Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-[#f0f0f0]">
                <span className="text-[13px] text-[#5f6368]">Agency Cost</span>
                <span className="text-[14px] text-[#202124] font-medium">SAR {ticket.ticket_price.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#f0f0f0]">
                <span className="text-[13px] text-[#5f6368]">Selling Price</span>
                <span className="text-[14px] text-[#202124] font-medium">SAR {ticket.selling_price.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#f0f0f0]">
                <span className="text-[13px] text-[#5f6368]">Commission</span>
                <span className="text-[14px] text-[#1e8e3e] font-medium">SAR {ticket.commission.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-[13px] text-[#5f6368]">Payment Received</span>
                <span className="text-[14px] text-[#E74C3C] font-medium">SAR {ticket.payment_received.toLocaleString()}</span>
              </div>
            </div>
            {ticket.selling_price > 0 && (
              <div className="mt-4 pt-4 border-t border-[#e0e0e0]">
                <div className="flex justify-between items-center">
                  <span className="text-[13px] font-medium text-[#202124]">Balance</span>
                  <span className={`text-[16px] font-medium ${
                    (ticket.selling_price - ticket.payment_received) > 0 ? 'text-[#d93025]' : 'text-[#1e8e3e]'
                  }`}>
                    SAR {(ticket.selling_price - ticket.payment_received).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-[#e0e0e0] p-6">
            <h3 className="text-[13px] font-medium text-[#5f6368] uppercase tracking-wider mb-3">Agent</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E74C3C] to-[#C0392B] flex items-center justify-center text-white font-medium text-sm">
                {ticket.agent_name?.charAt(0)}
              </div>
              <div>
                <p className="text-[14px] font-medium text-[#202124]">{ticket.agent_name}</p>
                <p className="text-[12px] text-[#5f6368]">Agent</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PrintSlip isOpen={printOpen} onClose={() => setPrintOpen(false)} title="TICKET BOOKING SLIP">
        <SlipRow label="Booking Ref" value={ticket.booking_ref} bold />
        <SlipRow label="Passenger" value={ticket.passenger_name} bold />
        <SlipRow label="Passport" value={ticket.passport_number} />
        <SlipRow label="Phone" value={ticket.phone} />
        <SlipSection title="Flight Details" />
        <SlipRow label="Airline" value={ticket.airline} />
        <SlipRow label="From" value={ticket.flight_from} />
        <SlipRow label="To" value={ticket.flight_to} />
        <SlipRow label="Departure" value={ticket.departure_date} />
        <SlipRow label="Return" value={ticket.return_date} />
        <SlipSection title="Payment" />
        <SlipRow label="Ticket Price" value={`SAR ${ticket.ticket_price.toLocaleString()}`} />
        <SlipRow label="Selling Price" value={`SAR ${ticket.selling_price.toLocaleString()}`} bold />
        <SlipRow label="Commission" value={`SAR ${ticket.commission.toLocaleString()}`} />
        <SlipRow label="Payment Received" value={`SAR ${ticket.payment_received.toLocaleString()}`} />
        <SlipRow label="Balance" value={`SAR ${(ticket.selling_price - ticket.payment_received).toLocaleString()}`} bold />
        <SlipRow label="Payment Status" value={ticket.payment_status.toUpperCase()} bold />
        <SlipRow label="Agent" value={ticket.agent_name} />
      </PrintSlip>
    </div>
  );
}
