'use client'

import { useState, useEffect } from 'react'
import { useBasicHailNetCalculatorStore } from '@/store/basicHailNetCalculator'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { ArrowLeftIcon, RefreshCcw, CloudSun, Leaf, BarChart3, Download } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

/**
 * @description 基础防冰雹网计算器页面
 */
export default function BasicHailNetCalculatorPage() {
  const [isLoading, setIsLoading] = useState(true)
  const calculator = useBasicHailNetCalculatorStore()
  
  // 初始计算
  useEffect(() => {
    const timer = setTimeout(() => {
      calculator.calculate()
      setIsLoading(false)
    }, 400)
    
    return () => clearTimeout(timer)
  }, [calculator])
  
  // 格式化价格显示（人民币）
  const formatPrice = (price: number | undefined) => {
    if (price === undefined || Number.isNaN(price)) return '¥0.00';
    return `¥${price.toLocaleString('zh-CN', { maximumFractionDigits: 2 })}`
  }
  
  // 格式化面积显示
  const formatArea = (area: number | undefined) => {
    if (area === undefined || Number.isNaN(area)) return '0.00';
    return `${area.toLocaleString('zh-CN', { maximumFractionDigits: 2 })}`
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
      const customerNameSafe = calculator.customerName.trim() || '未指定客户'
      const fileName = `内部报价单_${customerNameSafe.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}_${calculator.netType}_${currentDate}.pdf`
      
      // 设置字体支持 - 解决中文显示问题
      doc.setFont('helvetica', 'normal')
      
      // === 内部警示横幅 ===
      doc.setFillColor(220, 53, 69) // 红色背景
      doc.rect(5, 5, 200, 15, 'F') // 加大警示条尺寸
      doc.setFontSize(11)
      doc.setTextColor(255, 255, 255) // 白色文字
      doc.text('⚠ INTERNAL USE ONLY - PROFIT INFORMATION - DO NOT SHARE ⚠', 105, 14, { align: 'center' })
      
      // === 页面标题 ===
      doc.setFont('helvetica', 'bold') // 使用粗体
      doc.setFontSize(22)
      doc.setTextColor(25, 118, 210) // 蓝色标题
      doc.text('HAIL NET MATERIAL QUOTATION', 20, 35)
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(16)
      doc.setTextColor(220, 53, 69) // 红色强调
      doc.text('[INTERNAL VERSION]', 150, 35)
      
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
      doc.text(`Net Type: ${calculator.getNetTypeDescription(calculator.netType)}`, 20, 78)
      doc.text(`Installation: ${calculator.getInstallationDescription(calculator.installationType)}`, 20, 84)
      
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
      const projectData = [
        ['Farm Area', `${calculator.farmAreaHa} hectares`],
        ['Coverage Area', `${formatArea(calculator.totalArea)} m²`],
        ['Net Type', calculator.getNetTypeDescription(calculator.netType)],
        ['Installation', calculator.getInstallationDescription(calculator.installationType)],
        ['Rolls Needed', `${calculator.rollsNeeded} rolls`]
      ]
      
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
          calculator.getNetTypeDescription(calculator.netType),
          `${calculator.rollsNeeded} rolls`,
          formatPrice(calculator.finalPrice) + '/m²',
          formatArea(calculator.totalArea) + ' m²',
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
        ['Ground Anchors', calculator.anchorsCount.toLocaleString(), '¥3.50', formatPrice(calculator.anchorsCount * 3.50)],
        ['Fixing Clips', calculator.clipsCount.toLocaleString(), '¥1.20', formatPrice(calculator.clipsCount * 1.20)],
        ['Tensioners', calculator.tensionersCount.toLocaleString(), '¥8.80', formatPrice(calculator.tensionersCount * 8.80)],
        ['Support Poles', calculator.polesCount.toLocaleString(), '¥45.00', formatPrice(calculator.polesCount * 45.00)]
      ]
      
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
        ['TOTAL AMOUNT', formatPrice(calculator.totalPrice)],
        ['Cost per Hectare', formatPrice(calculator.perHaCost)]
      ]
      
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
          if (data.row.index === 2) { // 总计金额行
            data.cell.styles.fillColor = [25, 118, 210]
            data.cell.styles.textColor = [255, 255, 255]
            data.cell.styles.fontStyle = 'bold'
            data.cell.styles.fontSize = 12
          }
        }
      })
      
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
      doc.text('Basic Version - Internal Assessment Tool', 20, pageHeight - 5)
      
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
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <CloudSun className="h-12 w-12 text-green-600 mx-auto animate-spin" />
          <p className="text-green-800 font-medium">正在加载计算器...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-blue-50">
      {/* 顶部导航 */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-green-100 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CloudSun className="h-8 w-8 text-green-600" />
              <div>
                <h1 className="text-2xl font-bold text-green-800">防冰雹网计算器</h1>
                <div className="flex gap-2 mt-1">
                  <Badge variant="outline" className="text-green-700 border-green-500">基础版</Badge>
                  <Badge variant="outline" className="text-blue-700 border-blue-500">中文界面</Badge>
                </div>
              </div>
            </div>
            
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700 hover:bg-green-50">
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                返回首页
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* 主要内容 */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* 左侧：参数设置 */}
          <div className="space-y-6">
            <Card className="bg-white/90 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <Leaf className="h-5 w-5" />
                  基本参数设置
                </CardTitle>
                <CardDescription>
                  设置您的农场基本信息和网布类型
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
                    className="focus:ring-green-500"
                  />
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Leaf className="h-3 w-3" />
                    此信息将包含在PDF报价单中，仅供内部使用
                  </p>
                </div>
                
                <Separator />
                
                {/* 农场面积 */}
                <div className="space-y-2">
                  <Label htmlFor="farmArea">农场面积（公顷）</Label>
                  <Input
                    id="farmArea"
                    type="number"
                    value={calculator.farmAreaHa}
                    onChange={(e) => calculator.setFarmAreaHa(Number(e.target.value))}
                    placeholder="请输入农场面积"
                    min="0.1"
                    step="0.1"
                  />
                  <p className="text-sm text-gray-600">
                    当前面积：{formatArea(calculator.totalArea)} 平方米
                  </p>
                </div>
                
                {/* 网布型号 */}
                <div className="space-y-2">
                  <Label>网布型号</Label>
                  <Select value={calculator.netType} onValueChange={(value: 'standard' | 'reinforced' | 'premium') => calculator.setNetType(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择网布型号" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">标准型 - ¥12.5/平方米 (5年质保)</SelectItem>
                      <SelectItem value="reinforced">加强型 - ¥18.8/平方米 (8年质保)</SelectItem>
                      <SelectItem value="premium">顶级型 - ¥25.0/平方米 (10年质保)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* 安装方式 */}
                <div className="space-y-2">
                  <Label>安装方式</Label>
                  <Select value={calculator.installationType} onValueChange={(value: 'manual' | 'mechanical' | 'hybrid') => calculator.setInstallationType(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择安装方式" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">人工安装 (标准成本)</SelectItem>
                      <SelectItem value="mechanical">机械安装 (+15%成本)</SelectItem>
                      <SelectItem value="hybrid">混合安装 (+8%成本)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter className="flex gap-3">
                <Button 
                  onClick={handleReset}
                  variant="outline"
                  className="flex-1"
                >
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  重置
                </Button>
                <Button 
                  onClick={handleExportPDF}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  导出PDF
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* 右侧：计算结果 */}
          <div className="space-y-6">
            {/* 成本概览 */}
            <Card className="bg-white/90 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <BarChart3 className="h-5 w-5" />
                  成本概览
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 rounded-lg bg-green-50">
                    <p className="text-sm text-green-600 mb-1">总计成本</p>
                    <p className="text-2xl font-bold text-green-800">{formatPrice(calculator.totalPrice)}</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-blue-50">
                    <p className="text-sm text-blue-600 mb-1">每公顷成本</p>
                    <p className="text-2xl font-bold text-blue-800">{formatPrice(calculator.perHaCost)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 材料清单 */}
            <Card className="bg-white/90 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-green-800">材料清单</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 网布信息 */}
                <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                  <h4 className="font-medium text-green-800 mb-2">网布</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">型号：</span>
                      <span className="font-medium">{calculator.getNetTypeDescription(calculator.netType)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">数量：</span>
                      <span className="font-medium">{calculator.rollsNeeded} 卷</span>
                    </div>
                    <div>
                      <span className="text-gray-600">单价：</span>
                      <span className="font-medium">{formatPrice(calculator.finalPrice)}/平方米</span>
                    </div>
                    <div>
                      <span className="text-gray-600">小计：</span>
                      <span className="font-medium text-green-700">{formatPrice(calculator.netCost)}</span>
                    </div>
                  </div>
                </div>

                {/* 配件信息 */}
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                  <h4 className="font-medium text-blue-800 mb-3">配件</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">地锚 × {calculator.anchorsCount}</span>
                      <span className="font-medium">{formatPrice(calculator.anchorsCount * 3.50)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">固定夹 × {calculator.clipsCount}</span>
                      <span className="font-medium">{formatPrice(calculator.clipsCount * 1.20)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">张力器 × {calculator.tensionersCount}</span>
                      <span className="font-medium">{formatPrice(calculator.tensionersCount * 8.80)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">支撑杆 × {calculator.polesCount}</span>
                      <span className="font-medium">{formatPrice(calculator.polesCount * 45.00)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-medium text-blue-700">
                      <span>配件小计</span>
                      <span>{formatPrice(calculator.accessoriesCost)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
} 