import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';
import PrintSlip, { SlipRow, SlipSection } from '../components/PrintSlip';
import {
  ArrowLeft, Edit2, Trash2, User, Phone, Briefcase, Globe,
  CreditCard, CheckCircle, XCircle, Clock, Banknote, FileText, Printer,
} from 'lucide-react';

export default function VisaDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [visa, setVisa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [printOpen, setPrintOpen] = useState(false);

  useEffect(() => {
    api.get(`/visas/${id}`).then(res => { setVisa(res.data); setLoading(false); }).catch(() => { toast.error('Visa not found'); navigate('/visas'); });
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('Delete this visa permanently?')) return;
    await api.delete(`/visas/${id}`);
    toast.success('Visa deleted');
    navigate('/visas');
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E74C3C]"></div>
    </div>
  );
  if (!visa) return null;

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

  const statusConfig = {
    approved: { bg: 'bg-[#e6f4ea]', text: 'text-[#1e8e3e]', icon: CheckCircle, label: 'Approved' },
    rejected: { bg: 'bg-[#fce8e6]', text: 'text-[#d93025]', icon: XCircle, label: 'Rejected' },
    pending: { bg: 'bg-[#fef7e0]', text: 'text-[#e37400]', icon: Clock, label: 'Pending' },
  };
  const status = statusConfig[visa.status] || statusConfig.pending;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/visas')} className="p-2 rounded-full hover:bg-[#f1f3f4] transition-colors">
          <ArrowLeft size={22} className="text-[#5f6368]" />
        </button>
        <div className="flex-1">
          <h1 className="text-[22px] font-normal text-[#202124]">Visa Details</h1>
          <p className="text-[13px] text-[#5f6368]">{visa.visa_type} visa • {visa.package} package</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setPrintOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#d4d4d4] text-[13px] font-medium text-[#4A4A4A] hover:bg-[#f0f0f0] transition-colors">
            <Printer size={16} /> Print Slip
          </button>
          <button onClick={() => navigate('/visas', { state: { editId: visa.id } })} className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#d4d4d4] text-[13px] font-medium text-[#4A4A4A] hover:bg-[#f0f0f0] transition-colors">
            <Edit2 size={16} /> Edit
          </button>
          <button onClick={handleDelete} className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#fce8e6] text-[13px] font-medium text-[#d93025] hover:bg-[#fce8e6] transition-colors">
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-4">
          {/* Status Card */}
          <div className={`${status.bg} rounded-xl p-5 flex items-center gap-4`}>
            <status.icon size={28} className={status.text} />
            <div>
              <p className={`text-[16px] font-medium ${status.text}`}>{status.label}</p>
              <p className="text-[13px] text-[#5f6368]">Visa status</p>
            </div>
          </div>

          {/* Personal Info Card */}
          <div className="bg-white rounded-xl border border-[#e0e0e0] p-6">
            <h3 className="text-[13px] font-medium text-[#5f6368] uppercase tracking-wider mb-2">Personal Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
              <InfoRow icon={User} label="Passenger" value={visa.passenger_name} color="#202124" />
              <InfoRow icon={Phone} label="Phone" value={visa.phone} />
              <InfoRow icon={Globe} label="Passport" value={visa.passport_number} />
              <InfoRow icon={Briefcase} label="Occupation" value={visa.occupation} />
            </div>
          </div>

          {/* Visa Info Card */}
          <div className="bg-white rounded-xl border border-[#e0e0e0] p-6">
            <h3 className="text-[13px] font-medium text-[#5f6368] uppercase tracking-wider mb-2">Visa Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
              <InfoRow icon={Globe} label="Visa Type" value={visa.visa_type} color="#E74C3C" />
              <InfoRow icon={FileText} label="Package" value={visa.package} color="#E74C3C" />
            </div>
          </div>

          {visa.analysis && (
            <div className="bg-white rounded-xl border border-[#e0e0e0] p-6">
              <h3 className="text-[13px] font-medium text-[#5f6368] uppercase tracking-wider mb-3">Analysis</h3>
              <p className="text-[13px] text-[#202124] bg-[#f8f9fa] rounded-lg p-4 whitespace-pre-wrap">{visa.analysis}</p>
            </div>
          )}
        </div>

        {/* Financial Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-[#e0e0e0] p-6">
            <h3 className="text-[13px] font-medium text-[#5f6368] uppercase tracking-wider mb-4">Financial Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-[#f0f0f0]">
                <span className="text-[13px] text-[#5f6368]">Total Charges</span>
                <span className="text-[14px] text-[#202124] font-medium">SAR {visa.total_charges.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#f0f0f0]">
                <span className="text-[13px] text-[#5f6368]">Package Price</span>
                <span className="text-[14px] text-[#202124] font-medium">SAR {visa.package_price.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#f0f0f0]">
                <span className="text-[13px] text-[#5f6368]">Commission</span>
                <span className="text-[14px] text-[#1e8e3e] font-medium">SAR {visa.total_commission.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#f0f0f0]">
                <span className="text-[13px] text-[#5f6368]">Expenses</span>
                <span className="text-[14px] text-[#d93025] font-medium">SAR {visa.total_expenses.toLocaleString()}</span>
              </div>
            </div>
            {visa.total_charges > 0 && (
              <div className="mt-4 pt-4 border-t border-[#e0e0e0]">
                <div className="flex justify-between items-center">
                  <span className="text-[13px] font-medium text-[#202124]">Balance</span>
                  <span className={`text-[16px] font-medium ${
                    (visa.total_charges - visa.payment_received) > 0 ? 'text-[#d93025]' : 'text-[#1e8e3e]'
                  }`}>
                    SAR {(visa.total_charges - visa.payment_received).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Payment Breakdown */}
          <div className="bg-white rounded-xl border border-[#e0e0e0] p-6">
            <h3 className="text-[13px] font-medium text-[#5f6368] uppercase tracking-wider mb-4">Payment Breakdown</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-[#fef7e0] rounded-lg">
                <Banknote size={20} className="text-[#e37400]" />
                <div className="flex-1">
                  <p className="text-[12px] text-[#5f6368]">Cash</p>
                  <p className="text-[14px] font-medium text-[#202124]">SAR {visa.payment_cash.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-[#f0f0f0] rounded-lg">
                <CreditCard size={20} className="text-[#E74C3C]" />
                <div className="flex-1">
                  <p className="text-[12px] text-[#5f6368]">Online Bank</p>
                  <p className="text-[14px] font-medium text-[#202124]">SAR {visa.payment_bank.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#e0e0e0] p-6">
            <h3 className="text-[13px] font-medium text-[#5f6368] uppercase tracking-wider mb-3">Agent</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E74C3C] to-[#C0392B] flex items-center justify-center text-white font-medium text-sm">
                {visa.agent_name?.charAt(0)}
              </div>
              <div>
                <p className="text-[14px] font-medium text-[#202124]">{visa.agent_name}</p>
                <p className="text-[12px] text-[#5f6368]">Agent</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PrintSlip isOpen={printOpen} onClose={() => setPrintOpen(false)} title="VISA PROCESSING SLIP">
        <SlipRow label="Passenger" value={visa.passenger_name} bold />
        <SlipRow label="Passport" value={visa.passport_number} />
        <SlipRow label="Phone" value={visa.phone} />
        <SlipRow label="Occupation" value={visa.occupation} />
        <SlipSection title="Visa Details" />
        <SlipRow label="Visa Type" value={visa.visa_type} bold />
        <SlipRow label="Package" value={visa.package} />
        <SlipRow label="Status" value={visa.status.toUpperCase()} bold />
        <SlipSection title="Financial" />
        <SlipRow label="Total Charges" value={`SAR ${visa.total_charges.toLocaleString()}`} />
        <SlipRow label="Package Price" value={`SAR ${visa.package_price.toLocaleString()}`} />
        <SlipRow label="Commission" value={`SAR ${visa.total_commission.toLocaleString()}`} />
        <SlipRow label="Expenses" value={`SAR ${visa.total_expenses.toLocaleString()}`} />
        <SlipSection title="Payment" />
        <SlipRow label="Cash" value={`SAR ${visa.payment_cash.toLocaleString()}`} />
        <SlipRow label="Bank" value={`SAR ${visa.payment_bank.toLocaleString()}`} />
        <SlipRow label="Total Received" value={`SAR ${visa.payment_received.toLocaleString()}`} bold />
        <SlipRow label="Balance" value={`SAR ${(visa.total_charges - visa.payment_received).toLocaleString()}`} bold />
        <SlipRow label="Agent" value={visa.agent_name} />
      </PrintSlip>
    </div>
  );
}
