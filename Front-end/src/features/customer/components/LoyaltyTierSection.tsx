import React from 'react';
import { LOYALTY_TIERS } from '../../../config/constants';
import { CustomerTier } from '../../../types';
import { AlertCircle, Award } from 'lucide-react';

interface LoyaltyTierSectionProps {
  currentTier?: CustomerTier;
  currentPoints?: number;
  completedWashes?: number;
  totalSpend?: number;
}

export const LoyaltyTierSection: React.FC<LoyaltyTierSectionProps> = ({ 
  currentTier = 'Member', 
  currentPoints = 0,
  completedWashes = 2,
  totalSpend = 1280000 
}) => {

  let nextTierName = '';
  let washesNeeded = 0;
  let spendNeeded = 0;
  let progressPercent = 0;

  if (currentTier === 'Member') {
    nextTierName = 'Silver';
    washesNeeded = Math.max(0, 5 - completedWashes);
    spendNeeded = Math.max(0, 2000000 - totalSpend);
    progressPercent = Math.min(100, (completedWashes / 5) * 100);
  } else if (currentTier === 'Silver') {
    nextTierName = 'Gold';
    washesNeeded = Math.max(0, 15 - completedWashes);
    spendNeeded = Math.max(0, 6000000 - totalSpend);
    progressPercent = Math.min(100, (completedWashes / 15) * 100);
  } else if (currentTier === 'Gold') {
    nextTierName = 'Platinum';
    washesNeeded = Math.max(0, 30 - completedWashes);
    spendNeeded = Math.max(0, 15000000 - totalSpend);
    progressPercent = Math.min(100, (completedWashes / 30) * 100);
  } else {
    // Platinum
    progressPercent = 100;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Award className="w-5 h-5 text-blue-500" />
          Loyalty Tier System
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">Earn points to unlock exclusive privileges</p>
      </div>

      {/* FR-007 Progress Bar Block */}
      {nextTierName ? (
        <section className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-5 shadow-lg">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-white">{currentTier} Tier Member</h3>
            <span className="text-sm font-bold text-blue-400">{Math.round(progressPercent)}%</span>
          </div>
          
          {/* Visual Bar */}
          <div className="space-y-2">
            <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800 relative">
              <div 
                className="bg-gradient-to-r from-blue-500 to-sky-400 h-full rounded-full transition-all duration-500" 
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="text-sm text-slate-300">
            Need <strong className="text-white">{washesNeeded} washes</strong> or <strong className="text-white">{spendNeeded.toLocaleString('vi-VN')} VND</strong> spent to reach {nextTierName}.
          </div>
          
          <div className="text-sm text-orange-400 font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Points Expiring Next Month: 120 points
          </div>
        </section>
      ) : (
        <section className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3 shadow-lg">
           <div className="flex justify-between items-center">
             <h3 className="text-lg font-bold text-white">{currentTier} Tier Member</h3>
             <span className="text-sm font-bold text-blue-400">MAX TIER</span>
           </div>
           <div className="text-sm text-slate-300">You have reached the highest tier! Enjoy all the ultimate privileges.</div>
           <div className="text-sm text-orange-400 font-medium flex items-center gap-2">
             <AlertCircle className="w-4 h-4" />
             Points Expiring Next Month: 120 points
           </div>
        </section>
      )}

      {/* Grid Tiers Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {LOYALTY_TIERS.map(tier => {
          const isCurrent = tier.name === currentTier;
          const pointsRemaining = Math.max(0, tier.requiredPoints - currentPoints);

          return (
            <div key={tier.name} className={`relative p-5 rounded-xl border ${isCurrent ? 'bg-blue-50 dark:bg-blue-600/10 border-blue-200 dark:border-blue-500/30' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}>
              {isCurrent && <div className="absolute -top-3 right-4 bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">Current tier</div>}
              
              <div className={`font-bold text-lg mb-3 ${isCurrent ? 'text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-slate-200'}`}>
                {tier.name}
              </div>
              
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">Points multiplier:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">x{tier.multiplier.toFixed(1)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">Booking advance:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{tier.bookingAdvanceLimit} days</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                {tier.requiredPoints === 0 ? (
                  <span className="text-xs font-semibold text-green-500 dark:text-green-400">Default</span>
                ) : isCurrent ? (
                  <span className="text-xs font-semibold text-blue-500 dark:text-blue-400">Achieved ({tier.requiredPoints} points)</span>
                ) : pointsRemaining > 0 ? (
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">Need {pointsRemaining} more points</span>
                ) : (
                  <span className="text-xs font-semibold text-green-500 dark:text-green-400">Eligible for upgrade</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
