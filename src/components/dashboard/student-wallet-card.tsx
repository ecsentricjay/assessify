'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Wallet, ArrowRight } from 'lucide-react'
import Link from 'next/link'

/**
 * Student Dashboard Wallet Card Component
 * Displays wallet balance with easy funding access
 */
export function StudentWalletCard({ balance }: { balance: number }) {
  const isLowBalance = balance < 1000
  
  return (
    <Card className={`relative overflow-hidden ${
      isLowBalance 
        ? 'border-orange-200 bg-gradient-to-br from-orange-50 to-orange-50/50' 
        : 'hover:shadow-md transition-shadow'
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            Wallet Balance
          </CardTitle>
          {isLowBalance && (
            <span className="text-xs font-semibold px-2 py-1 bg-orange-100 text-orange-700 rounded-full">
              Low Balance
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-3xl font-bold text-gray-900">
            ₦{balance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {isLowBalance 
              ? 'Add funds to submit assignments and tests' 
              : 'Available for assignments and tests'}
          </p>
        </div>
        
        <div className="flex gap-2 pt-2">
          <Button 
            asChild 
            size="sm" 
            className="flex-1"
            variant={isLowBalance ? "default" : "outline"}
          >
            <Link href="/student/wallet">
              <Wallet className="w-4 h-4 mr-2" />
              Fund Wallet
            </Link>
          </Button>
          <Button 
            asChild 
            size="sm" 
            variant="ghost"
          >
            <Link href="/student/wallet">
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
