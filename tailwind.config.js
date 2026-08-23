/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // 阿里系品牌蓝（Ant Design 色板），button 主色取 blue-7 保证白字对比度 ≥ 4.5:1
        brand: {
          50: '#e6f4ff',
          100: '#bae0ff',
          200: '#91caff',
          300: '#69b1ff',
          400: '#4096ff',
          500: '#1677ff',
          600: '#0958d9',
          700: '#003eb3',
          800: '#002c8c',
          900: '#001d66',
        },
        // 警示色（antd red-6/7，满足 4.5:1 对比度）
        alert: {
          500: '#f5222d',
          600: '#cf1322',
          700: '#a8071a',
        },
      },
      fontSize: {
        // 大字号无障碍模式
        'a11y-xl': '1.5rem',
        'a11y-2xl': '1.875rem',
        'a11y-3xl': '2.25rem',
      },
      spacing: {
        // 无障碍最小触控区
        hit: '44px',
        'hit-lg': '52px',
        'hit-xl': '64px',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0, 0, 0, 0.08), 0 6px 16px rgba(0, 0, 0, 0.06)',
        'card-lg': '0 4px 12px rgba(0, 0, 0, 0.10), 0 12px 32px rgba(0, 0, 0, 0.08)',
      },
    },
  },
  plugins: [],
};
