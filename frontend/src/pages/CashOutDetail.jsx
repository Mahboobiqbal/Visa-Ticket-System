import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';
import PrintSlip, { SlipRow, SlipSection } from '../components/PrintSlip';
import {
  ArrowLeft, Edit2, Trash2, User, Calendar, Banknote,
  CreditCard, MessageSquare, DollarSign, Printer,
} from 'lucide-react';

export default function CashOutDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cashout, setCashout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [printOpen, setPrintOpen] = useState(false);

  useEffect(() => {
    let active = true;
    api.get(`/cashouts/${id}`)
      .then(res => { if (active) setCashout(res.data); })
      .catch(() => { if (active) { toast.error('Record not found'); navigate('/cashout'); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!confirm('Delete this cash out record?')) return;
    try {
      await api.delete(`/cashouts/${id}`);
      toast.success('Record deleted');
      navigate('/cashout');
    } catch (err) {
      toast.error('Error deleting cash out record');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E74C3C]"></div>
    </div>
  );
  if (!cashout) return null;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/cashout')} className="p-2 rounded-full hover:bg-[#f1f3f4] transition-colors">
          <ArrowLeft size={22} className="text-[#5f6368]" />
        </button>
        <div className="flex-1">
          <h1 className="text-[22px] font-normal text-[#202124]">Cash Out Details</h1>
          <p className="text-[13px] text-[#5f6368]">Record #{cashout.id}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setPrintOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#d4d4d4] text-[13px] font-medium text-[#4A4A4A] hover:bg-[#f0f0f0] transition-colors">
            <Printer size={16} /> Print Slip
          </button>
          <button onClick={() => navigate('/cashout', { state: { editId: cashout.id } })} className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#d4d4d4] text-[13px] font-medium text-[#4A4A4A] hover:bg-[#f0f0f0] transition-colors">
            <Edit2 size={16} /> Edit
          </button>
          <button onClick={handleDelete} className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#fce8e6] text-[13px] font-medium text-[#d93025] hover:bg-[#fce8e6] transition-colors">
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Amount Card */}
        <div className={`rounded-xl p-6 flex items-center gap-5 ${
          cashout.payment_method === 'cash' ? 'bg-[#fef7e0]' : 'bg-[#f0f0f0]'
        }`}>
          <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
            cashout.payment_method === 'cash' ? 'bg-[#e37400]' : 'bg-[#E74C3C]'
          }`}>
            {cashout.payment_method === 'cash' ? <Banknote size={28} className="text-white" /> : <CreditCard size={28} className="text-white" />}
          </div>
          <div>
            <p className="text-[12px] text-[#5f6368] uppercase tracking-wider">Amount</p>
            <p className="text-[32px] font-normal text-[#202124]">SAR {cashout.amount.toLocaleString()}</p>
          </div>
        </div>

        {/* Details Card */}
        <div className="bg-white rounded-xl border border-[#e0e0e0] p-6">
          <h3 className="text-[13px] font-medium text-[#5f6368] uppercase tracking-wider mb-4">Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-[#f1f3f4] flex items-center justify-center flex-shrink-0">
                <User size={18} className="text-[#5f6368]" />
              </div>
              <div>
                <p className="text-[11px] text-[#5f6368] uppercase tracking-wider font-medium">Name</p>
                <p className="text-[14px] text-[#202124] mt-0.5">{cashout.name}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-[#f1f3f4] flex items-center justify-center flex-shrink-0">
                <Calendar size={18} className="text-[#5f6368]" />
              </div>
              <div>
                <p className="text-[11px] text-[#5f6368] uppercase tracking-wider font-medium">Date</p>
                <p className="text-[14px] text-[#202124] mt-0.5">{cashout.date}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-[#f1f3f4] flex items-center justify-center flex-shrink-0">
                <DollarSign size={18} className="text-[#5f6368]" />
              </div>
              <div>
                <p className="text-[11px] text-[#5f6368] uppercase tracking-wider font-medium">Payment Method</p>
                <p className="text-[14px] text-[#202124] mt-0.5 capitalize">{cashout.payment_method === 'online_bank' ? 'Online Bank' : 'Cash'}</p>
              </div>
            </div>
            {cashout.agent_name && (
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#E74C3C] to-[#C0392B] flex items-center justify-center flex-shrink-0 text-white text-sm font-medium">
                  {cashout.agent_name?.charAt(0)}
                </div>
                <div>
                  <p className="text-[11px] text-[#5f6368] uppercase tracking-wider font-medium">Agent</p>
                  <p className="text-[14px] text-[#202124] mt-0.5">{cashout.agent_name}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Comments */}
        {cashout.comments && (
          <div className="bg-white rounded-xl border border-[#e0e0e0] p-6">
            <h3 className="text-[13px] font-medium text-[#5f6368] uppercase tracking-wider mb-3 flex items-center gap-2">
              <MessageSquare size={16} /> Comments
            </h3>
            <p className="text-[13px] text-[#202124] bg-[#f8f9fa] rounded-lg p-4 whitespace-pre-wrap">{cashout.comments}</p>
          </div>
        )}
      </div>

      <PrintSlip isOpen={printOpen} onClose={() => setPrintOpen(false)} title="CASH OUT SLIP">
        <SlipRow label="Name" value={cashout.name} bold />
        <SlipRow label="Amount" value={`SAR ${cashout.amount.toLocaleString()}`} bold />
        <SlipRow label="Date" value={cashout.date} />
        <SlipRow label="Payment Method" value={cashout.payment_method === 'online_bank' ? 'Online Bank' : 'Cash'} />
        {cashout.agent_name && <SlipRow label="Agent" value={cashout.agent_name} />}
        {cashout.comments && (
          <>
            <SlipSection title="Comments" />
            <p className="text-[12px] text-[#4A4A4A] whitespace-pre-wrap">{cashout.comments}</p>
          </>
        )}
      </PrintSlip>
    </div>
  );
}
