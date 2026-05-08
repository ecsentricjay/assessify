// components/study-aid/CreditDisplay.tsx
'use client';

import { useEffect, useState } from 'react';
import { getStudentCredits } from '@/lib/actions/study-aid.actions';
import { Button } from '@/components/ui/button';
import { Zap, ShoppingCart, Gift } from 'lucide-react';
import Link from 'next/link';

export function CreditDisplay() {
  const [credits, setCredits] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCredits();
  }, []);

  async function loadCredits() {
    try {
      const result = await getStudentCredits();
      if (result.success) {
        setCredits(result.credits);
      }
    } catch (error) {
      console.error('[CreditDisplay] Error:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 animate-pulse">
        <div className="h-20 bg-white/20 rounded"></div>
      </div>
    );
  }

  if (!credits) return null;

  const freeRemaining = credits.remaining_free_attempts || 0;
  const paidRemaining = credits.remaining_paid_attempts || 0;
  const totalRemaining = freeRemaining + paidRemaining;

  return (
    <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
      <div className="flex items-center justify-between">
        {/* Left: Credit Info */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-purple-600/30 rounded-xl flex items-center justify-center">
            <Zap className="w-8 h-8 text-purple-300" />
          </div>
          
          <div>
            <p className="text-white/70 text-sm mb-1">Attempts Remaining</p>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-black text-white">{totalRemaining}</span>
              
              {freeRemaining > 0 && (
                <span className="bg-green-600/30 text-green-300 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                  <Gift className="w-3 h-3" />
                  {freeRemaining} FREE
                </span>
              )}
              
              {paidRemaining > 0 && (
                <span className="bg-purple-600/30 text-purple-300 px-3 py-1 rounded-full text-xs font-semibold">
                  {paidRemaining} PURCHASED
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Buy Button */}
        <Button
          asChild
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
        >
          <Link href="/student/study-aid/purchase">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Buy More
          </Link>
        </Button>
      </div>

      {/* Low Credits Warning */}
      {totalRemaining <= 1 && totalRemaining > 0 && (
        <div className="mt-4 bg-yellow-600/20 border border-yellow-500/30 rounded-lg p-3">
          <p className="text-yellow-300 text-sm">
            ⚠️ You're running low on attempts! Purchase more to continue studying.
          </p>
        </div>
      )}

      {/* Out of Credits */}
      {totalRemaining === 0 && (
        <div className="mt-4 bg-red-600/20 border border-red-500/30 rounded-lg p-3">
          <p className="text-red-300 text-sm font-semibold">
            🚨 No attempts remaining! Purchase attempts to generate questions.
          </p>
        </div>
      )}
    </div>
  );
}