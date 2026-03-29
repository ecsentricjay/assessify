// components/admin/system-settings-form.tsx
'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Loader2, Save } from 'lucide-react'

interface SystemSettingsFormProps {
  initialSettings?: {
    platformFeePercentage?: number
    lecturerPercentage?: number
    partnerPercentage?: number
    platformPercentage?: number
    defaultCommissionRate?: number
    systemNotes?: string
  }
}

export default function SystemSettingsForm({ 
  initialSettings = {} 
}: SystemSettingsFormProps) {
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState({
    platformFeePercentage: initialSettings.platformFeePercentage || 50,
    lecturerPercentage: initialSettings.lecturerPercentage || 35,
    partnerPercentage: initialSettings.partnerPercentage || 15,
    platformPercentage: initialSettings.platformPercentage || 50,
    defaultCommissionRate: initialSettings.defaultCommissionRate || 15,
    systemNotes: initialSettings.systemNotes || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // TODO: Add your save settings action here
      // await saveSystemSettings(settings)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast.success('Settings saved successfully!')
    } catch (error) {
      console.error('Save settings error:', error)
      toast.error('Failed to save settings')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setSettings({
      platformFeePercentage: 50,
      lecturerPercentage: 35,
      partnerPercentage: 15,
      platformPercentage: 50,
      defaultCommissionRate: 15,
      systemNotes: '',
    })
    toast.info('Settings reset to defaults')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Revenue Split Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Split Configuration</CardTitle>
          <CardDescription>
            Configure how revenue is distributed across the platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lecturerPercentage">Lecturer Percentage (%)</Label>
              <Input
                id="lecturerPercentage"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={settings.lecturerPercentage}
                onChange={(e) => setSettings({ ...settings, lecturerPercentage: Number(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground">
                Percentage of revenue that goes to lecturers
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="partnerPercentage">Partner Percentage (%)</Label>
              <Input
                id="partnerPercentage"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={settings.partnerPercentage}
                onChange={(e) => setSettings({ ...settings, partnerPercentage: Number(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground">
                Default percentage partners earn from referrals
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="platformPercentage">Platform Percentage (%)</Label>
              <Input
                id="platformPercentage"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={settings.platformPercentage}
                onChange={(e) => setSettings({ ...settings, platformPercentage: Number(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground">
                Platform&apos;s share of revenue
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="platformFeePercentage">Platform Fee (%)</Label>
              <Input
                id="platformFeePercentage"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={settings.platformFeePercentage}
                onChange={(e) => setSettings({ ...settings, platformFeePercentage: Number(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground">
                Total platform fee percentage
              </p>
            </div>
          </div>

          {/* Revenue Split Summary */}
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-900 mb-2">Revenue Split Summary:</p>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-blue-600">Lecturer</p>
                <p className="font-bold text-blue-900">{settings.lecturerPercentage}%</p>
              </div>
              <div>
                <p className="text-blue-600">Partner</p>
                <p className="font-bold text-blue-900">{settings.partnerPercentage}%</p>
              </div>
              <div>
                <p className="text-blue-600">Platform</p>
                <p className="font-bold text-blue-900">{settings.platformPercentage}%</p>
              </div>
            </div>
            <p className="text-xs text-blue-700 mt-2">
              Total: {settings.lecturerPercentage + settings.partnerPercentage + settings.platformPercentage}%
              {settings.lecturerPercentage + settings.partnerPercentage + settings.platformPercentage !== 100 && (
                <span className="text-red-600 font-medium"> (Should equal 100%)</span>
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Partner Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Partner Configuration</CardTitle>
          <CardDescription>
            Default settings for new partners
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="defaultCommissionRate">Default Commission Rate (%)</Label>
            <Input
              id="defaultCommissionRate"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={settings.defaultCommissionRate}
              onChange={(e) => setSettings({ ...settings, defaultCommissionRate: Number(e.target.value) })}
            />
            <p className="text-xs text-muted-foreground">
              Default commission rate for new partners
            </p>
          </div>
        </CardContent>
      </Card>

      {/* System Notes */}
      <Card>
        <CardHeader>
          <CardTitle>System Notes</CardTitle>
          <CardDescription>
            Internal notes about system configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            id="systemNotes"
            placeholder="Add any notes about system configuration..."
            value={settings.systemNotes}
            onChange={(e) => setSettings({ ...settings, systemNotes: e.target.value })}
            rows={5}
          />
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center gap-4">
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </>
          )}
        </Button>
        <Button type="button" variant="outline" onClick={handleReset} disabled={loading}>
          Reset to Defaults
        </Button>
      </div>
    </form>
  )
}