
import React from 'react';
import { User } from '../types';
import { TrendingUp } from 'lucide-react';

interface PointsSummaryProps {
  user: User;
}

const PointsSummary: React.FC<PointsSummaryProps> = ({ user }) => {
  return (
    <div className="unit-card p-8 flex flex-col gap-10">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted">Core Assets</span>
          <h4 className="text-sm font-extrabold uppercase tracking-tight">Eco Portfolio</h4>
        </div>
        <div className="w-10 h-10 rounded-full border border-brand-border flex items-center justify-center text-brand">
          <TrendingUp size={18} />
        </div>
      </div>

      <div className="flex flex-col">
        <div className="flex items-baseline gap-2">
          <h2 className="text-7xl font-extrabold tracking-tighter">
            {(user.points ?? 0).toLocaleString()}
          </h2>
          <span className="text-brand font-black text-sm uppercase tracking-widest">SRT</span>
        </div>
        <p className="text-muted text-xs font-medium mt-2">Active units allocated to your identity</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-brand-unit p-4 rounded-inner border border-brand-border flex flex-col gap-1">
          <span className="text-[9px] font-black uppercase text-muted tracking-widest">Unit Status</span>
          <span className="text-sm font-extrabold text-brand uppercase">Verified</span>
        </div>
        <div className="bg-brand-unit p-4 rounded-inner border border-brand-border flex flex-col gap-1">
          <span className="text-[9px] font-black uppercase text-muted tracking-widest">Global Rank</span>
          <span className="text-sm font-extrabold uppercase">T-100</span>
        </div>
      </div>
    </div>
  );
};

export default PointsSummary;
