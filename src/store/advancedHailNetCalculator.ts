/**
 * @description 高级防冰雹网计算器状态管理
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// 定义网布型号基础价格（USD/平方米）
const NET_BASE_PRICES = {
  T60: 0.142,  // T60 - 700kly | 5 years
  T90: 0.237,  // T90+ - 1200kly | 8 years
  L50: 0.160   // L50 - 700kly | 6 years
}

// 定义网布型号说明
const NET_TYPE_DESCRIPTIONS = {
  T60: "700kly | 5 years",
  T90: "1200kly | 8 years",
  L50: "700kly | 6 years"
}

// 价格区间百分比
const PRICE_MARGINS = {
  margin30: 0.30,  // 30%加价
  margin40: 0.40,  // 40%加价
  margin50: 0.50   // 50%加价
}

// 大订单折扣比例
const BULK_DISCOUNTS = {
  ha50: 0.02,  // 50公顷折扣2%
  ha100: 0.05  // 100公顷折扣5%
}

// 每卷网布的标准覆盖面积（平方米）
const NET_ROLL_COVERAGE = {
  T60: 500, // T60每卷覆盖500平方米
  T90: 450, // T90+每卷覆盖450平方米
  L50: 480  // L50每卷覆盖480平方米
}

// Roof结构系数 - 由于屋顶结构安装，需要的网布是平铺的1.155倍
const ROOF_STRUCTURE_FACTOR = 1.155

// 配件单价（USD/个）
const ACCESSORY_PRICES = {
  // 经济型配件
  netClips: 0.10,     // 网夹
  bungeeHooks: 0.10,  // 弹力钩
  bungeeCord: 0.38,   // 弹力绳
  
  // 豪华型配件
  wireClips: 0.10,     // 钢丝夹 - 更新单价
  netConnectors: 0.35  // 网连接器 - 更新单价
}

// 模糊模式下的预设农场面积选项（公顷）
const FARM_AREA_OPTIONS = [5, 10, 20, 50, 100]

// 10公顷标准参考值（基准）
const REFERENCE_HA = 10 // 10公顷作为基准
const REFERENCE_WIDTH = 300 // 宽度300米
const REFERENCE_LENGTH = 334 // 长度334米
const REFERENCE_ROW_SPACING = 4 // 行间距4米
const REFERENCE_ROW_COUNT = 75 // 75行 (300 / 4 = 75)

// 辅助转换函数：公顷到平方米
const haToSquareMeters = (ha: number) => ha * 10000

// 接口定义
interface AdvancedHailNetCalculatorState {
  // 计算模式
  calculationMode: 'fuzzy' | 'precise' // 模糊或精确模式
  
  // 模糊模式参数
  farmAreaHa: number // 农场面积（公顷）
  
  // 精确模式参数
  rowCount: number // 行数
  rowLength: number // 行长度（米）
  rowSpacing: number // 行间距（米）
  
  // 共同参数
  netType: 'T60' | 'T90' | 'L50' // 网布型号
  priceMargin: 'margin30' | 'margin40' | 'margin50' // 价格区间
  accessoryType: 'economy' | 'luxury' // 配件类型：经济型/豪华型
  
  // 计算结果
  netWidth: number // 网幅宽（精确模式）
  netLength: number // 网长度（精确模式）
  totalArea: number // 总面积（平方米）
  actualNetArea: number // 实际网布面积(考虑roof结构系数)
  rollsNeeded: number // 需要的卷数
  basePrice: number // 基础单价（USD/平方米）
  pricePerUnit: number // 最终单价（USD/平方米）
  bulkDiscount: number // 大订单折扣
  discountAmount: number // 折扣金额
  totalPrice: number // 总价（USD）
  perHaCost: number // 每公顷成本（仅模糊模式）
  perHaNetCost: number // 每公顷网成本（仅模糊模式）
  perHaAccessoryCost: number // 每公顷配件成本（仅模糊模式）
  
  // 配件数量
  netClipsCount: number
  bungeeHooksCount: number
  bungeeCordCount: number
  wireClipsCount: number
  netConnectorsCount: number
  
  // 配件成本
  accessoriesCost: number
  netCost: number
  
  // 方法
  setCalculationMode: (mode: 'fuzzy' | 'precise') => void
  setFarmAreaHa: (area: number) => void
  setRowCount: (count: number) => void
  setRowLength: (length: number) => void
  setRowSpacing: (spacing: number) => void
  setNetType: (type: 'T60' | 'T90' | 'L50') => void
  setPriceMargin: (margin: 'margin30' | 'margin40' | 'margin50') => void
  setAccessoryType: (type: 'economy' | 'luxury') => void
  reset: () => void
  calculate: () => void
  
  // 辅助方法
  getFarmAreaOptions: () => number[]
  getNetTypeDescription: (type: 'T60' | 'T90' | 'L50') => string
  getBulkDiscountRate: (haArea: number) => number
  getRoofStructureFactor: () => number
}

export const useAdvancedHailNetCalculatorStore = create<AdvancedHailNetCalculatorState>()(
  persist(
    (set, get) => ({
      // 初始值
      calculationMode: 'fuzzy',
      farmAreaHa: 5, // 默认5公顷
      rowCount: 10,
      rowLength: 100,
      rowSpacing: 3,
      netType: 'T60',
      priceMargin: 'margin30',
      accessoryType: 'economy',
      
      // 结果默认值
      netWidth: 0,
      netLength: 0,
      totalArea: 0,
      actualNetArea: 0,
      rollsNeeded: 0,
      basePrice: 0,
      pricePerUnit: 0,
      bulkDiscount: 0,
      discountAmount: 0,
      totalPrice: 0,
      perHaCost: 0,
      perHaNetCost: 0,
      perHaAccessoryCost: 0,
      
      // 配件数量默认值
      netClipsCount: 0,
      bungeeHooksCount: 0,
      bungeeCordCount: 0,
      wireClipsCount: 0,
      netConnectorsCount: 0,
      
      // 成本默认值
      accessoriesCost: 0,
      netCost: 0,
      
      // 设置方法
      setCalculationMode: (mode) => {
        set({ calculationMode: mode })
        get().calculate()
      },
      
      setFarmAreaHa: (area) => {
        // 确保选择的是预设的选项
        const closestOption = FARM_AREA_OPTIONS.reduce((prev, curr) => {
          return (Math.abs(curr - area) < Math.abs(prev - area) ? curr : prev)
        })
        
        set({ farmAreaHa: closestOption })
        get().calculate()
      },
      
      setRowCount: (count) => {
        set({ rowCount: count })
        get().calculate()
      },
      
      setRowLength: (length) => {
        set({ rowLength: length })
        get().calculate()
      },
      
      setRowSpacing: (spacing) => {
        set({ rowSpacing: spacing })
        get().calculate()
      },
      
      setNetType: (type) => {
        set({ netType: type })
        get().calculate()
      },
      
      setPriceMargin: (margin) => {
        set({ priceMargin: margin })
        get().calculate()
      },
      
      setAccessoryType: (type) => {
        set({ accessoryType: type })
        get().calculate()
      },
      
      reset: () => {
        set({
          calculationMode: 'fuzzy',
          farmAreaHa: 5,
          rowCount: 10,
          rowLength: 100,
          rowSpacing: 3,
          netType: 'T60',
          priceMargin: 'margin30',
          accessoryType: 'economy'
        })
        get().calculate()
      },
      
      // 获取预设农场面积选项
      getFarmAreaOptions: () => {
        return FARM_AREA_OPTIONS
      },
      
      // 获取网布型号描述
      getNetTypeDescription: (type) => {
        return NET_TYPE_DESCRIPTIONS[type]
      },
      
      // 获取大订单折扣率
      getBulkDiscountRate: (haArea) => {
        if (haArea >= 100) return BULK_DISCOUNTS.ha100
        if (haArea >= 50) return BULK_DISCOUNTS.ha50
        return 0
      },
      
      // 获取Roof结构系数
      getRoofStructureFactor: () => {
        return ROOF_STRUCTURE_FACTOR
      },
      
      calculate: () => {
        const { 
          calculationMode, 
          farmAreaHa, 
          rowCount, 
          rowLength, 
          rowSpacing,
          netType,
          priceMargin,
          accessoryType
        } = get()
        
        // 获取基础单价
        const basePrice = NET_BASE_PRICES[netType]
        
        // 计算最终单价（基础价格 * (1 + 加价百分比)）
        const pricePerUnit = basePrice * (1 + PRICE_MARGINS[priceMargin])
        
        // 获取大订单折扣率
        const bulkDiscount = get().getBulkDiscountRate(farmAreaHa)
        
        // 根据不同模式计算
        if (calculationMode === 'fuzzy') {
          // 模糊模式计算
          const areaInSquareMeters = haToSquareMeters(farmAreaHa)
          
          // 考虑roof结构系数，实际需要的网布面积更大
          const actualNetArea = areaInSquareMeters * ROOF_STRUCTURE_FACTOR
          
          // 计算所需卷数，基于实际网布面积
          const rollsNeeded = Math.ceil(actualNetArea / NET_ROLL_COVERAGE[netType])
          
          // 计算网成本，基于实际网布面积
          const netCost = actualNetArea * pricePerUnit
          
          // 配件数量计算 - 基于10公顷标准，按比例计算
          
          // 10公顷标准配件数量 (基于10公顷地块，宽300m，长334m，行距4m = 75行)
          // 每米2个网夹，每米2个弹力钩，每米1个弹力绳
          const referenceNetClips = REFERENCE_LENGTH * 2 * REFERENCE_ROW_COUNT // 334 * 2 * 75 = 50100
          const referenceBungeeHooks = REFERENCE_LENGTH * 2 * REFERENCE_ROW_COUNT // 334 * 2 * 75 = 50100
          const referenceBungeeCord = REFERENCE_LENGTH * 1 * REFERENCE_ROW_COUNT // 334 * 1 * 75 = 25050
          
          // 根据面积比例计算配件数量
          const areaRatio = farmAreaHa / REFERENCE_HA // 当前面积与10公顷的比例
          
          // 计算各配件数量
          const netClipsCount = Math.ceil(referenceNetClips * areaRatio)
          const bungeeHooksCount = Math.ceil(referenceBungeeHooks * areaRatio)
          const bungeeCordCount = Math.ceil(referenceBungeeCord * areaRatio)
          
          let wireClipsCount = 0
          let netConnectorsCount = 0
          let accessoriesCost = 0
          
          if (accessoryType === 'economy') {
            accessoriesCost = 
              netClipsCount * ACCESSORY_PRICES.netClips +
              bungeeHooksCount * ACCESSORY_PRICES.bungeeHooks +
              bungeeCordCount * ACCESSORY_PRICES.bungeeCord
          } else {
            // 豪华型额外配件 - 每行相同数量
            wireClipsCount = Math.ceil(REFERENCE_LENGTH * 1 * REFERENCE_ROW_COUNT * areaRatio) // 每米1个
            netConnectorsCount = Math.ceil(REFERENCE_LENGTH * 1 * REFERENCE_ROW_COUNT * areaRatio) // 每米1个
            
            accessoriesCost = 
              netClipsCount * ACCESSORY_PRICES.netClips +
              bungeeHooksCount * ACCESSORY_PRICES.bungeeHooks +
              bungeeCordCount * ACCESSORY_PRICES.bungeeCord +
              wireClipsCount * ACCESSORY_PRICES.wireClips +
              netConnectorsCount * ACCESSORY_PRICES.netConnectors
          }
          
          // 计算总成本(包含大订单折扣)
          const subtotal = netCost + accessoriesCost
          const discountAmount = subtotal * bulkDiscount
          const totalPrice = subtotal - discountAmount
          
          // 计算每公顷成本
          const perHaNetCost = netCost / farmAreaHa
          const perHaAccessoryCost = accessoriesCost / farmAreaHa
          const perHaCost = totalPrice / farmAreaHa
          
          set({
            totalArea: areaInSquareMeters,
            actualNetArea,
            rollsNeeded,
            basePrice,
            pricePerUnit,
            netCost,
            accessoriesCost,
            bulkDiscount,
            discountAmount,
            totalPrice,
            perHaCost,
            perHaNetCost,
            perHaAccessoryCost,
            netClipsCount,
            bungeeHooksCount,
            bungeeCordCount,
            wireClipsCount,
            netConnectorsCount,
            netWidth: 0, // 模糊模式下不计算网幅宽
            netLength: 0 // 模糊模式下不计算网长度
          })
        } else {
          // 精确模式计算
          // 网幅宽 = 2 * 行间距 / √3，向上取整到0.2的倍数
          const rawNetWidth = 2 * rowSpacing / Math.sqrt(3)
          // 例如：4.14 取整到 4.2，4.21 取整到 4.4
          const netWidth = Math.ceil(rawNetWidth * 5) / 5 // 向上取整到0.2的倍数
          
          // 网长度 = 行长度 + 15米，向上取整为5的倍数
          const rawNetLength = rowLength + 15
          const netLength = Math.ceil(rawNetLength / 5) * 5 // 向上取整到5的倍数
          
          // 总面积 = 宽(取整) × 长(取整到5的倍数) × 行数，不使用1.155倍系数
          const totalArea = netWidth * netLength * rowCount
          
          // 精确模式不使用屋顶结构系数，实际网布面积就是计算面积
          const actualNetArea = totalArea // 不使用ROOF_STRUCTURE_FACTOR
          
          // 计算每卷的面积
          const rollArea = netWidth * netLength // 单卷面积
          
          // 所需卷数，基于行数直接计算
          const rollsNeeded = rowCount // 一行一卷，更直观
          
          // 网成本，基于实际网布面积
          const netCost = actualNetArea * pricePerUnit
          
          // 精确模式下的配件计算 - 根据行数和行长度直接计算
          // 每米2个网夹，每米2个弹力钩，每米1个弹力绳
          const netClipsCount = Math.ceil(rowLength * 2 * rowCount) // 每米2个网夹
          const bungeeHooksCount = Math.ceil(rowLength * 2 * rowCount) // 每米2个弹力钩
          const bungeeCordCount = Math.ceil(rowLength * 1 * rowCount) // 每米1个弹力绳
          
          let wireClipsCount = 0
          let netConnectorsCount = 0
          let accessoriesCost = 0
          
          if (accessoryType === 'economy') {
            accessoriesCost = 
              netClipsCount * ACCESSORY_PRICES.netClips +
              bungeeHooksCount * ACCESSORY_PRICES.bungeeHooks +
              bungeeCordCount * ACCESSORY_PRICES.bungeeCord
          } else {
            // 豪华型额外配件
            wireClipsCount = Math.ceil(rowLength * 1 * rowCount) // 每米1个
            netConnectorsCount = Math.ceil(rowLength * 1 * rowCount) // 每米1个
            
            accessoriesCost = 
              netClipsCount * ACCESSORY_PRICES.netClips +
              bungeeHooksCount * ACCESSORY_PRICES.bungeeHooks +
              bungeeCordCount * ACCESSORY_PRICES.bungeeCord +
              wireClipsCount * ACCESSORY_PRICES.wireClips +
              netConnectorsCount * ACCESSORY_PRICES.netConnectors
          }
          
          // 计算总成本(包含大订单折扣)
          // 转换总面积为公顷用于判断折扣
          const areaInHa = totalArea / 10000
          const bulkDiscount = get().getBulkDiscountRate(areaInHa)
          const subtotal = netCost + accessoriesCost
          const discountAmount = subtotal * bulkDiscount
          const totalPrice = subtotal - discountAmount
          
          set({
            netWidth,
            netLength,
            totalArea,
            actualNetArea,
            rollsNeeded,
            basePrice,
            pricePerUnit,
            bulkDiscount,
            discountAmount,
            netCost,
            accessoriesCost,
            totalPrice,
            netClipsCount,
            bungeeHooksCount,
            bungeeCordCount,
            wireClipsCount,
            netConnectorsCount,
            perHaCost: 0, // 精确模式下不计算每公顷成本
            perHaNetCost: 0,
            perHaAccessoryCost: 0
          })
        }
      }
    }),
    {
      name: 'advanced-hail-net-calculator-storage',
    }
  )
) 