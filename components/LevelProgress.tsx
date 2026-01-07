
import React from 'react';
import { User } from '../types';
import { LEVEL_THRESHOLDS } from '../constants';
import { Power } from 'lucide-react';

interface LevelProgressProps { user: User; }

const LevelProgress: React.FC<LevelProgressProps> = ({ user }) => {
  const userLvl = user.level || 1;
  const userXp = user.xp || 0;
  const nextLevelXP = LEVEL_THRESHOLDS[userLvl] || 10000;
  const prevLevelXP = LEVEL_THRESHOLDS[userLvl - 1] || 0;
  const progressPercent = Math.min(100, Math.max(0, ((userXp - prevLevelXP) / (nextLevelXP - prevLevelXP)) * 100));

  return (
    <div className="unit-card p-6 flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-brand rounded-inner flex items-center justify-center text-black">
            <Power size={22} strokeWidth={3} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-muted uppercase tracking-widest">Operational Rank</span>
            <h3 className="text-lg font-black uppercase tracking-tight">System Tier {userLvl}</h3>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-black text-muted uppercase tracking-widest">Efficiency</span>
          <p className="text-2xl font-black text-brand italic">{progressPercent.toFixed(0)}%</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="h-6 w-full bg-brand-unit rounded-full border border-brand-border p-1.5 overflow-hidden">
          <div 
            className="h-full bg-brand rounded-full transition-all duration-1000 shadow-neon-strong"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-black text-muted uppercase tracking-[0.2em]">
          <span>{userXp} XP Current</span>
          <span className="text-white">{nextLevelXP} XP Target</span>
        </div>
      </div>
    </div>
  );
};

export default LevelProgress;
