/**
 * @description 基础防冰雹网计算器状态管理 (中文版)
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// 定义网布型号基础价格（CNY/平方米）
const NET_BASE_PRICES = {
  standard: 12.5,    // 标准型 - 5年质保
  reinforced: 18.8,  // 加强型 - 8年质保
  premium: 25.0      // 顶级型 - 10年质保
}

// 定义网布型号说明
const NET_TYPE_DESCRIPTIONS = {
  standard: "标准型 - 5年质保",
  reinforced: "加强型 - 8年质保", 
  premium: "顶级型 - 10年质保"
}

// 安装方式系数
const INSTALLATION_FACTORS = {
  manual: 1.0,      // 人工安装
  mechanical: 1.15, // 机械安装 (+15%)
  hybrid: 1.08      // 混合安装 (+8%)
}

// 配件单价（CNY/个）
const ACCESSORY_PRICES = {
  anchors: 3.50,      // 地锚
  clips: 1.20,        // 固定夹
  tensioners: 8.80,   // 张力器
  poles: 45.00        // 支撑杆
}

// 每卷网布的标准覆盖面积（平方米）
const NET_ROLL_COVERAGE = {
  standard: 500,
  reinforced: 450,
  premium: 400
}

// 配件密度系数（每平方米需要的配件数量）
const ACCESSORY_DENSITY = {
  anchors: 0.15,      // 每平方米0.15个地锚
  clips: 0.8,         // 每平方米0.8个固定夹
  tensioners: 0.05,   // 每平方米0.05个张力器
  poles: 0.03         // 每平方米0.03个支撑杆
}

// 辅助转换函数：公顷到平方米
const haToSquareMeters = (ha: number) => ha * 10000

// 接口定义
interface BasicHailNetCalculatorState {
  // 客户信息
  customerName: string // 客户名称
  
  // 基本参数
  farmAreaHa: number // 农场面积（公顷）
  netType: 'standard' | 'reinforced' | 'premium' // 网布型号
  installationType: 'manual' | 'mechanical' | 'hybrid' // 安装方式
  
  // 计算结果
  totalArea: number // 总面积（平方米）
  rollsNeeded: number // 需要的卷数
  basePrice: number // 基础单价（CNY/平方米）
  finalPrice: number // 最终单价（CNY/平方米）
  totalPrice: number // 总价（CNY）
  perHaCost: number // 每公顷成本
  
  // 配件数量
  anchorsCount: number
  clipsCount: number
  tensionersCount: number
  polesCount: number
  
  // 配件成本
  accessoriesCost: number
  netCost: number
  
  // 方法
  setCustomerName: (name: string) => void
  setFarmAreaHa: (area: number) => void
  setNetType: (type: 'standard' | 'reinforced' | 'premium') => void
  setInstallationType: (type: 'manual' | 'mechanical' | 'hybrid') => void
  reset: () => void
  calculate: () => void
  
  // 辅助方法
  getNetTypeDescription: (type: 'standard' | 'reinforced' | 'premium') => string
  getInstallationDescription: (type: 'manual' | 'mechanical' | 'hybrid') => string
}

export const useBasicHailNetCalculatorStore = create<BasicHailNetCalculatorState>()(
  persist(
    (set, get) => ({
      // 初始值
      customerName: '', // 客户名称
      farmAreaHa: 5, // 默认5公顷
      netType: 'standard',
      installationType: 'manual',
      
      // 结果默认值
      totalArea: 0,
      rollsNeeded: 0,
      basePrice: 0,
      finalPrice: 0,
      totalPrice: 0,
      perHaCost: 0,
      
      // 配件数量默认值
      anchorsCount: 0,
      clipsCount: 0,
      tensionersCount: 0,
      polesCount: 0,
      
      // 成本默认值
      accessoriesCost: 0,
      netCost: 0,
      
      // 设置方法
      setCustomerName: (name) => {
        set({ customerName: name })
      },
      
      setFarmAreaHa: (area) => {
        set({ farmAreaHa: area })
        get().calculate()
      },
      
      setNetType: (type) => {
        set({ netType: type })
        get().calculate()
      },
      
      setInstallationType: (type) => {
        set({ installationType: type })
        get().calculate()
      },
      
      reset: () => {
        set({
          farmAreaHa: 5,
          netType: 'standard',
          installationType: 'manual'
        })
        get().calculate()
      },
      
      // 获取网布型号描述
      getNetTypeDescription: (type) => {
        return NET_TYPE_DESCRIPTIONS[type]
      },
      
      // 获取安装方式描述
      getInstallationDescription: (type) => {
        switch (type) {
          case 'manual': return '人工安装 (标准成本)'
          case 'mechanical': return '机械安装 (+15%成本)'
          case 'hybrid': return '混合安装 (+8%成本)'
          default: return '人工安装'
        }
      },
      
      calculate: () => {
        const { farmAreaHa, netType, installationType } = get()
        
        // 计算总面积
        const totalArea = haToSquareMeters(farmAreaHa)
        
        // 获取基础价格和安装系数
        const basePrice = NET_BASE_PRICES[netType]
        const installationFactor = INSTALLATION_FACTORS[installationType]
        const finalPrice = basePrice * installationFactor
        
        // 计算所需卷数
        const rollsNeeded = Math.ceil(totalArea / NET_ROLL_COVERAGE[netType])
        
        // 计算网布成本
        const netCost = totalArea * finalPrice
        
        // 计算配件数量
        const anchorsCount = Math.ceil(totalArea * ACCESSORY_DENSITY.anchors)
        const clipsCount = Math.ceil(totalArea * ACCESSORY_DENSITY.clips)
        const tensionersCount = Math.ceil(totalArea * ACCESSORY_DENSITY.tensioners)
        const polesCount = Math.ceil(totalArea * ACCESSORY_DENSITY.poles)
        
        // 计算配件成本
        const accessoriesCost = 
          anchorsCount * ACCESSORY_PRICES.anchors +
          clipsCount * ACCESSORY_PRICES.clips +
          tensionersCount * ACCESSORY_PRICES.tensioners +
          polesCount * ACCESSORY_PRICES.poles
        
        // 计算总成本
        const totalPrice = netCost + accessoriesCost
        const perHaCost = totalPrice / farmAreaHa
        
        set({
          totalArea,
          rollsNeeded,
          basePrice,
          finalPrice,
          netCost,
          accessoriesCost,
          totalPrice,
          perHaCost,
          anchorsCount,
          clipsCount,
          tensionersCount,
          polesCount
        })
      }
    }),
    {
      name: 'basic-hail-net-calculator-storage',
    }
  )
) 