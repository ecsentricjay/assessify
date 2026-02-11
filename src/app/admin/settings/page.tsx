// app/admin/settings/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import SystemSettingsForm from '@/components/admin/system-settings-form'

export default async function AdminSettingsPage() {
  // In a real app, fetch current settings from database
  const currentSettings = {
    platformFeePercentage: 27,
    lecturerPercentage: 50,
    partnerPercentage: 15,
    platformPercentage: 35,
    defaultCommissionRate: 15,
    systemNotes: '',
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">System Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure platform fees and commission rates
        </p>
      </div>

      {/* Revenue Model */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Model</CardTitle>
          <CardDescription>
            Current revenue split configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="font-medium text-blue-900 mb-2">With Partner:</p>
              <div className="space-y-1 text-sm text-blue-800">
                <div className="flex justify-between">
                  <span>Lecturer:</span>
                  <span className="font-semibold">{currentSettings.lecturerPercentage}% (₦100)</span>
                </div>
                <div className="flex justify-between">
                  <span>Partner:</span>
                  <span className="font-semibold">{currentSettings.partnerPercentage}% (₦30)</span>
                </div>
                <div className="flex justify-between">
                  <span>Platform:</span>
                  <span className="font-semibold">{currentSettings.platformPercentage}% (₦70)</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="font-medium text-gray-900 mb-2">Without Partner:</p>
              <div className="space-y-1 text-sm text-gray-700">
                <div className="flex justify-between">
                  <span>Lecturer:</span>
                  <span className="font-semibold">50% (₦100)</span>
                </div>
                <div className="flex justify-between">
                  <span>Platform:</span>
                  <span className="font-semibold">50% (₦100)</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings Form */}
      <Card>
        <CardHeader>
          <CardTitle>Fee Configuration</CardTitle>
          <CardDescription>
            Set submission fees and commission rates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SystemSettingsForm initialSettings={currentSettings} />
        </CardContent>
      </Card>

      {/* Important Notes */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="pt-6">
          <div className="space-y-3 text-sm text-yellow-900">
            <p className="font-medium">⚠️ Important Notes:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Changing fees will affect all future submissions</li>
              <li>Existing transactions are not affected by fee changes</li>
              <li>Commission rate changes apply to new partner earnings only</li>
              <li>Always test changes in a staging environment first</li>
              <li>Ensure total percentages add up correctly (Lecturer + Partner + Platform = 100%)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}