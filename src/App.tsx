import { Accessibility, Eye, MessageSquareText, Siren } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import A11yModeToggle from './components/A11yModeToggle';
import { useA11y } from './context/A11yContext';
import type { PageId } from './types';
import SpotDetail from './pages/SpotDetail';
import AIVisionGuide from './pages/AIVisionGuide';
import HearingAssistant from './pages/HearingAssistant';
import EmergencySOS from './pages/EmergencySOS';

/**
 * App 主入口
 * - 顶部工具条：品牌 + 无障碍模式切换（大字号 / 高对比度）
 * - 跳过导航链接（Screen Reader 友好）
 * - 底部导航：4 个页面（导航项 44px+ 触控区，当前页 aria-current）
 */

interface NavItem {
  id: PageId;
  label: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'spot', label: '景点详情', icon: Accessibility },
  { id: 'vision', label: 'AI 导览', icon: Eye },
  { id: 'hearing', label: '沟通助手', icon: MessageSquareText },
  { id: 'sos', label: '紧急求助', icon: Siren },
];

export default function App() {
  const { currentPage, navigate } = useA11y();

  const renderPage = () => {
    switch (currentPage) {
      case 'spot':
        return <SpotDetail />;
      case 'vision':
        return <AIVisionGuide />;
      case 'hearing':
        return <HearingAssistant />;
      case 'sos':
        return <EmergencySOS />;
      default:
        return <SpotDetail />;
    }
  };

  return (
    <div className="min-h-screen pb-24">
      {/* 跳过导航：键盘用户第一焦点 */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-gradient-to-b focus:from-brand-500 focus:to-brand-600 focus:px-4 focus:py-2 focus:text-white"
      >
        跳到主要内容
      </a>

      {/* 顶部工具栏：蓝白大厂风 */}
      <header className="sticky top-0 z-40 border-b border-brand-100 bg-gradient-to-r from-white via-brand-50/60 to-brand-100/50 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
          <p className="flex items-center gap-2.5 text-base font-bold text-brand-700">
            <span
              aria-hidden="true"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md shadow-brand-500/20"
            >
              <Accessibility className="h-5 w-5" />
            </span>
            听见·步量澳门
          </p>
          <A11yModeToggle />
        </div>
      </header>

      {/* 主内容 */}
      <main id="main" className="mx-auto max-w-4xl px-4 py-6 sm:py-8">
        {renderPage()}
      </main>

      {/* 底部导航：44px+ 触控区，当前项 aria-current="page" */}
      <nav
        aria-label="主导航"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur"
      >
        <ul className="mx-auto flex max-w-4xl items-stretch justify-around px-2 py-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = currentPage === item.id;
            return (
              <li key={item.id} className="flex-1">
                <button
                  type="button"
                  onClick={() => navigate(item.id)}
                  aria-current={active ? 'page' : undefined}
                  aria-label={item.label}
                  className={`focus-ring flex min-h-[56px] w-full flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-xs font-semibold transition-colors ${
                    active
                      ? 'text-brand-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon aria-hidden="true" className="h-6 w-6" strokeWidth={active ? 2.5 : 2} />
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
