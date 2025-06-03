import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 确保目标目录存在
const iconsDir = path.join(__dirname, '../public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// 常见的favicon尺寸
const sizes = [16, 32, 48, 64, 72, 96, 128, 144, 152, 192, 256, 384, 512];

/**
 * 生成不同尺寸的PNG图标
 * @param {string} inputSvg - 输入的SVG文件路径
 * @param {string} outputPrefix - 输出文件名前缀
 */
async function generatePNGs(inputSvg, outputPrefix) {
  try {
    // 读取SVG文件
    const svgBuffer = fs.readFileSync(inputSvg);
    
    // 为每个尺寸创建PNG
    for (const size of sizes) {
      const outputPath = path.join(iconsDir, `${outputPrefix}-${size}x${size}.png`);
      
      // 根据尺寸选择使用哪个源SVG（小尺寸使用简化版）
      const sourceBuffer = size < 64 ? 
        fs.readFileSync(path.join(__dirname, '../public/icons/favicon-simple.svg')) : 
        svgBuffer;
      
      await sharp(sourceBuffer)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      
      console.log(`Generated: ${outputPath}`);
    }
    
    // 生成主favicon.ico文件（包含16和32尺寸）
    // 注意：这里我们简化处理，实际生成.ico需要特定的库
    const faviconBuffer = fs.readFileSync(path.join(iconsDir, `${outputPrefix}-32x32.png`));
    fs.writeFileSync(path.join(__dirname, '../public/favicon.ico'), faviconBuffer);
    console.log('Generated: favicon.ico');
    
    console.log('All favicons generated successfully!');
  } catch (error) {
    console.error('Error generating favicons:', error);
  }
}

// 生成图标
generatePNGs(
  path.join(__dirname, '../public/icons/favicon.svg'),
  'favicon'
); 