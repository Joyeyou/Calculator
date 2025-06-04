/**
 * @description 安全认证状态管理
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { toast } from 'sonner'
import CryptoJS from 'crypto-js'

interface AuthState {
  // 认证状态
  isAuthenticated: boolean
  
  // 登录尝试追踪
  loginAttempts: number
  lastAttemptTime: number
  lockoutUntil: number
  
  // 安全设置
  maxAttempts: number
  lockoutDuration: number // 毫秒
  
  // 加密后的密码和盐
  hashedPassword: string
  salt: string
  
  // 登录会话信息
  sessionStartTime: number
  sessionDuration: number // 毫秒，默认6小时
  
  // 方法
  login: (password: string) => boolean
  logout: () => void
  resetAttempts: () => void
  isLocked: () => boolean
  getRemainingLockTime: () => number
  validateSession: () => boolean
  initializeAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      loginAttempts: 0,
      lastAttemptTime: 0,
      lockoutUntil: 0,
      
      // 安全设置
      maxAttempts: 5, // 5次失败尝试后锁定
      lockoutDuration: 15 * 60 * 1000, // 15分钟锁定时间
      
      // 加密密码和盐
      hashedPassword: '',
      salt: '',
      
      // 会话信息
      sessionStartTime: 0,
      sessionDuration: 6 * 60 * 60 * 1000, // 6小时会话有效期
      
      /**
       * @description 初始化认证系统
       */
      initializeAuth: () => {
        const { hashedPassword, salt } = get()
        
        // 只在首次使用时初始化密码
        if (!hashedPassword || !salt) {
          // 正式密码：HailNet2025
          const correctPassword = 'HailNet2025'
          const newSalt = CryptoJS.lib.WordArray.random(16).toString()
          const newHashedPassword = CryptoJS.PBKDF2(
            correctPassword,
            newSalt,
            { keySize: 512/32, iterations: 10000 }
          ).toString()
          
          set({ 
            hashedPassword: newHashedPassword,
            salt: newSalt
          })
        }
      },
      
      /**
       * @description 登录认证
       * @param password 用户输入的密码
       * @returns 登录是否成功
       */
      login: (password: string) => {
        const { 
          isLocked, 
          hashedPassword, 
          salt, 
          loginAttempts, 
          maxAttempts
        } = get()
        
        // 检查是否被锁定
        if (isLocked()) {
          const remainingMinutes = Math.ceil(get().getRemainingLockTime() / 60000)
          toast.error('账户暂时被锁定，请在' + remainingMinutes + '分钟后重试')
          return false
        }
        
        // 计算输入密码的哈希值
        const hashedInput = CryptoJS.PBKDF2(
          password,
          salt,
          { keySize: 512/32, iterations: 10000 }
        ).toString()
        
        // 验证密码
        if (hashedInput === hashedPassword) {
          // 登录成功
          set({ 
            isAuthenticated: true,
            loginAttempts: 0,
            sessionStartTime: Date.now()
          })
          return true
        } else {
          // 登录失败，增加失败尝试次数
          const newAttempts = loginAttempts + 1
          
          set({ 
            loginAttempts: newAttempts,
            lastAttemptTime: Date.now()
          })
          
          // 检查是否达到最大尝试次数
          if (newAttempts >= maxAttempts) {
            const lockoutUntil = Date.now() + get().lockoutDuration
            set({ lockoutUntil })
            toast.error('由于多次尝试失败，账户已被锁定15分钟')
          } else {
            const remaining = maxAttempts - newAttempts
            toast.error('密码错误，还剩' + remaining + '次尝试机会')
          }
          
          return false
        }
      },
      
      /**
       * @description 退出登录
       */
      logout: () => {
        set({ 
          isAuthenticated: false,
          sessionStartTime: 0
        })
      },
      
      /**
       * @description 重置登录尝试次数
       */
      resetAttempts: () => {
        set({ 
          loginAttempts: 0,
          lastAttemptTime: 0,
          lockoutUntil: 0
        })
      },
      
      /**
       * @description 检查账户是否被锁定
       * @returns 是否被锁定
       */
      isLocked: () => {
        const { lockoutUntil } = get()
        return lockoutUntil > Date.now()
      },
      
      /**
       * @description 获取剩余锁定时间(毫秒)
       * @returns 剩余锁定时间
       */
      getRemainingLockTime: () => {
        const { lockoutUntil } = get()
        const remaining = lockoutUntil - Date.now()
        return remaining > 0 ? remaining : 0
      },
      
      /**
       * @description 验证当前会话是否有效
       * @returns 会话是否有效
       */
      validateSession: () => {
        const { isAuthenticated, sessionStartTime, sessionDuration } = get()
        
        if (!isAuthenticated) return false
        
        const sessionExpiry = sessionStartTime + sessionDuration
        const isSessionValid = Date.now() < sessionExpiry
        
        // 如果会话过期，自动注销
        if (!isSessionValid) {
          get().logout()
          return false
        }
        
        return true
      }
    }),
    {
      name: 'hailnet-auth-storage',
      partialize: (state) => ({
        // 不保存临时状态，只保存密码哈希和盐
        hashedPassword: state.hashedPassword,
        salt: state.salt,
        isAuthenticated: state.isAuthenticated,
        sessionStartTime: state.sessionStartTime,
        loginAttempts: state.loginAttempts,
        lastAttemptTime: state.lastAttemptTime,
        lockoutUntil: state.lockoutUntil
      })
    }
  )
) 