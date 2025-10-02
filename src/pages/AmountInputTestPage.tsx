import { useState } from "react"
import { AmountInput, SafeAmountInput } from "@/components/ui/amount-input"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info } from "lucide-react"

export default function AmountInputTestPage() {
  const [amount1, setAmount1] = useState("100.00")
  const [amount2, setAmount2] = useState("50")
  const [normalInput, setNormalInput] = useState("100")

  return (
    <div className="container mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold mb-8">安全金额输入框测试</h1>
      
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>解决的问题：</strong>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>防止点击或聚焦时自动全选</li>
            <li>防止误触删除全部内容（需要按住 Shift 才能删除全部）</li>
            <li>自动格式化金额（失焦时添加小数位）</li>
            <li>只允许输入有效的数字</li>
          </ul>
        </AlertDescription>
      </Alert>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>❌ 普通输入框（有问题）</CardTitle>
            <CardDescription>
              点击会自动全选，容易误删
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-medium">
                $
              </span>
              <Input
                type="text"
                value={normalInput}
                onChange={(e) => setNormalInput(e.target.value)}
                onFocus={(e) => e.target.select()} // 这会导致全选
                placeholder="0.00"
                className="pl-10 h-12 text-lg font-medium"
              />
            </div>
            <p className="text-sm text-gray-600">
              当前值：{normalInput}
            </p>
            <div className="text-xs text-red-600 space-y-1">
              <p>• 点击时会自动全选</p>
              <p>• 按删除键会清空全部</p>
              <p>• 容易误操作</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>✅ 安全金额输入框</CardTitle>
            <CardDescription>
              不会自动全选，防止误删
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <AmountInput
              value={amount1}
              onChange={setAmount1}
              placeholder="0.00"
              currency="RM"
              preventSelectAll={true}
              formatOnBlur={true}
              minValue={0}
              className="h-12 text-lg"
            />
            <p className="text-sm text-gray-600">
              当前值：{amount1}
            </p>
            <div className="text-xs text-green-600 space-y-1">
              <p>• 点击不会全选，光标定位到末尾</p>
              <p>• 单按删除键只删一个字符</p>
              <p>• Shift+Delete 才能删除全部</p>
              <p>• 失焦时自动格式化为两位小数</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>更多配置选项</CardTitle>
          <CardDescription>
            展示不同配置的效果
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="text-sm font-medium mb-2 block">
              限制最大值 (0-1000)
            </label>
            <SafeAmountInput
              value={amount2}
              onChange={setAmount2}
              placeholder="0.00"
              currency="RM"
              minValue={0}
              maxValue={1000}
              className="w-[200px]"
            />
            <p className="text-xs text-gray-600 mt-1">
              超过1000的输入会被阻止
            </p>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">使用说明</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>📌 <strong>防止全选：</strong>点击或聚焦时光标移到末尾</li>
              <li>🔒 <strong>防误删：</strong>需要 Shift+Delete/Backspace 才能删除全部</li>
              <li>✨ <strong>自动格式化：</strong>失去焦点时格式化为两位小数</li>
              <li>🔢 <strong>数字验证：</strong>只允许输入有效数字</li>
              <li>📊 <strong>范围限制：</strong>可设置最小值和最大值</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle>集成代码示例</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-white p-4 rounded-md overflow-x-auto border">
            <code className="text-sm">{`import { AmountInput } from "@/components/ui/amount-input"

<AmountInput
  value={amount}
  onChange={setAmount}
  placeholder="0.00"
  currency="RM"
  preventSelectAll={true}  // 防止自动全选
  formatOnBlur={true}      // 失焦时格式化
  minValue={0}             // 最小值
  maxValue={10000}         // 最大值
/>`}</code>
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}