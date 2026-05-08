'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  DollarSign, 
  Settings as SettingsIcon,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface Settings {
  default_free_attempts: number
  price_per_attempt: number
  price_5_pack: number
  price_10_pack: number
  feature_enabled: boolean
  max_images_per_upload: number
  mcq_question_count: number
  theory_question_count: number
}

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<Settings>({
    default_free_attempts: 3,
    price_per_attempt: 500,
    price_5_pack: 2000,
    price_10_pack: 3500,
    feature_enabled: true,
    max_images_per_upload: 15,
    mcq_question_count: 25,
    theory_question_count: 10,
  })

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    try {
      const response = await fetch('/api/admin/study-aid/settings')
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.settings) {
          setSettings(data.settings)
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)

    try {
      const response = await fetch('/api/admin/study-aid/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Settings saved successfully')
      } else {
        toast.error(data.error || 'Failed to save settings')
      }
    } catch (error) {
      console.error('Save error:', error)
      toast.error('An error occurred')
    } finally {
      setSaving(false)
    }
  }

  function updateSetting(key: keyof Settings, value: any) {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="text-gray-500 animate-pulse">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Back Button */}
          <Link href="/admin/study-aid">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>

          {/* Pricing Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pricing Configuration
              </CardTitle>
              <CardDescription>Set pricing for study aid packages</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="price-per-attempt">Price Per Single Attempt (₦)</Label>
                  <Input
                    id="price-per-attempt"
                    type="number"
                    min="0"
                    value={settings.price_per_attempt}
                    onChange={(e) => updateSetting('price_per_attempt', parseInt(e.target.value) || 0)}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Default: ₦500</p>
                </div>

                <div>
                  <Label htmlFor="price-5-pack">Price For 5-Pack (₦)</Label>
                  <Input
                    id="price-5-pack"
                    type="number"
                    min="0"
                    value={settings.price_5_pack}
                    onChange={(e) => updateSetting('price_5_pack', parseInt(e.target.value) || 0)}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Default: ₦2000</p>
                </div>

                <div>
                  <Label htmlFor="price-10-pack">Price For 10-Pack (₦)</Label>
                  <Input
                    id="price-10-pack"
                    type="number"
                    min="0"
                    value={settings.price_10_pack}
                    onChange={(e) => updateSetting('price_10_pack', parseInt(e.target.value) || 0)}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Default: ₦3500</p>
                </div>

                <div>
                  <Label htmlFor="default-free">Default Free Attempts Per Student</Label>
                  <Input
                    id="default-free"
                    type="number"
                    min="0"
                    value={settings.default_free_attempts}
                    onChange={(e) => updateSetting('default_free_attempts', parseInt(e.target.value) || 0)}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Default: 3</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feature Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                Feature Configuration
              </CardTitle>
              <CardDescription>Configure feature behavior and limits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="max-images">Max Images Per Upload</Label>
                  <Input
                    id="max-images"
                    type="number"
                    min="1"
                    value={settings.max_images_per_upload}
                    onChange={(e) => updateSetting('max_images_per_upload', parseInt(e.target.value) || 1)}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Default: 15</p>
                </div>

                <div>
                  <Label htmlFor="mcq-count">Questions Per MCQ Attempt</Label>
                  <Input
                    id="mcq-count"
                    type="number"
                    min="1"
                    value={settings.mcq_question_count}
                    onChange={(e) => updateSetting('mcq_question_count', parseInt(e.target.value) || 1)}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Default: 25</p>
                </div>

                <div>
                  <Label htmlFor="theory-count">Questions Per Theory Attempt</Label>
                  <Input
                    id="theory-count"
                    type="number"
                    min="1"
                    value={settings.theory_question_count}
                    onChange={(e) => updateSetting('theory_question_count', parseInt(e.target.value) || 1)}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Default: 10</p>
                </div>

                <div>
                  <Label htmlFor="feature-enabled" className="flex items-center gap-2">
                    <input
                      id="feature-enabled"
                      type="checkbox"
                      checked={settings.feature_enabled}
                      onChange={(e) => updateSetting('feature_enabled', e.target.checked)}
                      className="w-4 h-4"
                    />
                    Feature Enabled
                  </Label>
                  <p className="text-xs text-gray-500 mt-1">Enable/disable the study aid feature</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <Link href="/admin/study-aid">
              <Button variant="outline">
                Cancel
              </Button>
            </Link>
            <Button
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>
    </div>
  )
}