import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';
import PrintSlip, { SlipRow, SlipSection } from '../components/PrintSlip';
import {
  ArrowLeft, Edit2, Trash2, Plane, Calendar, CreditCard,
  User, Phone, Globe, FileText, Clock, CheckCircle, AlertCircle, Printer, Hash,
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
          <p className="text-[13px] text-[#5f6368]">PNR {ticket.pnr_number || '—'} — {ticket.passenger_name}</p>
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
            <span className="ml-auto text-[12px] text-[#5f6368] bg-white/60 px-3 py-1 rounded-full font-medium">
              {ticket.trip_type === 'return' ? 'Return Flight' : 'One Way'}
            </span>
          </div>

          <div className="p-6">
            {/* Route Header */}
            <div className="flex items-center justify-between mb-6 pb-6 border-b border-[#f0f0f0]">
              <div className="text-center">
                <p className="text-[28px] font-normal text-[#202124]">{ticket.sector || '—'}</p>
                <p className="text-[12px] text-[#5f6368]">Sector</p>
              </div>
              <div className="flex-1 flex items-center justify-center px-6">
                <div className="w-full border-t-2 border-dashed border-[#dadce0] relative">
                  <Plane size={24} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#E74C3C] bg-white px-2" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-[16px] font-medium text-[#202124]">{ticket.airline || '—'}</p>
                <p className="text-[12px] text-[#5f6368]">Airline</p>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
              <InfoRow icon={Hash} label="PNR Number" value={ticket.pnr_number} color="#E74C3C" />
              <InfoRow icon={User} label="Passenger" value={ticket.passenger_name} color="#202124" />
              <InfoRow icon={Phone} label="Contact Number" value={ticket.contact_number} />
              <InfoRow icon={Calendar} label="Date of Birth" value={ticket.dob} />
              <InfoRow icon={FileText} label="Passport Number" value={ticket.passport_number} />
              <InfoRow icon={Calendar} label="Passport Expiry" value={ticket.passport_expiry} />
              <InfoRow icon={Globe} label="Sector" value={ticket.sector} color="#E74C3C" />
              <InfoRow icon={Globe} label="Airline" value={ticket.airline} />
              <InfoRow icon={Calendar} label="Departure" value={ticket.departure_date} color="#E74C3C" />
              {ticket.trip_type === 'return' && (
                <InfoRow icon={Calendar} label="Return / Arrival" value={ticket.return_date} />
              )}
            </div>

            {ticket.payment_remarks && (
              <div className="mt-6 pt-4 border-t border-[#f0f0f0]">
                <p className="text-[11px] text-[#5f6368] uppercase tracking-wider font-medium mb-2">Payment Remarks</p>
                <p className="text-[13px] text-[#202124] bg-[#f8f9fa] rounded-lg p-4">{ticket.payment_remarks}</p>
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
                <span className="text-[13px] text-[#5f6368]">Total Payment</span>
                <span className="text-[14px] text-[#202124] font-medium">PKR {ticket.total_payment.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#f0f0f0]">
                <span className="text-[13px] text-[#5f6368]">Received Payment</span>
                <span className="text-[14px] text-[#1e8e3e] font-medium">PKR {ticket.received_payment.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#f0f0f0]">
                <span className="text-[13px] text-[#5f6368]">Dues</span>
                <span className={`text-[14px] font-medium ${ticket.dues > 0 ? 'text-[#d93025]' : 'text-[#1e8e3e]'}`}>
                  PKR {ticket.dues.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#f0f0f0]">
                <span className="text-[13px] text-[#5f6368]">Payment Method</span>
                <span className="text-[13px] text-[#202124] font-medium capitalize">{ticket.payment_method || 'Cash'}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#e0e0e0] p-6">
            <h3 className="text-[13px] font-medium text-[#5f6368] uppercase tracking-wider mb-4">Cost & Profit</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-[#f0f0f0]">
                <span className="text-[13px] text-[#5f6368]">Purchase Rate</span>
                <span className="text-[14px] text-[#202124] font-medium">PKR {ticket.purchase_rate.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#f0f0f0]">
                <span className="text-[13px] text-[#5f6368]">Ticket Profit</span>
                <span className={`text-[14px] font-medium ${ticket.ticket_profit >= 0 ? 'text-[#1e8e3e]' : 'text-[#d93025]'}`}>
                  PKR {ticket.ticket_profit.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-[13px] text-[#5f6368]">Agent Commission ({ticket.agent_commission_percentage || 0}%)</span>
                <span className="text-[14px] text-[#1a73e8] font-medium">PKR {ticket.agent_commission.toLocaleString()}</span>
              </div>
            </div>
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
        <SlipRow label="PNR" value={ticket.pnr_number} bold />
        <SlipRow label="Passenger" value={ticket.passenger_name} bold />
        <SlipRow label="Contact" value={ticket.contact_number} />
        <SlipRow label="Passport" value={ticket.passport_number} />
        <SlipSection title="Flight Details" />
        <SlipRow label="Airline" value={ticket.airline} />
        <SlipRow label="Sector" value={ticket.sector} />
        <SlipRow label="Trip Type" value={ticket.trip_type === 'return' ? 'Return' : 'One Way'} />
        <SlipRow label="Departure" value={ticket.departure_date} />
        {ticket.trip_type === 'return' && <SlipRow label="Return" value={ticket.return_date} />}
        <SlipSection title="Payment" />
        <SlipRow label="Total Payment" value={`PKR ${ticket.total_payment.toLocaleString()}`} bold />
        <SlipRow label="Received" value={`PKR ${ticket.received_payment.toLocaleString()}`} />
        <SlipRow label="Dues" value={`PKR ${ticket.dues.toLocaleString()}`} bold />
        <SlipRow label="Purchase Rate" value={`PKR ${ticket.purchase_rate.toLocaleString()}`} />
        <SlipRow label="Ticket Profit" value={`PKR ${ticket.ticket_profit.toLocaleString()}`} bold />
        <SlipRow label="Agent Commission" value={`PKR ${ticket.agent_commission.toLocaleString()}`} bold />
        <SlipRow label="Payment Status" value={ticket.payment_status.toUpperCase()} bold />
        <SlipRow label="Agent" value={ticket.agent_name} />
        {ticket.payment_remarks && <SlipRow label="Remarks" value={ticket.payment_remarks} />}
      </PrintSlip>
    </div>
  );
}
