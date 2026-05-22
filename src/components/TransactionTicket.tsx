import React, { useState } from 'react';
import { cn } from '../lib/utils';
import { 
  PlusCircle, 
  MinusCircle, 
  RefreshCw, 
  Zap, 
  ChevronDown, 
  ChevronUp, 
  Calendar,
  Clock,
  Tag,
  CreditCard,
  User,
  DollarSign
} from 'lucide-react';

interface TransactionTicketProps {
  tx: {
    id: string;
    type: string;
    amount: number;
    status: string;
    created_at: string;
    method?: string;
    plan_name?: string;
    reference?: string;
    type_detail?: string;
    sender_id?: string;
    receiver_id?: string;
    user_name?: string;
    description?: string;
    fee?: number;
    final_amount?: number;
    details?: any;
  };
  currentUserId?: string;
  variant?: 'fund' | 'dashboard';
}

export const TransactionTicket: React.FC<TransactionTicketProps> = ({ tx, currentUserId, variant = 'fund' }) => {
  const [isOpen, setIsOpen] = useState(false);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  const dateObj = new Date(tx.created_at);
  const dateFormatted = isNaN(dateObj.getTime()) 
    ? '-' 
    : dateObj.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  const timeFormatted = isNaN(dateObj.getTime())
    ? '-'
    : dateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // Determine normalized ticket type
  let displayType = tx.type;
  if (tx.type === 'transfer') {
    if (tx.type_detail === 'internal_transfer') {
      displayType = 'Internal Transfer';
    } else if (tx.sender_id === currentUserId) {
      displayType = 'Transfer Sent';
    } else {
      displayType = 'Transfer Received';
    }
  } else if (tx.type === 'deposit') {
    displayType = 'Capital Deposit';
  } else if (tx.type === 'withdrawal') {
    displayType = 'Liquidity Withdrawal';
  } else if (tx.type === 'investment') {
    displayType = `${tx.plan_name || 'Node'} Injection`;
  } else if (tx.type === 'points_gain') {
    displayType = 'Daily Check-in Claim';
  } else if (tx.type === 'investment_reward') {
    displayType = 'Investment Bonus Claim';
  } else if (tx.type === 'rewards_conversion') {
    displayType = 'PTS → USD Conversion';
  }

  // Determine status display and behavior
  const statusLower = (tx.status || '').toLowerCase();
  
  let statusText = tx.status || 'Pending';
  if (statusLower === 'approved') statusText = 'Approved';
  else if (statusLower === 'pending') statusText = 'Pending';
  else if (statusLower === 'completed') statusText = 'Completed';
  else if (statusLower === 'active') {
    statusText = tx.type === 'investment' ? 'Active' : 'Approved';
  } else if (statusLower === 'inactive') {
    statusText = 'Inactive';
  } else if (statusLower === 'declined') {
    statusText = 'Declined';
  } else if (statusLower === 'terminated') {
    statusText = 'Terminated';
  }

  // Override status text for specific reward claim actions
  if (tx.type === 'points_gain' || tx.type === 'investment_reward') {
    if (statusLower === 'approved' || statusLower === 'completed' || statusLower === 'active') {
      statusText = 'Claimed';
    }
  }
  
  // STATUS COLORS:
  // → Pending = Yellow
  // → Approved deposits/investments/rewards (and general) = Green
  // → Approved withdrawals = Red
  let statusBg = 'bg-yellow-400/10 text-yellow-400 border border-[0.5px] border-yellow-400/30';
  
  if (statusLower === 'pending' || statusLower === 'inactive') {
    statusBg = 'bg-yellow-400/10 text-yellow-400 border border-[0.5px] border-yellow-400/30';
  } else if (statusLower === 'approved' || statusLower === 'completed' || statusLower === 'active') {
    if (tx.type === 'withdrawal') {
      statusBg = 'bg-red-500/10 text-red-500 border border-[0.5px] border-red-500/30';
    } else {
      statusBg = 'bg-emerald-500/10 text-emerald-500 border border-[0.5px] border-emerald-500/30';
    }
  } else if (statusLower === 'declined' || statusLower === 'terminated' || statusLower === 'rejected') {
    statusBg = 'bg-red-500/10 text-red-500 border border-[0.5px] border-red-500/30';
  }

  // Get matching icon and icon bg colors
  let iconComponent = <Zap size={18} />;
  let iconBg = 'bg-[#1e293b]/50 text-blue-400';
  if (tx.type === 'deposit') {
    iconComponent = <PlusCircle size={18} />;
    iconBg = 'bg-emerald-500/10 text-emerald-400';
  } else if (tx.type === 'withdrawal') {
    iconComponent = <MinusCircle size={18} />;
    iconBg = 'bg-red-500/10 text-red-500';
  } else if (tx.type === 'transfer') {
    iconComponent = <RefreshCw size={18} />;
    iconBg = 'bg-[#1e293b]/50 text-blue-400';
  } else if (tx.type === 'investment') {
    iconComponent = <Zap size={18} />;
    iconBg = 'bg-purple-500/10 text-purple-400';
  } else if (tx.type === 'points_gain') {
    iconComponent = <PlusCircle size={18} />;
    iconBg = 'bg-emerald-500/10 text-emerald-400';
  } else if (tx.type === 'investment_reward') {
    iconComponent = <Zap size={18} />;
    iconBg = 'bg-emerald-500/10 text-emerald-400';
  } else if (tx.type === 'rewards_conversion') {
    iconComponent = <RefreshCw size={18} />;
    iconBg = 'bg-purple-500/10 text-purple-400';
  }

  const handleToggle = (e: React.MouseEvent) => {
    setIsOpen(!isOpen);
  };

  const isPointsGain = tx.type === 'points_gain';
  const isWithType = tx.type === 'withdrawal';
  const displaySign = isWithType ? '-' : '+';
  const displayAmount = isPointsGain ? `${tx.amount} PTS` : formatCurrency(tx.amount);

  return (
    <div 
      id={`tx-card-${tx.id}`}
      onClick={handleToggle}
      className={cn(
        "bg-[#11141b] border border-white/5 rounded-2xl hover:border-white/10 transition-all cursor-pointer select-none overflow-hidden",
        variant === 'dashboard' ? "p-6" : "p-5"
      )}
    >
      {/* HEADER SECTION */}
      <div id={`tx-header-${tx.id}`} className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div id={`tx-icon-frame-${tx.id}`} className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-200", iconBg, isOpen && "scale-105")}>
            {iconComponent}
          </div>
          <div>
            <p id={`tx-display-type-${tx.id}`} className="text-xs font-black uppercase text-white tracking-wide">
              {displayType}
            </p>
            <p id={`tx-date-short-${tx.id}`} className="text-[9px] text-aura-muted font-bold uppercase tracking-tight">
              {dateFormatted} • {timeFormatted}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p id={`tx-amount-${tx.id}`} className={cn(
              "text-base md:text-lg font-black tracking-tight mb-1 italic font-serif",
              isWithType ? "text-red-400" : "text-white"
            )}>
              {displaySign}{displayAmount}
            </p>
            <div id={`tx-status-badge-${tx.id}`} className={cn("inline-block px-3 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest", statusBg)}>
              {statusText}
            </div>
          </div>
          <div className="text-white/40 group-hover:text-white/60 transition-colors">
            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>
      </div>

      {/* DETAILED EXPANDED SECTION */}
      {isOpen && (
        <div id={`tx-details-${tx.id}`} className="mt-5 pt-5 border-t border-white/[0.04] space-y-4 text-left">
          <div className="grid grid-cols-2 gap-4">
            
            {/* INVESTMENT DETAILS */}
            {tx.type === 'investment' && (
              <>
                <div id={`tx-plan-group-${tx.id}`}>
                  <p className="text-[8px] font-black uppercase tracking-widest text-aura-muted flex items-center gap-1"><Tag size={8} /> Investment Plan</p>
                  <p className="text-[11px] font-bold text-white uppercase mt-0.5">{tx.plan_name || 'Standard'}</p>
                </div>
                <div id={`tx-amount-group-${tx.id}`}>
                  <p className="text-[8px] font-black uppercase tracking-widest text-aura-muted flex items-center gap-1"><DollarSign size={8} /> Investment Amount</p>
                  <p className="text-[11px] font-bold text-white mt-0.5">{displayAmount}</p>
                </div>
              </>
            )}

            {/* DEPOSIT DETAILS */}
            {tx.type === 'deposit' && (
              <>
                <div id={`tx-deposit-amount-group-${tx.id}`}>
                  <p className="text-[8px] font-black uppercase tracking-widest text-aura-muted flex items-center gap-1"><DollarSign size={8} /> Deposit Amount</p>
                  <p className="text-[11px] font-bold text-white mt-0.5">{displayAmount}</p>
                </div>
                <div id={`tx-payment-method-group-${tx.id}`}>
                  <p className="text-[8px] font-black uppercase tracking-widest text-aura-muted flex items-center gap-1"><CreditCard size={8} /> Payment Method</p>
                  <p className="text-[11px] font-bold text-white uppercase mt-0.5">{tx.method || 'Direct'}</p>
                </div>
              </>
            )}

            {/* WITHDRAWAL DETAILS */}
            {tx.type === 'withdrawal' && (
              <>
                <div id={`tx-withdraw-amount-group-${tx.id}`}>
                  <p className="text-[8px] font-black uppercase tracking-widest text-aura-muted flex items-center gap-1"><DollarSign size={8} /> Withdrawal Amount</p>
                  <p className="text-[11px] font-bold text-white mt-0.5">{displayAmount}</p>
                </div>
                <div id={`tx-withdraw-method-group-${tx.id}`}>
                  <p className="text-[8px] font-black uppercase tracking-widest text-aura-muted flex items-center gap-1"><CreditCard size={8} /> Withdrawal Method</p>
                  <p className="text-[11px] font-bold text-white uppercase mt-0.5">{tx.method || 'Standard'}</p>
                </div>
              </>
            )}

            {/* POINTS GAIN DETAILS */}
            {tx.type === 'points_gain' && (
              <>
                <div id={`tx-points-amount-group-${tx.id}`}>
                  <p className="text-[8px] font-black uppercase tracking-widest text-aura-muted flex items-center gap-1"><Tag size={8} /> Points Claimed</p>
                  <p className="text-[11px] font-bold text-white mt-0.5">{tx.amount} PTS</p>
                </div>
                <div id={`tx-points-type-group-${tx.id}`}>
                  <p className="text-[8px] font-black uppercase tracking-widest text-[#a855f7] flex items-center gap-1"><Tag size={8} /> Reward Source</p>
                  <p className="text-[11px] font-bold text-white mt-0.5 uppercase">Daily Check-In Incentive</p>
                </div>
              </>
            )}

            {/* INVESTMENT REWARD DETAILS */}
            {tx.type === 'investment_reward' && (
              <>
                <div id={`tx-inv-reward-amount-group-${tx.id}`}>
                  <p className="text-[8px] font-black uppercase tracking-widest text-[#10b981] flex items-center gap-1"><DollarSign size={8} /> Bonus Amount</p>
                  <p className="text-[11px] font-bold text-white mt-0.5">{formatCurrency(tx.amount)}</p>
                </div>
                <div id={`tx-inv-reward-type-group-${tx.id}`}>
                  <p className="text-[8px] font-black uppercase tracking-widest text-[#a855f7] flex items-center gap-1"><Tag size={8} /> Reward Source</p>
                  <p className="text-[11px] font-bold text-white mt-0.5 uppercase">2% Node Investment Bonus</p>
                </div>
              </>
            )}

            {/* REWARDS CONVERSION DETAILS */}
            {tx.type === 'rewards_conversion' && (
              <>
                <div id={`tx-conv-amount-group-${tx.id}`}>
                  <p className="text-[8px] font-black uppercase tracking-widest text-[#10b981] flex items-center gap-1"><DollarSign size={8} /> Reward Credit</p>
                  <p className="text-[11px] font-bold text-white mt-0.5">{formatCurrency(tx.amount)}</p>
                </div>
                <div id={`tx-conv-type-group-${tx.id}`}>
                  <p className="text-[8px] font-black uppercase tracking-widest text-[#a855f7] flex items-center gap-1"><Tag size={8} /> Exchange Protocol</p>
                  <p className="text-[11px] font-bold text-white mt-0.5 uppercase">PTS → USD Converter</p>
                </div>
              </>
            )}

            {/* TRANSFERS & OTHER DETAILS */}
            {tx.type === 'transfer' && (
              <>
                <div id={`tx-transfer-amount-group-${tx.id}`}>
                  <p className="text-[8px] font-black uppercase tracking-widest text-aura-muted flex items-center gap-1"><DollarSign size={8} /> Amount</p>
                  <p className="text-[11px] font-bold text-white mt-0.5">{displayAmount}</p>
                </div>
                <div id={`tx-transfer-direction-group-${tx.id}`}>
                  <p className="text-[8px] font-black uppercase tracking-widest text-aura-muted flex items-center gap-1"><User size={8} /> Direction</p>
                  <p className="text-[11px] font-bold text-white uppercase mt-0.5">
                    {tx.type_detail === 'internal_transfer' ? 'Internal Wallet Swap' :
                     tx.sender_id === currentUserId ? 'Outbound Transfer' : 'Inbound Transfer'}
                  </p>
                </div>
              </>
            )}

            {/* SHARED DATETIME FIELDS */}
            <div id={`tx-date-group-${tx.id}`}>
              <p className="text-[8px] font-black uppercase tracking-widest text-aura-muted flex items-center gap-1"><Calendar size={8} /> Date Created</p>
              <p className="text-[11px] font-bold text-white mt-0.5">{dateFormatted}</p>
            </div>
            <div id={`tx-time-group-${tx.id}`}>
              <p className="text-[8px] font-black uppercase tracking-widest text-aura-muted flex items-center gap-1"><Clock size={8} /> Time Created</p>
              <p className="text-[11px] font-bold text-white mt-0.5">{timeFormatted}</p>
            </div>
          </div>

          {/* BONUS DETAILS IF EXISTING */}
          {(tx.reference || tx.description || tx.fee) && (
            <div id={`tx-meta-${tx.id}`} className="mt-3 p-3 bg-white/[0.02] rounded-xl border border-white/5 grid grid-cols-2 gap-2 text-[10px]">
              {tx.description && (
                <div id={`tx-desc-item-${tx.id}`} className="col-span-2">
                  <span className="text-aura-muted text-[8px] uppercase tracking-wider font-bold block">Description</span>
                  <span className="text-white font-medium block mt-0.5">{tx.description}</span>
                </div>
              )}
              {tx.reference && (
                <div id={`tx-ref-item-${tx.id}`} className="col-span-2">
                  <span className="text-aura-muted text-[8px] uppercase tracking-wider font-bold block">Transaction Signature</span>
                  <span className="text-white font-mono break-all font-medium block mt-0.5">{tx.reference}</span>
                </div>
              )}
              {tx.fee !== undefined && tx.fee > 0 && (
                <div id={`tx-fee-item-${tx.id}`}>
                  <span className="text-aura-muted text-[8px] uppercase tracking-wider font-bold block">Network Fee</span>
                  <span className="text-white font-medium block mt-0.5">{formatCurrency(tx.fee)}</span>
                </div>
              )}
              {tx.final_amount !== undefined && tx.final_amount > 0 && (
                <div id={`tx-final-item-${tx.id}`}>
                  <span className="text-aura-muted text-[8px] uppercase tracking-wider font-bold block">Settled Amount</span>
                  <span className="text-white font-bold block mt-0.5">{formatCurrency(tx.final_amount)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
