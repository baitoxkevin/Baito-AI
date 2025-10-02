import { useState } from "react"
import { DatePicker } from "@/components/ui/date-picker"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function DatePickerTestPage() {
  const [date1, setDate1] = useState<Date | undefined>(new Date())
  const [date2, setDate2] = useState<Date | undefined>()
  const [date3, setDate3] = useState<Date | undefined>()

  return (
    <div className="container mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold mb-8">Stable Date Picker</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>✅ Implemented Features</CardTitle>
          <CardDescription>
            Option 2 - Stays open after click, auto-closes after date selection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Default Style</label>
              <DatePicker
                date={date1}
                onDateChange={setDate1}
                placeholder="Select date"
              />
              <p className="text-sm text-gray-600 mt-2">
                Selected: {date1 ? date1.toLocaleDateString('en-US') : 'Not selected'}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Custom Width</label>
              <DatePicker
                date={date2}
                onDateChange={setDate2}
                placeholder="Select date"
                buttonClassName="w-[200px]"
              />
              <p className="text-sm text-gray-600 mt-2">
                Selected: {date2 ? date2.toLocaleDateString('en-US') : 'Not selected'}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">No Icon Version</label>
              <DatePicker
                date={date3}
                onDateChange={setDate3}
                placeholder="Select date"
                showIcon={false}
              />
              <p className="text-sm text-gray-600 mt-2">
                Selected: {date3 ? date3.toLocaleDateString('en-US') : 'Not selected'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usage Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>• <strong>DatePickerFixed</strong>: Provides more control with cancel and confirm buttons</p>
            <p>• <strong>DatePickerStable</strong>: Simple version, auto-closes after date selection</p>
            <p>• Both components ensure the date picker won't close accidentally</p>
            <p>• Supports localized date format display</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Integration Method</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-white p-4 rounded-md overflow-x-auto">
            <code className="text-sm">{`import { DatePickerStable } from "@/components/ui/date-picker-stable"

// 在组件中使用
const [date, setDate] = useState<Date>()

<DatePickerStable
  date={date}
  onDateChange={setDate}
  placeholder="选择日期"
/>`}</code>
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}