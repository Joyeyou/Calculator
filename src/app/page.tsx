'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CloudSun, Calculator, ArrowRight, ChevronRight, CloudLightning, BarChart3, CloudRain } from 'lucide-react'

/**
 * @description 首页导航
 */
export default function HomePage() {
  const [loaded, setLoaded] = useState(false)
  
  useEffect(() => {
    // 添加简单的加载动画效果
    const timer = setTimeout(() => setLoaded(true), 300)
    return () => clearTimeout(timer)
  }, [])
  
  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-100 to-blue-50 flex flex-col">
      {/* 顶部标题区域 */}
      <div className="container mx-auto py-12 md:py-20 px-4 text-center space-y-4">
        <div className="flex items-center justify-center gap-3 mb-3">
          <CloudSun className="h-10 w-10 text-blue-500" />
          <h1 className="text-4xl md:text-5xl font-bold text-blue-800">防冰雹解决方案</h1>
        </div>
        <p className="text-xl text-gray-700 max-w-3xl mx-auto">
          专业的防冰雹网计算工具，帮助您精确评估农业防护需求与成本
        </p>
        <div className="pt-2">
          <Badge variant="outline" className="text-blue-700 border-blue-500 px-3 py-1 text-sm">
            专为种植户及农业公司设计
          </Badge>
        </div>
      </div>
      
      {/* 主要内容区域 */}
      <div className={`container mx-auto px-4 pb-20 transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* 计算器导航卡片 */}
          <Card className="bg-white/90 backdrop-blur border-blue-100 hover:border-blue-300 transition-all hover:shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Calculator className="h-6 w-6 text-blue-500" />
                <CardTitle className="text-blue-800">防冰雹网计算器</CardTitle>
              </div>
              <CardDescription>
                专业防冰雹网计算工具，支持模糊估算与精确计算
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-700">
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-500" />
                    <span>精确计算所需网布尺寸、数量和成本</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-500" />
                    <span>支持不同网布型号和配件类型</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-500" />
                    <span>适用于专业农场和商业种植基地</span>
                  </li>
                </ul>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-green-700 border-green-400">出口版</Badge>
                  <Badge variant="outline" className="text-purple-700 border-purple-400">内部工具</Badge>
                </div>
                <CloudLightning className="h-6 w-6 text-amber-500" />
              </div>
            </CardContent>
            <CardFooter>
              <Link href="/advanced" className="w-full">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  <span>打开计算器</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
          
          {/* 未来功能预告卡片 */}
          <Card className="bg-white/80 backdrop-blur border-gray-100">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-gray-500" />
                <CardTitle className="text-gray-600">更多工具 (即将推出)</CardTitle>
              </div>
              <CardDescription>
                我们正在开发更多实用工具，敬请期待
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CloudRain className="h-4 w-4 mt-0.5 flex-shrink-0 text-gray-400" />
                    <span>灌溉系统规划计算器</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CloudRain className="h-4 w-4 mt-0.5 flex-shrink-0 text-gray-400" />
                    <span>农作物产量预测工具</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CloudRain className="h-4 w-4 mt-0.5 flex-shrink-0 text-gray-400" />
                    <span>农业投资回报分析器</span>
                  </li>
                </ul>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full text-gray-500" disabled>
                即将推出
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
      
      {/* 页脚 */}
      <footer className="mt-auto py-6 bg-white/40 backdrop-blur-sm">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          <p>© 2025 防冰雹网计算器 | 专业农业解决方案 | 仅供成本估算参考</p>
        </div>
      </footer>
    </main>
  )
} 