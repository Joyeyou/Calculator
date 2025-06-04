/**
 * @description 安全中间件，添加安全相关的HTTP响应头
 */
import { NextResponse, type NextRequest } from 'next/server'

// 确保中间件函数正确导出
export default function middleware(request: NextRequest) {
  // 获取响应对象
  const response = NextResponse.next()
  
  // 设置安全相关的HTTP头
  
  // 防止点击劫持
  response.headers.set('X-Frame-Options', 'DENY')
  
  // 启用XSS过滤器
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  // 禁止浏览器猜测响应的MIME类型
  response.headers.set('X-Content-Type-Options', 'nosniff')
  
  // 限制网站的引用来源信息
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // 内容安全策略
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'"
  )
  
  // 严格传输安全
  // 在生产环境启用HSTS
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
  }
  
  // 禁止缓存敏感页面
  if (request.nextUrl.pathname.startsWith('/advanced')) {
    response.headers.set('Cache-Control', 'no-store, max-age=0')
  }
  
  return response
}

// 指定中间件应用于哪些路径
export const config = {
  matcher: [
    /*
     * 匹配所有请求路径，除了：
     * - API routes (/api/*)
     * - 静态文件 (/_next/static/*, /favicon.ico, /robots.txt, /sitemap.xml, /manifest.json)
     */
    '/((?!api|_next/static|favicon.ico|robots.txt|sitemap.xml|manifest.json).*)',
  ],
} 