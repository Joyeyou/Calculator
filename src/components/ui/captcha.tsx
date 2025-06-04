/**
 * @description 简单的验证码组件
 */
import { useState, useEffect } from 'react'
import { Label } from './label'
import { Input } from './input'

interface CaptchaProps {
  onVerify: (verified: boolean) => void
  refreshTrigger?: number // 用于触发刷新的计数器
}

/**
 * 生成随机验证码
 * @param length 验证码长度
 * @returns 随机验证码
 */
const generateCaptchaCode = (length = 4) => {
  // 只使用容易辨认的字符
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * 简单的验证码组件
 */
export function Captcha({ onVerify, refreshTrigger = 0 }: CaptchaProps) {
  const [captchaCode, setCaptchaCode] = useState('')
  const [userInput, setUserInput] = useState('')
  const [bgColor, setBgColor] = useState('#f3f4f6')
  
  // 初始化和刷新验证码
  const refreshCaptcha = () => {
    setCaptchaCode(generateCaptchaCode())
    setUserInput('')
    setBgColor(`#${Math.floor(Math.random()*0xD0D0D0+0x202020).toString(16)}20`) // 随机浅色背景
  }
  
  // 初始化验证码
  useEffect(() => {
    refreshCaptcha()
  }, [refreshTrigger])
  
  // 验证码输入变更
  useEffect(() => {
    if (userInput.length === captchaCode.length) {
      // 自动验证用户输入
      const isCorrect = userInput.toUpperCase() === captchaCode
      onVerify(isCorrect)
      
      if (!isCorrect) {
        // 如果错误，自动刷新验证码
        setTimeout(refreshCaptcha, 1000)
      }
    } else {
      onVerify(false)
    }
  }, [userInput, captchaCode, onVerify])
  
  return (
    <div className="space-y-2">
      <Label htmlFor="captcha">验证码</Label>
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            id="captcha"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value.toUpperCase())}
            placeholder="请输入验证码"
            maxLength={captchaCode.length}
            className="uppercase"
          />
        </div>
        <button 
          type="button"
          className="flex items-center justify-center min-w-20 px-2 rounded-md cursor-pointer select-none font-mono text-lg font-bold tracking-widest"
          style={{ backgroundColor: bgColor }}
          onClick={refreshCaptcha}
          aria-label="刷新验证码"
          title="点击刷新验证码"
        >
          <div className="flex">
            {captchaCode.split('').map((char, index) => (
              <span 
                key={index} 
                style={{ 
                  transform: `rotate(${Math.random() * 20 - 10}deg)`,
                  display: 'inline-block'
                }}
              >
                {char}
              </span>
            ))}
          </div>
        </button>
      </div>
      <p className="text-xs text-gray-500">点击验证码可刷新</p>
    </div>
  )
} 