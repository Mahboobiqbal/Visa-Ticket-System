import { useState, useEffect } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import { Clock, Ticket, Stamp, Users, Banknote, ChevronLeft, ChevronRight } from 'lucide-react';

const entityIcons = {
  ticket: { icon: Ticket, color: '#E74C3C', link: '/tickets/' },
  visa: { icon: Stamp, color: '#e37400', link: '/visas/' },
  cashout: { icon: Banknote, color: '#1a73e8', link: '/cashout/' },
  agent: { icon: Users, color: '#1e8e3e', link: '/agents/' },
};

const actionLabels = {
  create: 'Created',
  update: 'Updated',
  delete: 'Deleted',
};

export default function Activity() {
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();

  const load = () => {
    api.get('/activity/', { params: { page, per_page: 20 } }).then(res => {
      setLogs(res.data.logs);
      setTotalPages(res.data.pages);
      setTotal(res.data.total);
    });
  };

  useEffect(() => { load(); }, [page]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-[22px] font-normal text-[#202124]">Activity Log</h1>
        <p className="text-[13px] text-[#5f6368] mt-0.5">{total} record{total !== 1 ? 's' : ''} total</p>
      </div>

      <div className="bg-white rounded-xl border border-[#e0e0e0] overflow-hidden">
        {logs.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <Clock size={48} className="mx-auto text-[#dadce0] mb-3" />
            <p className="text-[14px] text-[#5f6368]">No activity recorded yet</p>
            <p className="text-[12px] text-[#9aa0a6] mt-1">Actions will appear here as you use the system</p>
          </div>
        ) : (
          <div className="divide-y divide-[#f0f0f0]">
            {logs.map(log => {
              const config = entityIcons[log.entity_type] || entityIcons.ticket;
              const Icon = config.icon;
              const actionLabel = actionLabels[log.action] || log.action;
              return (
                <div
                  key={log.id}
                  onClick={() => log.entity_id && navigate(`${config.link}${log.entity_id}`)}
                  className={`flex items-center gap-4 px-5 py-4 ${log.entity_id ? 'cursor-pointer hover:bg-[#f8f8f8] transition-colors' : ''}`}
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${config.color}15` }}>
                    <Icon size={18} style={{ color: config.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-[#202124]">
                      <span className="font-medium">{log.username}</span>
                      <span className="text-[#5f6368]"> {actionLabel} </span>
                      <span className="font-medium">{log.entity_type}</span>
                      {log.details && <span className="text-[#5f6368]"> — {log.details}</span>}
                    </p>
                    <p className="text-[11px] text-[#9aa0a6] mt-0.5">{log.created_at}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-[#e0e0e0]">
            <p className="text-[12px] text-[#5f6368]">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-2 rounded-full hover:bg-[#f1f3f4] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft size={18} className="text-[#5f6368]" />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="p-2 rounded-full hover:bg-[#f1f3f4] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <ChevronRight size={18} className="text-[#5f6368]" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
