'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { updatePricingSettings } from '@/lib/actions/settings.actions'

interface PricingSettings {
  assignmentWriterBase: number
  assignmentWriterPerBracket: number
  assignmentSubmissionBase: number
  assignmentSubmissionPerBracket: number
  testSubmissionBase: number
  defaultSubmissionCost: number
}

export default function PricingSettingsForm({
  initialSettings,
}: {
  initialSettings: PricingSettings
}) {
  const [settings, setSettings] = useState(initialSettings)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleChange = (key: keyof PricingSettings, value: number) => {
    setSettings({ ...settings, [key]: value })
    setMessage(null) // Clear any previous messages when editing
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    try {
      console.log('💾 Saving pricing settings to database:', settings)
      
      // ✅ CHANGED: Actually save to database
      const result = await updatePricingSettings(settings)

      if (result.success) {
        setMessage({
          type: 'success',
          text: 'Pricing settings updated successfully! Changes will apply to all new submissions.',
        })
        console.log('✅ Settings saved successfully')
      } else {
        throw new Error(result.error || 'Failed to save')
      }
    } catch (error) {
      console.error('❌ Failed to save pricing settings:', error)
      setMessage({
        type: 'error',
        text: 'Failed to save pricing settings. Please try again.',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`flex items-start gap-3 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          )}
          <p
            className={`text-sm ${
              message.type === 'success' ? 'text-green-800' : 'text-red-800'
            }`}
          >
            {message.text}
          </p>
        </div>
      )}

      {/* Assignment Writer Pricing */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-semibold text-lg">Assignment Writer</h3>
          <p className="text-sm text-gray-600">
            Pricing structure: Base fee for 1-1000 words, then additional fee per bracket
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Base Price (1-1000 words)</Label>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">₦</span>
                <Input
                  type="number"
                  min={0}
                  value={settings.assignmentWriterBase}
                  onChange={(e) =>
                    handleChange('assignmentWriterBase', Number(e.target.value))
                  }
                  disabled={saving}
                />
              </div>
              <p className="text-xs text-gray-500">Price for 1-1000 words</p>
            </div>

            <div className="space-y-2">
              <Label>Per Additional Bracket (1000 words)</Label>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">₦</span>
                <Input
                  type="number"
                  min={0}
                  value={settings.assignmentWriterPerBracket}
                  onChange={(e) =>
                    handleChange('assignmentWriterPerBracket', Number(e.target.value))
                  }
                  disabled={saving}
                />
              </div>
              <p className="text-xs text-gray-500">Price for each additional 1000-word bracket</p>
            </div>
          </div>

          {/* Example Pricing */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
            <p className="font-medium text-blue-900 mb-2">Example Pricing:</p>
            <ul className="space-y-1 text-blue-800">
              <li>
                • 500 words: ₦{settings.assignmentWriterBase}
              </li>
              <li>
                • 1000 words: ₦{settings.assignmentWriterBase}
              </li>
              <li>
                • 1500 words: ₦{settings.assignmentWriterBase + settings.assignmentWriterPerBracket}
              </li>
              <li>
                • 2000 words: ₦{settings.assignmentWriterBase + settings.assignmentWriterPerBracket}
              </li>
              <li>
                • 2500 words: ₦{settings.assignmentWriterBase + settings.assignmentWriterPerBracket * 2}
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Assignment Submission */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-semibold text-lg">Assignment Submission</h3>
          <p className="text-sm text-gray-600">
            Pricing structure: Base fee for 1-1000 words, then additional fee per bracket
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Base Price (1-1000 words)</Label>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">₦</span>
                <Input
                  type="number"
                  min={0}
                  value={settings.assignmentSubmissionBase}
                  onChange={(e) =>
                    handleChange('assignmentSubmissionBase', Number(e.target.value))
                  }
                  disabled={saving}
                />
              </div>
              <p className="text-xs text-gray-500">Price for 1-1000 words</p>
            </div>

            <div className="space-y-2">
              <Label>Per Additional Bracket (1000 words)</Label>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">₦</span>
                <Input
                  type="number"
                  min={0}
                  value={settings.assignmentSubmissionPerBracket}
                  onChange={(e) =>
                    handleChange('assignmentSubmissionPerBracket', Number(e.target.value))
                  }
                  disabled={saving}
                />
              </div>
              <p className="text-xs text-gray-500">Price for each additional 1000-word bracket</p>
            </div>
          </div>

          {/* Example Pricing */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
            <p className="font-medium text-blue-900 mb-2">Example Pricing:</p>
            <ul className="space-y-1 text-blue-800">
              <li>
                • 500 words: ₦{settings.assignmentSubmissionBase}
              </li>
              <li>
                • 1000 words: ₦{settings.assignmentSubmissionBase}
              </li>
              <li>
                • 1500 words: ₦{settings.assignmentSubmissionBase + settings.assignmentSubmissionPerBracket}
              </li>
              <li>
                • 2000 words: ₦{settings.assignmentSubmissionBase + settings.assignmentSubmissionPerBracket}
              </li>
              <li>
                • 2500 words: ₦{settings.assignmentSubmissionBase + settings.assignmentSubmissionPerBracket * 2}
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Assignment Default Submission Cost */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-semibold text-lg">Default Assignment Submission Cost</h3>
          <p className="text-sm text-gray-600">
            Default cost applied to all assignments when created by lecturers
          </p>

          <div className="space-y-2">
            <Label>Default Submission Cost</Label>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">₦</span>
              <Input
                type="number"
                min={0}
                value={settings.defaultSubmissionCost}
                onChange={(e) =>
                  handleChange('defaultSubmissionCost', Number(e.target.value))
                }
                disabled={saving}
              />
            </div>
            <p className="text-xs text-gray-500">
              Amount automatically applied to all assignments (e.g., ₦200 per submission)
            </p>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
            <p className="text-blue-900">
              💡 <strong>How it works:</strong> When lecturers create assignments, the submission cost is automatically set to <strong>₦{settings.defaultSubmissionCost}</strong>. Students must pay this amount to submit each assignment.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Test Submission */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-semibold text-lg">Test Access Cost</h3>
          <p className="text-sm text-gray-600">
            Default cost for students to take a test
          </p>

          <div className="space-y-2">
            <Label>Test Access Cost</Label>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">₦</span>
              <Input
                type="number"
                min={0}
                value={settings.testSubmissionBase}
                onChange={(e) =>
                  handleChange('testSubmissionBase', Number(e.target.value))
                }
                disabled={saving}
              />
            </div>
            <p className="text-xs text-gray-500">
              Flat rate charged per test attempt (default ₦50)
            </p>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
            <p className="text-blue-900">
              💡 <strong>How it works:</strong> When students start a test, they are charged <strong>₦{settings.testSubmissionBase}</strong> from their wallet. This fee applies to all tests.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full md:w-auto"
          size="lg"
        >
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {saving ? 'Saving...' : 'Save Pricing Settings'}
        </Button>
        
        {!message && (
          <p className="text-sm text-gray-500">
            💾 Changes will apply to all new submissions after saving
          </p>
        )}
      </div>
    </div>
  )
}