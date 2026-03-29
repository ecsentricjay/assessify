'use client'

import { useState } from 'react'
import { Copy, CheckCircle, Twitter, MessageCircle, Facebook } from 'lucide-react'
import { toast } from 'sonner'

interface LeaderboardShareProps {
  bundleName: string
  rank: number
  score: number
  totalParticipants: number
  baseUrl?: string
}

export function LeaderboardShare({
  bundleName,
  rank,
  score,
  totalParticipants,
  baseUrl = typeof window !== 'undefined' ? window.location.origin : '',
}: LeaderboardShareProps) {
  const [copied, setCopied] = useState(false)

  // Generate share text based on rank
  const getShareText = () => {
    if (rank === 1) {
      return `🏆 I'm #1 on the ${bundleName} Leaderboard with ${Math.round(score)} points! Can you beat me? 🚀`
    }
    if (rank <= 3) {
      return `🥉 I'm in the Top 3 on the ${bundleName} Leaderboard! ${Math.round(score)} points and climbing! 📈`
    }
    if (rank <= 10) {
      return `📈 Ranked #${rank} on the ${bundleName} Leaderboard with ${Math.round(score)} points! 🎯`
    }
    return `🎯 I'm ranked #${rank} on the ${bundleName} Leaderboard! Join me and practice! 📚`
  }

  const shareText = getShareText()
  const shareUrl = `${baseUrl}/student/cbt/leaderboard?bundle=${bundleName.replace(/\s+/g, '-')}`
  const encodedText = encodeURIComponent(shareText)
  const encodedUrl = encodeURIComponent(shareUrl)

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
  }

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`)
      setCopied(true)
      toast.success('Copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast.error('Failed to copy')
    }
  }

  const handleShare = (platform: string) => {
    const url = shareLinks[platform as keyof typeof shareLinks]
    if (url) {
      window.open(url, '_blank', 'width=600,height=400')
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-700">Share your achievement:</p>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleShare('twitter')}
          className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
          title="Share on Twitter"
        >
          <Twitter className="w-4 h-4" />
          <span className="hidden sm:inline">Twitter</span>
        </button>

        <button
          onClick={() => handleShare('whatsapp')}
          className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
          title="Share on WhatsApp"
        >
          <MessageCircle className="w-4 h-4" />
          <span className="hidden sm:inline">WhatsApp</span>
        </button>

        <button
          onClick={() => handleShare('facebook')}
          className="flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium"
          title="Share on Facebook"
        >
          <Facebook className="w-4 h-4" />
          <span className="hidden sm:inline">Facebook</span>
        </button>

        <button
          onClick={handleCopyToClipboard}
          className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
          title="Copy to clipboard"
        >
          {copied ? (
            <>
              <CheckCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span className="hidden sm:inline">Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Preview */}
      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
        <p className="text-xs font-medium text-gray-600 mb-1">Preview:</p>
        <p className="text-sm text-gray-700">{shareText}</p>
      </div>
    </div>
  )
}
