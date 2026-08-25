import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { PageId } from '../types';

/**
 * 无障碍上下文
 * 管理：
 *  1. 无障碍模式（大字号 / 高对比度）—— 通过 html 根元素 class 驱动全局 CSS 变量
 *  2. 当前页面
 */

interface A11yContextValue {
  /* 无障碍模式 */
  largeText: boolean;
  highContrast: boolean;
  toggleLargeText: () => void;
  toggleHighContrast: () => void;
  /* 页面导航 */
  currentPage: PageId;
  navigate: (page: PageId) => void;
}

const A11yContext = createContext<A11yContextValue | null>(null);

export function A11yProvider({ children }: { children: ReactNode }) {
  const [largeText, setLargeText] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [currentPage, setCurrentPage] = useState<PageId>('spot');

  /** 同步无障碍模式到 <html> 根元素，供全局 CSS 变量生效 */
  useEffect(() => {
    const root = document.documentElement;
    // 大字号模式：html.a11y-large-text
    root.classList.toggle('a11y-large-text', largeText);
    // 高对比度模式：html.a11y-high-contrast
    root.classList.toggle('a11y-high-contrast', highContrast);
    // 通知辅助技术当前语言/模式变更
    root.setAttribute('data-a11y-mode', [largeText ? 'large' : '', highContrast ? 'contrast' : ''].filter(Boolean).join(' ') || 'default');
  }, [largeText, highContrast]);

  const toggleLargeText = useCallback(() => setLargeText((v) => !v), []);
  const toggleHighContrast = useCallback(() => setHighContrast((v) => !v), []);

  const navigate = useCallback((page: PageId) => {
    setCurrentPage(page);
    // 无障碍切换页面时立即播报，帮助屏幕阅读器用户感知
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const value = useMemo<A11yContextValue>(
    () => ({
      largeText,
      highContrast,
      toggleLargeText,
      toggleHighContrast,
      currentPage,
      navigate,
    }),
    [
      largeText,
      highContrast,
      toggleLargeText,
      toggleHighContrast,
      currentPage,
      navigate,
    ],
  );

  return <A11yContext.Provider value={value}>{children}</A11yContext.Provider>;
}

export function useA11y(): A11yContextValue {
  const ctx = useContext(A11yContext);
  if (!ctx) {
    throw new Error('useA11y 必须在 <A11yProvider> 内使用');
  }
  return ctx;
}
