'use client'

import { useState, useEffect } from 'react'
import { useAdvancedHailNetCalculatorStore } from '@/store/advancedHailNetCalculator'
import { useAuthStore } from '@/store/authStore'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ArrowLeftIcon, RefreshCcw, CloudSun, Leaf, BarChart3, Download, Lock, Shield, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { Captcha } from '@/components/ui/captcha'

/**
 * @description 自定义本地存储钩子函数，用于保存密码验证状态
 */
const useLocalStorage = <T,>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      if (typeof window !== 'undefined') {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : initialValue;
      }
      return initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
};

/**
 * @description 高级防冰雹网计算器页面
 */
export default function AdvancedHailNetCalculatorPage() {
  const [isLoading, setIsLoading] = useState(true)
  const calculator = useAdvancedHailNetCalculatorStore()
  
  // 使用新的认证系统
  const auth = useAuthStore()
  const [password, setPassword] = useState('')
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [captchaVerified, setCaptchaVerified] = useState(false)
  const [captchaRefreshTrigger, setCaptchaRefreshTrigger] = useState(0)
  
  // 初始化认证系统并检查会话有效性
  useEffect(() => {
    auth.initializeAuth()
    // 定期验证会话有效性，防止会话过期后继续使用
    const sessionInterval = setInterval(() => {
      auth.validateSession()
    }, 60000) // 每分钟检查一次
    
    return () => clearInterval(sessionInterval)
  }, [auth])
  
  // 初始计算
  useEffect(() => {
    const timer = setTimeout(() => {
      calculator.calculate()
      setIsLoading(false)
    }, 400)
    
    return () => clearTimeout(timer)
  }, [calculator])
  
  // 处理密码提交
  const handlePasswordSubmit = () => {
    if (!captchaVerified) {
      toast.error('请先完成验证码验证')
      return
    }
    
    const success = auth.login(password)
    if (success) {
      toast.success('验证成功，欢迎使用高级计算器')
    }
    setPassword('')
    // 重置验证码
    setCaptchaRefreshTrigger(prev => prev + 1)
    setCaptchaVerified(false)
  }
  
  // 处理注销
  const handleLogout = () => {
    auth.logout()
    toast.info('已注销登录')
  }
  
  // 计算会话剩余时间
  const getSessionTimeRemaining = () => {
    if (!auth.isAuthenticated) return null
    
    const elapsed = Date.now() - auth.sessionStartTime
    const remaining = auth.sessionDuration - elapsed
    
    if (remaining <= 0) return '会话已过期'
    
    const hours = Math.floor(remaining / (60 * 60 * 1000))
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000))
    
    return hours + '小时' + minutes + '分钟'
  }
  
  // 格式化价格显示，改为美元，添加空值检查
  const formatPrice = (price: number | undefined) => {
    if (price === undefined || Number.isNaN(price)) return '$0.00';
    return `$${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
  }
  
  // 格式化面积显示，添加空值检查
  const formatArea = (area: number | undefined) => {
    if (area === undefined || Number.isNaN(area)) return '0.00';
    return `${area.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
  }
  
  // 格式化长度显示，保留2位小数
  const formatLength = (length: number | undefined) => {
    if (length === undefined || Number.isNaN(length)) return '0.00';
    return `${length.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
  }
  
  // 格式化尺寸显示，宽度保留一位小数
  const formatSize = (width: number | undefined, length: number | undefined) => {
    if (width === undefined || length === undefined || Number.isNaN(width) || Number.isNaN(length)) {
      return '0.0×0 m';
    }
    return `${width.toFixed(1)}×${length} m`;
  }
  
  // 向上取整到整数
  const ceilToInteger = (value: number | undefined) => {
    if (value === undefined || Number.isNaN(value)) return 0;
    return Math.ceil(value);
  }
  
  // 处理重置
  const handleReset = () => {
    calculator.reset()
    toast.success('已重置计算器')
  }
  
  // 生成专业PDF报价单
  const handleExportPDF = async () => {
    toast.success('正在生成PDF报价清单...')
    
    try {
      // 动态导入jsPDF和AutoTable
      const { default: jsPDF } = await import('jspdf')
      const { default: autoTable } = await import('jspdf-autotable')

      // 创建PDF文档
      const doc = new jsPDF() as any // 使用any类型以支持lastAutoTable属性
      
      // 获取当前数据
      const currentDate = new Date().toISOString().split('T')[0] // YYYY-MM-DD格式
      const netTypeName = calculator.netType === 'T60' ? 'T60' : calculator.netType === 'T90' ? 'T90+' : 'L50'
      const customerNameSafe = calculator.customerName.trim() || 'Unknown_Customer'
      const fileName = `Internal_Quote_${customerNameSafe.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}_${netTypeName}_${currentDate}.pdf`
      
      // 设置字体支持 - 解决中文显示问题
      doc.setFont('helvetica', 'normal')
      
      // 中文字符编码处理函数
      const encodeText = (text: string) => {
        try {
          // 对中文字符进行特殊处理
          return text
        } catch (e) {
          return text
        }
      }
      
      // === 内部警示横幅 ===
      doc.setFillColor(220, 53, 69) // 红色背景
      doc.rect(5, 5, 200, 15, 'F') // 加大警示条尺寸
      doc.setFontSize(11)
      doc.setTextColor(255, 255, 255) // 白色文字
      doc.text('⚠ INTERNAL USE ONLY - CONFIDENTIAL PRICING ⚠', 105, 14, { align: 'center' })
      
      // === 页面标题 ===
      doc.setFont('helvetica', 'bold') // 使用粗体
      doc.setFontSize(22)
      doc.setTextColor(25, 118, 210) // 蓝色标题
      doc.text('HAIL NET MATERIAL QUOTATION', 20, 35)
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(16)
      doc.setTextColor(220, 53, 69) // 红色强调
      doc.text('[INTERNAL ASSESSMENT]', 150, 35)
      
      // 副标题
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(12)
      doc.setTextColor(100, 100, 100)
      doc.text('Professional Agricultural Protection Solution', 20, 45)
      
      // 客户信息区域
      doc.setFillColor(240, 248, 255) // 浅蓝色背景
      doc.rect(15, 50, 180, 15, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.setTextColor(25, 118, 210)
      doc.text(`Customer: ${calculator.customerName || 'Not Specified'}`, 20, 60)
      
      // === 公司信息区域 ===
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(60, 60, 60)
      doc.text(`Quote Date: ${currentDate}`, 20, 72)
      doc.text(`Net Type: ${netTypeName} - ${calculator.getNetTypeDescription ? calculator.getNetTypeDescription(calculator.netType) : ''}`, 20, 78)
      doc.text(`Calculation Mode: ${calculator.calculationMode === 'fuzzy' ? 'Area Estimation' : 'Precise Calculation'}`, 20, 84)
      
      // === 项目概况 ===
      let yPosition = 95
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.setTextColor(25, 118, 210)
      doc.text('PROJECT OVERVIEW', 20, yPosition)
      
      yPosition += 10
      doc.setFontSize(10)
      doc.setTextColor(0, 0, 0)
      
      // 项目信息表格
      const projectData = []
      
      if (calculator.calculationMode === 'fuzzy') {
        projectData.push(
          ['Farm Area', `${calculator.farmAreaHa} hectares`],
          ['Base Coverage Area', `${formatArea(calculator.totalArea)} m²`],
          ['Actual Net Area (x1.155)', `${formatArea(calculator.actualNetArea)} m²`],
          ['Price Margin', `${calculator.priceMargin === 'margin30' ? '30%' : calculator.priceMargin === 'margin40' ? '40%' : '50%'} markup`],
          ['Accessory Package', `${calculator.accessoryType === 'economy' ? 'Economy' : 'Luxury'} Package`]
        )
      } else {
        projectData.push(
          ['Row Count', `${calculator.rowCount} rows`],
          ['Row Length', `${calculator.rowLength} m`],
          ['Row Spacing', `${calculator.rowSpacing} m`],
          ['Net Width', `${formatLength(calculator.netWidth)} m`],
          ['Net Length', `${formatLength(calculator.netLength)} m`],
          ['Total Area', `${formatArea(calculator.totalArea)} m²`],
          ['Price Margin', `${calculator.priceMargin === 'margin30' ? '30%' : calculator.priceMargin === 'margin40' ? '40%' : '50%'} markup`],
          ['Accessory Package', `${calculator.accessoryType === 'economy' ? 'Economy' : 'Luxury'} Package`]
        )
      }
      
      autoTable(doc, {
        startY: yPosition,
        head: [['Project Parameter', 'Value']],
        body: projectData,
        theme: 'grid',
        headStyles: { 
          fillColor: [25, 118, 210], 
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 10
        },
        styles: { 
          fontSize: 9,
          font: 'helvetica'
        },
        columnStyles: {
          0: { cellWidth: 70, fontStyle: 'bold' },
          1: { cellWidth: 90 }
        }
      })
      
      // === 材料清单 ===
      yPosition = doc.lastAutoTable.finalY + 20
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.setTextColor(25, 118, 210)
      doc.text('MATERIAL LIST', 20, yPosition)
      
      // 网布信息
      yPosition += 15
      const netData = [
        [
          netTypeName,
          calculator.rollsNeeded ? `${calculator.rollsNeeded} rolls` : 'Custom',
          formatPrice(calculator.pricePerUnit) + '/m²',
          formatArea(calculator.actualNetArea) + ' m²',
          formatPrice(calculator.netCost)
        ]
      ]
      
      autoTable(doc, {
        startY: yPosition,
        head: [['Net Type', 'Quantity', 'Unit Price', 'Coverage Area', 'Subtotal']],
        body: netData,
        theme: 'grid',
        headStyles: { 
          fillColor: [76, 175, 80], 
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 10
        },
        styles: { 
          fontSize: 9,
          font: 'helvetica'
        }
      })
      
      // 配件清单
      yPosition = doc.lastAutoTable.finalY + 15
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.setTextColor(25, 118, 210)
      doc.text('ACCESSORIES', 20, yPosition)
      
      yPosition += 10
      const accessoryData = [
        ['Net Clips', calculator.netClipsCount.toLocaleString(), '$0.10', formatPrice(calculator.netClipsCount * 0.10)],
        ['Bungee Hooks', calculator.bungeeHooksCount.toLocaleString(), '$0.10', formatPrice(calculator.bungeeHooksCount * 0.10)],
        ['Bungee Cord', calculator.bungeeCordCount.toLocaleString(), '$0.38', formatPrice(calculator.bungeeCordCount * 0.38)]
      ]
      
      // 如果是豪华型配件，添加额外配件
      if (calculator.accessoryType === 'luxury') {
        accessoryData.push(
          ['Wire Clips', calculator.wireClipsCount.toLocaleString(), '$0.10', formatPrice(calculator.wireClipsCount * 0.10)],
          ['Net Connectors', calculator.netConnectorsCount.toLocaleString(), '$0.35', formatPrice(calculator.netConnectorsCount * 0.35)]
        )
      }
      
      autoTable(doc, {
        startY: yPosition,
        head: [['Accessory Item', 'Quantity', 'Unit Price', 'Subtotal']],
        body: accessoryData,
        theme: 'grid',
        headStyles: { 
          fillColor: [255, 152, 0], 
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 10
        },
        styles: { 
          fontSize: 9,
          font: 'helvetica'
        }
      })
      
            // === 成本汇总 ===
      yPosition = doc.lastAutoTable.finalY + 15
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.setTextColor(25, 118, 210)
      doc.text('COST SUMMARY', 20, yPosition)
      
      yPosition += 10
      const costData = [
        ['Net Cost', formatPrice(calculator.netCost)],
        ['Accessories Cost', formatPrice(calculator.accessoriesCost)],
        ['Subtotal', formatPrice(calculator.netCost + calculator.accessoriesCost)]
      ]
      
      // 添加折扣信息（如果有）
      if (calculator.bulkDiscount > 0) {
        costData.push(
          ['Bulk Discount', `-${formatPrice(calculator.discountAmount)} (${(calculator.bulkDiscount * 100).toFixed(1)}%)`]
        )
      }
      
      costData.push(['TOTAL AMOUNT', formatPrice(calculator.totalPrice)])
      
      autoTable(doc, {
        startY: yPosition,
        head: [['Cost Item', 'Amount']],
        body: costData,
        theme: 'grid',
        headStyles: { 
          fillColor: [96, 125, 139], 
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 10
        },
        styles: { 
          fontSize: 10,
          font: 'helvetica'
        },
        bodyStyles: { fontStyle: 'normal' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        didParseCell: (data) => {
          // 突出显示总计行
          if (data.row.index === costData.length - 1) {
            data.cell.styles.fillColor = [25, 118, 210]
            data.cell.styles.textColor = [255, 255, 255]
            data.cell.styles.fontStyle = 'bold'
            data.cell.styles.fontSize = 12
          }
        }
      })
      
      // === 如果是模糊模式，添加每公顷成本分析 ===
      if (calculator.calculationMode === 'fuzzy') {
        yPosition = doc.lastAutoTable.finalY + 15
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(12)
        doc.setTextColor(25, 118, 210)
        doc.text('PER HECTARE ANALYSIS', 20, yPosition)
        
        yPosition += 10
        const perHaData = [
          ['Net Cost per Hectare', formatPrice(calculator.perHaNetCost)],
          ['Accessories Cost per Hectare', formatPrice(calculator.perHaAccessoryCost)],
          ['Total Cost per Hectare', formatPrice(calculator.perHaCost)]
        ]
        
        autoTable(doc, {
          startY: yPosition,
          head: [['Cost Analysis', 'Amount per Hectare']],
          body: perHaData,
          theme: 'grid',
          headStyles: { 
            fillColor: [139, 195, 74], 
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 10
          },
          styles: { 
            fontSize: 9,
            font: 'helvetica'
          }
        })
      }
      
      // === 页脚警示和信息 ===
      const pageHeight = doc.internal.pageSize.height
      
      // 底部警示横幅
      doc.setFillColor(255, 193, 7) // 黄色背景
      doc.rect(5, pageHeight - 35, 200, 10, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(0, 0, 0) // 黑色文字
      doc.text('⚠ WARNING: This document contains confidential pricing for internal evaluation only ⚠', 105, pageHeight - 29, { align: 'center' })
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(100, 100, 100)
      doc.text('This quotation is valid for 30 days from the date of issue.', 20, pageHeight - 20)
      doc.text('Professional Agricultural Hail Protection Solutions', 20, pageHeight - 15)
      doc.text(`Generated on ${new Date().toLocaleString('en-US')}`, 20, pageHeight - 10)
      doc.text('Export Version - Internal Assessment Tool', 20, pageHeight - 5)
      
      // 保存PDF文件
      doc.save(fileName)
      
      toast.success(`PDF报价单已生成：${fileName}`, {
        duration: 4000,
        description: "专业格式的PDF文件已下载到您的设备",
        action: {
          label: "确定",
          onClick: () => {
            toast.info('PDF导出成功！')
          },
        },
      })
      
    } catch (error) {
      console.error('PDF生成失败:', error)
      toast.error('PDF生成失败，请稍后再试', {
        description: '如果问题持续存在，请联系技术支持'
      })
    }
  }
  
  // 密码登录页面
  if (!auth.isAuthenticated) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-green-50 p-4 md:p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <CloudSun className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-blue-800">防冰雹网计算器</h1>
            </div>
            <div className="flex justify-center gap-2">
              <Badge variant="outline" className="text-green-700 border-green-500">出口版</Badge>
              <Badge variant="outline" className="text-purple-700 border-purple-500">内部工具</Badge>
            </div>
            <p className="text-gray-600">请输入访问密码</p>
          </div>
          
          <Card className="bg-white/90 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Lock className="h-5 w-5" />
                <span>安全访问</span>
              </CardTitle>
              <CardDescription>
                此计算器包含内部成本数据，需要密码访问
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">访问密码</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={isPasswordVisible ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入访问密码"
                    className="pr-10"
                    disabled={auth.isLocked()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !auth.isLocked() && captchaVerified) {
                        handlePasswordSubmit();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    disabled={auth.isLocked()}
                  >
                    {isPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              
              {/* 验证码 */}
              {!auth.isLocked() && (
                <Captcha 
                  onVerify={setCaptchaVerified} 
                  refreshTrigger={captchaRefreshTrigger}
                />
              )}
              
              {/* 安全状态显示 */}
              <div className="space-y-2">
                {auth.isLocked() && (
                  <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 flex items-center gap-2">
                    <Lock className="h-4 w-4 text-red-500" />
                    <div>
                      <p className="font-medium">账户暂时锁定</p>
                      <p>由于多次尝试失败，账户已被锁定。请在<span>{Math.ceil(auth.getRemainingLockTime() / 60000)}</span>分钟后重试。</p>
                    </div>
                  </div>
                )}
                
                {!auth.isLocked() && auth.loginAttempts > 0 && (
                  <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-700 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-amber-500" />
                    <div>
                      <p>已尝试 <span>{auth.loginAttempts}</span> 次，还剩 <span>{auth.maxAttempts - auth.loginAttempts}</span> 次机会</p>
                      <p className="text-xs mt-1">连续<span>{auth.maxAttempts}</span>次失败将锁定账户15分钟</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end items-center">
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  <span>内部专用工具</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handlePasswordSubmit} 
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={auth.isLocked()}
              >
                {auth.isLocked() ? '账户已锁定' : '验证密码'}
              </Button>
            </CardFooter>
          </Card>
          
          <div className="text-center space-y-2">
            <Link href="/">
              <Button 
                variant="ghost" 
                size="sm"
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 flex items-center gap-1"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                <span>返回首页</span>
              </Button>
            </Link>
            <div className="text-xs text-gray-500">
              <p>© 2025 防冰雹网计算器 | 出口版 | 内部工具</p>
              <p className="mt-1">忘记密码请联系管理员</p>
            </div>
          </div>
        </div>
      </main>
    )
  }
  
  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-b from-blue-50 to-green-50 p-4 md:p-8">
      <div className="container mx-auto max-w-6xl space-y-8">
        {/* 导航栏 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-blue-500 text-blue-700 px-4 py-1">专业版</Badge>
            <Link href="/">
              <Button 
                variant="ghost" 
                size="sm"
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 flex items-center gap-1"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                <span>返回首页</span>
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            {/* 会话状态显示 */}
            <div className="text-xs text-gray-600">
              会话剩余: {getSessionTimeRemaining()}
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center gap-1"
            >
              <Lock className="h-3 w-3" />
              <span>注销</span>
            </Button>
          </div>
        </div>
        
        {/* 标题 */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <CloudSun className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-blue-800">防冰雹网计算器</h1>
            <Badge variant="outline" className="text-green-700 border-green-500">出口版</Badge>
            <Badge variant="outline" className="text-purple-700 border-purple-500">内部工具</Badge>
          </div>
          <p className="text-gray-600">支持模糊估算与精确计算，以美元(USD)计价，专为内部成本评估设计</p>
        </div>
        
        {isLoading ? (
          // 加载状态
          <Card className="bg-white/80 backdrop-blur">
            <CardContent className="p-8">
              <div className="space-y-4 text-center">
                <Leaf className="mx-auto h-12 w-12 animate-spin text-blue-500" />
                <p className="text-gray-600">正在加载高级计算器...</p>
                <Progress value={65} className="h-2 w-full" />
              </div>
            </CardContent>
          </Card>
        ) : (
          // 计算器主体
          <div className="space-y-6">
            {/* 计算模式选择 */}
            <Card className="bg-white/80 backdrop-blur">
              <CardHeader className="pb-3">
                <CardTitle className="text-blue-800">选择计算模式</CardTitle>
                <CardDescription>
                  根据您掌握的农场信息选择合适的计算模式
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={calculator.calculationMode}
                  onValueChange={(value: 'fuzzy' | 'precise') => calculator.setCalculationMode(value)}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <div className={`flex items-start space-x-3 rounded-lg border p-4 ${calculator.calculationMode === 'fuzzy' ? 'border-blue-500 bg-blue-50' : ''}`}>
                    <RadioGroupItem value="fuzzy" id="fuzzy" className="mt-1" />
                    <div>
                      <Label htmlFor="fuzzy" className="text-base font-medium">模糊估算模式</Label>
                      <p className="text-sm text-gray-500">
                        仅需选择农场总面积（公顷），快速估算网布需求和总价。适合初步规划和预算估算。
                      </p>
                    </div>
                  </div>
                  
                  <div className={`flex items-start space-x-3 rounded-lg border p-4 ${calculator.calculationMode === 'precise' ? 'border-blue-500 bg-blue-50' : ''}`}>
                    <RadioGroupItem value="precise" id="precise" className="mt-1" />
                    <div>
                      <Label htmlFor="precise" className="text-base font-medium">精确计算模式</Label>
                      <p className="text-sm text-gray-500">
                        输入种植行数、长度、间距等，精准计算所需网布数量与价格。适合详细规划和准确预算。
                      </p>
                    </div>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
            
            {/* 参数输入卡片 */}
            <Card className="bg-white/80 backdrop-blur">
              <CardHeader className="pb-3">
                <CardTitle className="text-blue-800">输入参数</CardTitle>
                <CardDescription>
                  {calculator.calculationMode === 'fuzzy' 
                    ? '请选择您的农场总面积' 
                    : '请输入您的农场种植行信息'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 客户名称输入 */}
                <div className="space-y-2">
                  <Label htmlFor="customerName" className="flex items-center gap-2">
                    <span>客户名称</span>
                    <Badge variant="secondary" className="text-xs">内部记录</Badge>
                  </Label>
                  <Input
                    id="customerName"
                    type="text"
                    value={calculator.customerName}
                    onChange={(e) => calculator.setCustomerName(e.target.value)}
                    placeholder="请输入客户名称（用于PDF报价记录）"
                    className="focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    此信息将包含在PDF报价单中，仅供内部使用
                  </p>
                </div>
                
                <Separator />
                
                {calculator.calculationMode === 'fuzzy' ? (
                  // 模糊模式参数
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="farmAreaHa">农场面积 (公顷)</Label>
                      <div className="grid grid-cols-5 gap-2">
                        {calculator.getFarmAreaOptions().map((area) => (
                          <Button
                            key={area}
                            type="button"
                            variant={calculator.farmAreaHa === area ? "default" : "outline"}
                            className={calculator.farmAreaHa === area ? "bg-blue-600" : ""}
                            onClick={() => calculator.setFarmAreaHa(area)}
                          >
                            {area} 公顷
                          </Button>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500">1公顷 = 10,000平方米 = 15亩</p>
                    </div>
                  </div>
                ) : (
                  // 精确模式参数
                  <div className="grid gap-6 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="rowCount">行数</Label>
                      <Input
                        id="rowCount"
                        type="number"
                        min="2"
                        value={calculator.rowCount}
                        onChange={(e) => calculator.setRowCount(Number(e.target.value))}
                        className="focus:ring-blue-500"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="rowLength">行长度 (米)</Label>
                      <Input
                        id="rowLength"
                        type="number"
                        min="1"
                        value={calculator.rowLength}
                        onChange={(e) => calculator.setRowLength(Number(e.target.value))}
                        className="focus:ring-blue-500"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="rowSpacing">行间距 (米)</Label>
                      <Input
                        id="rowSpacing"
                        type="number"
                        min="0.5"
                        step="0.1"
                        value={calculator.rowSpacing}
                        onChange={(e) => calculator.setRowSpacing(Number(e.target.value))}
                        className="focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
                
                <Separator />
                
                {/* 共同参数 */}
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="netType">网布型号</Label>
                    <Select
                      value={calculator.netType}
                      onValueChange={(value: 'T60' | 'T90' | 'L50') => calculator.setNetType(value)}
                    >
                      <SelectTrigger id="netType" className="focus:ring-blue-500">
                        <SelectValue placeholder="选择网布型号" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="T60">T60 - {calculator.getNetTypeDescription ? calculator.getNetTypeDescription('T60') : '700kly | 5 years'}</SelectItem>
                        <SelectItem value="T90">T90+ - {calculator.getNetTypeDescription ? calculator.getNetTypeDescription('T90') : '1200kly | 8 years'}</SelectItem>
                        <SelectItem value="L50">L50 - {calculator.getNetTypeDescription ? calculator.getNetTypeDescription('L50') : '700kly | 6 years'}</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="mt-2 rounded-md bg-gray-50 p-2 text-xs text-gray-600">
                      <span>基础价格: {formatPrice(calculator.basePrice)}/㎡</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="priceMargin">价格区间</Label>
                    <Select
                      value={calculator.priceMargin}
                      onValueChange={(value: 'margin30' | 'margin40' | 'margin50') => calculator.setPriceMargin(value)}
                    >
                      <SelectTrigger id="priceMargin" className="focus:ring-blue-500">
                        <SelectValue placeholder="选择价格区间" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="margin30">30% 加价</SelectItem>
                        <SelectItem value="margin40">40% 加价</SelectItem>
                        <SelectItem value="margin50">50% 加价</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="mt-2 rounded-md bg-gray-50 p-2 text-xs text-gray-600">
                      <span>最终单价: {formatPrice(calculator.pricePerUnit)}/㎡</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="accessoryType">配件类型</Label>
                    <Select
                      value={calculator.accessoryType}
                      onValueChange={(value: 'economy' | 'luxury') => calculator.setAccessoryType(value)}
                    >
                      <SelectTrigger id="accessoryType" className="focus:ring-blue-500">
                        <SelectValue placeholder="选择配件类型" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="economy">A - 经济型配件</SelectItem>
                        <SelectItem value="luxury">B - 豪华型配件</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="mt-2 rounded-md bg-gray-50 p-2 text-xs text-gray-600">
                      {calculator.accessoryType === 'economy' ? (
                        <p>经济型配件包含: Net Clips, Bungee Hooks, Bungee Cord</p>
                      ) : (
                        <p>豪华型配件包含: Wire Clips, Net Connectors, Net Clips, Bungee Hooks, Bungee Cord</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-blue-50/50 flex justify-end py-3">
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="flex items-center gap-2 border-blue-600 text-blue-700 hover:bg-blue-50"
                >
                  <RefreshCcw className="h-4 w-4" />
                  <span>重置所有参数</span>
                </Button>
              </CardFooter>
            </Card>
            
            {/* 计算结果卡片 */}
            <Card className="bg-white/80 backdrop-blur">
              <CardHeader className="pb-3 border-b border-gray-100">
                <CardTitle className="text-blue-800">计算结果</CardTitle>
                <CardDescription>
                  防冰雹网材料需求与成本估算
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-5">
                {/* 主要结果 */}
                <div className="rounded-lg bg-blue-50 p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-blue-800">总成本: {formatPrice(calculator.totalPrice)}</h3>
                    {calculator.bulkDiscount > 0 && (
                      <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 px-3 py-1">
                        已享受 {(calculator.bulkDiscount * 100).toFixed(0)}% 量大折扣优惠 {formatPrice(calculator.discountAmount)}
                      </Badge>
                    )}
                  </div>
                  
                  {/* 成本对比卡片 */}
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <h4 className="text-base font-medium text-gray-700 mb-3">成本构成分析</h4>
                    
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-gray-600">网布总价</span>
                          <span className="font-medium text-blue-700">{formatPrice(calculator.netCost)}</span>
                        </div>
                        <Progress 
                          value={(calculator.netCost / (calculator.netCost + calculator.accessoriesCost) * 100)} 
                          className="h-2 bg-gray-100"
                        />
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs text-gray-500">{(calculator.netCost / (calculator.netCost + calculator.accessoriesCost) * 100).toFixed(1)}%</span>
                          <span className="text-xs text-gray-500">{formatPrice(calculator.netCost / (calculator.calculationMode === 'fuzzy' ? calculator.farmAreaHa : (calculator.totalArea / 10000)))}/公顷</span>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-gray-600">配件总价</span>
                          <span className="font-medium text-green-700">{formatPrice(calculator.accessoriesCost)}</span>
                        </div>
                        <Progress 
                          value={(calculator.accessoriesCost / (calculator.netCost + calculator.accessoriesCost) * 100)} 
                          className="h-2 bg-gray-100"
                        />
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs text-gray-500">{(calculator.accessoriesCost / (calculator.netCost + calculator.accessoriesCost) * 100).toFixed(1)}%</span>
                          <span className="text-xs text-gray-500">{formatPrice(calculator.accessoriesCost / (calculator.calculationMode === 'fuzzy' ? calculator.farmAreaHa : (calculator.totalArea / 10000)))}/公顷</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="relative pt-2">
                      <div className="flex w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="bg-blue-500 h-full" 
                          style={{ width: `${(calculator.netCost / (calculator.netCost + calculator.accessoriesCost) * 100).toFixed(1)}%` }}
                        />
                        <div 
                          className="bg-green-500 h-full" 
                          style={{ width: `${(calculator.accessoriesCost / (calculator.netCost + calculator.accessoriesCost) * 100).toFixed(1)}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-2 text-xs text-gray-600">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-blue-500 rounded-full mr-1" />
                          <span>网布: {(calculator.netCost / (calculator.netCost + calculator.accessoriesCost) * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-green-500 rounded-full mr-1" />
                          <span>配件: {(calculator.accessoriesCost / (calculator.netCost + calculator.accessoriesCost) * 100).toFixed(1)}%</span>
                        </div>
                        {calculator.bulkDiscount > 0 && (
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-green-200 border border-green-500 rounded-full mr-1" />
                            <span>折扣: {(calculator.bulkDiscount * 100).toFixed(0)}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {calculator.calculationMode === 'fuzzy' && (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="rounded-md bg-white p-3 shadow-sm">
                        <h4 className="text-sm font-medium text-gray-500 mb-1">每公顷网布成本</h4>
                        <div className="font-medium text-lg text-blue-700">{formatPrice(calculator.perHaNetCost)}</div>
                        <div className="mt-2">
                          <Progress 
                            value={(calculator.netCost / (calculator.netCost + calculator.accessoriesCost) * 100)} 
                            className="h-2 bg-gray-100"
                          />
                          <div className="text-xs text-gray-500 mt-1">
                            {(calculator.netCost / (calculator.netCost + calculator.accessoriesCost) * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                      <div className="rounded-md bg-white p-3 shadow-sm">
                        <h4 className="text-sm font-medium text-gray-500 mb-1">每公顷配件成本</h4>
                        <div className="font-medium text-lg text-blue-700">{formatPrice(calculator.perHaAccessoryCost)}</div>
                        <div className="mt-2">
                          <Progress 
                            value={(calculator.accessoriesCost / (calculator.netCost + calculator.accessoriesCost) * 100)} 
                            className="h-2 bg-gray-100"
                          />
                          <div className="text-xs text-gray-500 mt-1">
                            {(calculator.accessoriesCost / (calculator.netCost + calculator.accessoriesCost) * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                      <div className="rounded-md bg-white p-3 shadow-sm">
                        <h4 className="text-sm font-medium text-gray-500 mb-1">每公顷总成本</h4>
                        <div className="font-medium text-lg text-blue-700">{formatPrice(calculator.perHaCost)}</div>
                        <div className="mt-2">
                          <div className="flex w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="bg-blue-500 h-full" 
                              style={{ width: `${(calculator.netCost / (calculator.netCost + calculator.accessoriesCost) * 100).toFixed(1)}%` }}
                            />
                            <div 
                              className="bg-green-500 h-full" 
                              style={{ width: `${(calculator.accessoriesCost / (calculator.netCost + calculator.accessoriesCost) * 100).toFixed(1)}%` }}
                            />
                          </div>
                          <div className="text-xs text-gray-500 mt-1 flex justify-between">
                            <span>网布: {(calculator.netCost / (calculator.netCost + calculator.accessoriesCost) * 100).toFixed(1)}%</span>
                            <span>配件: {(calculator.accessoriesCost / (calculator.netCost + calculator.accessoriesCost) * 100).toFixed(1)}%</span>
                            {calculator.bulkDiscount > 0 && (
                              <span className="text-green-600">已优惠 {(calculator.bulkDiscount * 100).toFixed(0)}%</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* 基本信息展示 */}
                  <div className="grid grid-cols-3 gap-4 text-sm text-gray-600 bg-white p-3 rounded-md shadow-sm">
                    <div>
                      <h4 className="text-gray-500 font-medium">网布型号</h4>
                      <div className="font-medium text-base mt-1">
                        {calculator.netType === 'T60' && 'T60防冰雹网'}
                        {calculator.netType === 'T90' && 'T90+防冰雹网'}
                        {calculator.netType === 'L50' && 'L50防冰雹网'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {calculator.getNetTypeDescription ? calculator.getNetTypeDescription(calculator.netType) : ''}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-gray-500 font-medium">价格计算</h4>
                      <div className="font-medium text-base mt-1">
                        {formatPrice(calculator.basePrice)} + {calculator.priceMargin === 'margin30' ? '30%' : calculator.priceMargin === 'margin40' ? '40%' : '50%'}
                      </div>
                      <div className="text-xs text-blue-600 font-semibold mt-1">
                        {formatPrice(calculator.pricePerUnit)}/㎡
                      </div>
                    </div>
                    <div>
                      <h4 className="text-gray-500 font-medium">网布面积</h4>
                      {calculator.calculationMode === 'fuzzy' ? (
                        <>
                          <div className="font-medium text-base mt-1">基础: {formatArea(calculator.totalArea)} ㎡</div>
                          <div className="text-xs text-blue-600 font-semibold mt-1">
                            实际: {formatArea(calculator.actualNetArea)} ㎡ (×1.155)
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="font-medium text-base mt-1">精确: {formatArea(calculator.totalArea)} ㎡</div>
                          <div className="text-xs text-blue-600 font-semibold mt-1">
                            规格: {formatSize(calculator.netWidth, calculator.netLength)} | {calculator.rollsNeeded} 卷
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* 精确模式网布信息卡片 */}
                {calculator.calculationMode === 'precise' && (
                  <div className="bg-white p-5 rounded-lg shadow-sm mt-4 border-t-4 border-blue-500">
                    <h3 className="text-lg font-semibold text-blue-800 mb-4">网布规格详情</h3>
                    
                    <div className="grid grid-cols-3 gap-5">
                      <div className="bg-blue-50 rounded-md p-3 border-l-4 border-blue-400">
                        <div className="text-sm text-gray-500 mb-1">网布型号</div>
                        <div className="text-xl font-bold text-blue-700">
                          {calculator.netType === 'T60' && 'T60'}
                          {calculator.netType === 'T90' && 'T90+'}
                          {calculator.netType === 'L50' && 'L50'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {calculator.getNetTypeDescription ? calculator.getNetTypeDescription(calculator.netType) : ''}
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 rounded-md p-3 border-l-4 border-blue-400">
                        <div className="text-sm text-gray-500 mb-1">网布尺寸</div>
                        <div className="text-xl font-bold text-blue-700">
                          {formatSize(calculator.netWidth, calculator.netLength)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          宽度已取整到0.2的倍数，长度为5的倍数
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 rounded-md p-3 border-l-4 border-blue-400">
                        <div className="text-sm text-gray-500 mb-1">需要数量</div>
                        <div className="text-xl font-bold text-blue-700">
                          {calculator.rollsNeeded} 卷
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          总面积: {formatArea(calculator.totalArea)} 平方米
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-5 mt-4">
                      <div className="bg-gray-50 rounded-md p-3 border-l-4 border-gray-300">
                        <div className="text-sm text-gray-500 mb-1">单卷面积</div>
                        <div className="text-lg font-medium text-gray-800">
                          {formatArea(calculator.netWidth * calculator.netLength)} 平方米
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          每卷覆盖一行作物
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 rounded-md p-3 border-l-4 border-gray-300">
                        <div className="text-sm text-gray-500 mb-1">单位价格</div>
                        <div className="text-lg font-medium text-gray-800">
                          {formatPrice(calculator.pricePerUnit)}/㎡
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          基础价格 + {calculator.priceMargin === 'margin30' ? '30%' : calculator.priceMargin === 'margin40' ? '40%' : '50%'}
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 rounded-md p-3 border-l-4 border-gray-300">
                        <div className="text-sm text-gray-500 mb-1">网布总价</div>
                        <div className="text-lg font-medium text-gray-800">
                          {formatPrice(calculator.netCost)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          不含配件费用
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* 材料清单 */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium text-gray-700">材料清单</h3>
                    <Button
                      onClick={handleExportPDF}
                      variant="outline"
                      className="flex items-center gap-2 border-blue-600 text-blue-700 hover:bg-blue-50"
                    >
                      <Download className="h-4 w-4" />
                      <span>导出PDF清单</span>
                    </Button>
                  </div>
                  
                  <div className="overflow-x-auto border rounded-md shadow-sm">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50 text-left">
                          <th className="border-b px-4 py-3 text-sm font-medium text-gray-700">材料项目</th>
                          <th className="border-b px-4 py-3 text-right text-sm font-medium text-gray-700">数量</th>
                          <th className="border-b px-4 py-3 text-right text-sm font-medium text-gray-700">单价</th>
                          <th className="border-b px-4 py-3 text-right text-sm font-medium text-gray-700">总价</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* 网布材料 */}
                        <tr>
                          <td className="border-b px-4 py-3 font-medium">
                            {calculator.netType === 'T60' && 'T60防冰雹网'}
                            {calculator.netType === 'T90' && 'T90+防冰雹网'}
                            {calculator.netType === 'L50' && 'L50防冰雹网'}
                            <div className="text-xs text-gray-500">
                              {calculator.getNetTypeDescription ? calculator.getNetTypeDescription(calculator.netType) : ''}
                            </div>
                            {calculator.calculationMode === 'fuzzy' ? (
                              <div className="text-xs text-blue-600 mt-1">
                                基础面积: {formatArea(calculator.totalArea)} ㎡ × {calculator.getRoofStructureFactor ? calculator.getRoofStructureFactor() : 1.155} (屋顶结构系数)
                              </div>
                            ) : (
                              <div className="text-xs text-blue-600 mt-1">
                                规格: <span className="font-semibold">{formatSize(calculator.netWidth, calculator.netLength)}</span> | 数量: <span className="font-semibold">{calculator.rollsNeeded} 卷</span>
                              </div>
                            )}
                          </td>
                          <td className="border-b px-4 py-3 text-right">
                            {formatArea(calculator.actualNetArea)} ㎡
                          </td>
                          <td className="border-b px-4 py-3 text-right">
                            {formatPrice(calculator.pricePerUnit)}/㎡
                          </td>
                          <td className="border-b px-4 py-3 text-right font-medium">
                            {formatPrice(calculator.netCost)}
                          </td>
                        </tr>
                        
                        {/* 配件 - Net Clips */}
                        <tr className="bg-gray-50">
                          <td className="border-b px-4 py-3 font-medium">Net Clips</td>
                          <td className="border-b px-4 py-3 text-right">{calculator.netClipsCount} 个</td>
                          <td className="border-b px-4 py-3 text-right">$0.10/个</td>
                          <td className="border-b px-4 py-3 text-right font-medium">
                            {formatPrice(calculator.netClipsCount * 0.10)}
                          </td>
                        </tr>
                        
                        {/* 配件 - Bungee Hooks */}
                        <tr>
                          <td className="border-b px-4 py-3 font-medium">Bungee Hooks</td>
                          <td className="border-b px-4 py-3 text-right">{calculator.bungeeHooksCount} 个</td>
                          <td className="border-b px-4 py-3 text-right">$0.10/个</td>
                          <td className="border-b px-4 py-3 text-right font-medium">
                            {formatPrice(calculator.bungeeHooksCount * 0.10)}
                          </td>
                        </tr>
                        
                        {/* 配件 - Bungee Cord */}
                        <tr className="bg-gray-50">
                          <td className="border-b px-4 py-3 font-medium">Bungee Cord</td>
                          <td className="border-b px-4 py-3 text-right">{calculator.bungeeCordCount} 个</td>
                          <td className="border-b px-4 py-3 text-right">$0.38/个</td>
                          <td className="border-b px-4 py-3 text-right font-medium">
                            {formatPrice(calculator.bungeeCordCount * 0.38)}
                          </td>
                        </tr>
                        
                        {/* 豪华型额外配件 - Wire Clips */}
                        {calculator.accessoryType === 'luxury' && (
                          <tr>
                            <td className="border-b px-4 py-3 font-medium">Wire Clips</td>
                            <td className="border-b px-4 py-3 text-right">{calculator.wireClipsCount} 个</td>
                            <td className="border-b px-4 py-3 text-right">$0.10/个</td>
                            <td className="border-b px-4 py-3 text-right font-medium">
                              {formatPrice(calculator.wireClipsCount * 0.10)}
                            </td>
                          </tr>
                        )}
                        
                        {/* 豪华型额外配件 - Net Connectors */}
                        {calculator.accessoryType === 'luxury' && (
                          <tr className="bg-gray-50">
                            <td className="border-b px-4 py-3 font-medium">Net Connectors</td>
                            <td className="border-b px-4 py-3 text-right">{calculator.netConnectorsCount} 个</td>
                            <td className="border-b px-4 py-3 text-right">$0.35/个</td>
                            <td className="border-b px-4 py-3 text-right font-medium">
                              {formatPrice(calculator.netConnectorsCount * 0.35)}
                            </td>
                          </tr>
                        )}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-50">
                          <td className="border-b px-4 py-3 font-medium">小计</td>
                          <td className="border-b px-4 py-3" />
                          <td className="border-b px-4 py-3" />
                          <td className="border-b px-4 py-3 text-right font-medium">
                            {formatPrice(calculator.netCost + calculator.accessoriesCost)}
                          </td>
                        </tr>
                        
                        {calculator.bulkDiscount > 0 && (
                          <tr className="bg-green-50">
                            <td className="border-b px-4 py-3 font-medium text-green-700">量大折扣 ({(calculator.bulkDiscount * 100).toFixed(0)}%)</td>
                            <td className="border-b px-4 py-3" />
                            <td className="border-b px-4 py-3" />
                            <td className="border-b px-4 py-3 text-right font-medium text-green-700">
                              -{formatPrice(calculator.discountAmount)}
                            </td>
                          </tr>
                        )}
                        
                        <tr className="bg-blue-50">
                          <td className="px-4 py-3 font-bold text-blue-800">总计</td>
                          <td className="px-4 py-3" />
                          <td className="px-4 py-3" />
                          <td className="px-4 py-3 text-right font-bold text-blue-800 text-lg">
                            {formatPrice(calculator.totalPrice)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
                
                {/* 注意事项 */}
                <div className="rounded-lg border-l-4 border-amber-500 bg-amber-50 p-4">
                  <h4 className="font-medium text-amber-800">计算说明</h4>
                  <div className="text-sm text-gray-600 space-y-2">
                    <p>
                      支撑结构（柱子、钢丝）未计入成本。价格以美元(USD)计价，实际价格可能因安装方式、季节和市场波动而有所变化。
                    </p>
                    
                    <div className="pt-1">
                      <p className="font-medium text-amber-700">屋顶结构系数说明:</p>
                      {calculator.calculationMode === 'fuzzy' ? (
                        <p>由于采用屋顶(Roof)结构安装而非平铺(Flat)安装，实际需要的网布面积为平铺面积的1.155倍。</p>
                      ) : (
                        <p>精确计算模式下不使用屋顶结构系数，直接使用宽度取整后的精确尺寸计算。</p>
                      )}
                    </div>
                    
                    <div className="pt-1">
                      <p className="font-medium text-amber-700">量大折扣优惠说明:</p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>50公顷及以上订单: 享受2%总价折扣</li>
                        <li>100公顷及以上订单: 享受5%总价折扣</li>
                      </ul>
                    </div>
                    
                    {calculator.calculationMode === 'fuzzy' && (
                      <div className="pt-1">
                        <p className="font-medium text-amber-700">模糊模式计算说明:</p>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>基础面积 = 农场面积(公顷) × 10,000 = {formatArea(calculator.totalArea)} 平方米</li>
                          <li>实际网布面积 = 基础面积 × 屋顶结构系数(1.155) = {formatArea(calculator.actualNetArea)} 平方米</li>
                          <li>配件数量基于10公顷标准地块计算 (宽300米，长334米，行距4米 = 75行)</li>
                          <li>Net Clips (网夹): 每米2个 × 行长 × 行数 = 334米 × 2 × 75行 = 50,100个(10公顷)</li>
                          <li>Bungee Hooks (弹力钩): 每米2个 × 行长 × 行数 = 334米 × 2 × 75行 = 50,100个(10公顷)</li>
                          <li>Bungee Cord (弹力绳): 每米1个 × 行长 × 行数 = 334米 × 1 × 75行 = 25,050个(10公顷)</li>
                          <li>其他面积: 按照与10公顷的面积比例计算 (例如：5公顷为10公顷的一半，20公顷为10公顷的两倍)</li>
                        </ul>
                      </div>
                    )}
                    
                    {calculator.calculationMode === 'precise' && (
                      <div className="pt-1">
                        <p className="font-medium text-amber-700">精确模式计算公式:</p>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>网幅宽 = 2 × 行间距 / √3 = {calculator.netWidth.toFixed(1)} 米 (已向上取整到0.2的倍数)</li>
                          <li>网长度 = 行长度 + 15米 = {calculator.netLength} 米 (已取整到5的倍数)</li>
                          <li>总面积 = 宽 × 长 × 行数 = {formatArea(calculator.totalArea)} 平方米</li>
                          <li>精确模式下不使用屋顶结构系数，实际面积就是总面积</li>
                          <li>单价计算: 基础价格 × (1 + 加价百分比) = {formatPrice(calculator.basePrice)} × (1 + {calculator.priceMargin === 'margin30' ? '30%' : calculator.priceMargin === 'margin40' ? '40%' : '50%'}) = {formatPrice(calculator.pricePerUnit)}/㎡</li>
                          <li>每卷网布尺寸: {formatSize(calculator.netWidth, calculator.netLength)}，面积: {formatArea(calculator.netWidth * calculator.netLength)} 平方米</li>
                          <li>总卷数: {calculator.rollsNeeded} 卷 (一行一卷)</li>
                          <li>Net Clips (网夹): 每米2个 × 行长 × 行数 = {formatArea(calculator.rowLength)}米 × 2 × {calculator.rowCount}行 = {calculator.netClipsCount}个</li>
                          <li>Bungee Hooks (弹力钩): 每米2个 × 行长 × 行数 = {formatArea(calculator.rowLength)}米 × 2 × {calculator.rowCount}行 = {calculator.bungeeHooksCount}个</li>
                          <li>Bungee Cord (弹力绳): 每米1个 × 行长 × 行数 = {formatArea(calculator.rowLength)}米 × 1 × {calculator.rowCount}行 = {calculator.bungeeCordCount}个</li>
                          {calculator.accessoryType === 'luxury' && (
                            <>
                              <li>Wire Clips (钢丝夹): 每米1个 × 行长 × 行数 = {formatArea(calculator.rowLength)}米 × 1 × {calculator.rowCount}行 = {calculator.wireClipsCount}个</li>
                              <li>Net Connectors (网连接器): 每米1个 × 行长 × 行数 = {formatArea(calculator.rowLength)}米 × 1 × {calculator.rowCount}行 = {calculator.netConnectorsCount}个</li>
                            </>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-blue-50/50 flex justify-end py-4">
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="flex items-center gap-2 border-blue-600 text-blue-700 hover:bg-blue-50"
                >
                  <RefreshCcw className="h-4 w-4" />
                  <span>重置所有参数</span>
                </Button>
              </CardFooter>
            </Card>
            
            {/* 优势说明卡片 */}
            <Card className="bg-white/80 backdrop-blur">
              <CardHeader className="pb-3">
                <CardTitle className="text-blue-800">防冰雹网优势</CardTitle>
                <CardDescription>
                  为什么选择我们的防冰雹网产品？
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg border p-4 space-y-2">
                    <h4 className="font-medium text-blue-700">高效防护</h4>
                    <p className="text-sm text-gray-600">
                      我们的防冰雹网能有效阻挡95%以上的冰雹，保护您的农作物免受损害，减少产量损失。
                    </p>
                  </div>
                  
                  <div className="rounded-lg border p-4 space-y-2">
                    <h4 className="font-medium text-blue-700">耐久持久</h4>
                    <p className="text-sm text-gray-600">
                      采用高质量材料制造，防紫外线，耐腐蚀，使用寿命可达8-10年，性价比极高。
                    </p>
                  </div>
                  
                  <div className="rounded-lg border p-4 space-y-2">
                    <h4 className="font-medium text-blue-700">安装简便</h4>
                    <p className="text-sm text-gray-600">
                      我们提供专业安装指导和服务，同时产品设计便于农户自行安装，灵活应对不同需求。
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        <footer className="text-center text-sm text-gray-500">
          <p>© 2025 防冰雹网计算器 | 出口版 | 内部工具 | 所有价格以美元(USD)计价 | 仅供成本估算参考</p>
        </footer>
      </div>
    </main>
  )
} 