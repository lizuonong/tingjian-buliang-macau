import { Building2, DoorOpen, Info, MapPin, Sparkles, Users, Wind } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { fetchSpots } from '../api/spots';
import FacilityCard from '../components/FacilityCard';
import PageHeader from '../components/PageHeader';
import { recommendReason, recommendSpots } from '../data/spots';
import type { Facility, Spot } from '../types';

/**
 * 04 景点详情页 (Spot Detail)
 * - 切换景点：通过顶部下拉框切换当前景点
 * - 展示当前景点的无障碍设施（入口 / 升降梯 / 卫生间 / 通道等）与状态标签
 * - 景点推荐：综合「无障碍水平评分」+「距离」加权排序，可一键切换
 * 数据来源：优先后端（实时同步澳门旅游局官网），不可达时降级到本地数据
 */

const FACILITY_ICONS: Record<string, LucideIcon> = {
  door: DoorOpen,
  elevator: Wind,
  restroom: Users,
  parking: Building2,
  path: MapPin,
};

export default function SpotDetail() {
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentId, setCurrentId] = useState<string>('');

  /** 从后端拉取景点数据（失败降级本地） */
  useEffect(() => {
    let mounted = true;
    fetchSpots().then((data) => {
      if (!mounted) return;
      setSpots(data);
      setCurrentId((prev) => prev || data[0]?.id || '');
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const current = spots.find((s) => s.id === currentId) ?? spots[0];
  const recommendations = current ? recommendSpots(current.id, spots) : [];

  /** 切换景点 */
  const switchSpot = (id: string) => {
    setCurrentId(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading || !current) {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <PageHeader
          icon={<MapPin className="h-6 w-6" />}
          title="景点详情"
          subtitle="正在同步澳门旅游局无障碍数据…"
        />
        <div className="card-surface p-8 text-center text-gray-500" role="status">
          加载中…
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader
        icon={<MapPin className="h-6 w-6" />}
        title={current.name}
        subtitle={`无障碍评分 ${current.accessibilityScore.toFixed(1)} / 5 · ${current.address} · 距此 ${current.distanceKm.toFixed(1)} km`}
      />

      {/* 切换景点 */}
      <div>
        <label htmlFor="spot-select" className="mb-2 block text-sm font-medium text-gray-700">
          切换景点
        </label>
        <select
          id="spot-select"
          value={current.id}
          onChange={(e) => switchSpot(e.target.value)}
          className="focus-ring min-h-[52px] w-full rounded-xl border-2 border-gray-300 bg-white px-4 text-base text-gray-900 transition-colors hover:border-brand-400"
        >
          {spots.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}（无障碍 {s.accessibilityScore.toFixed(1)} · {s.distanceKm.toFixed(1)} km）
            </option>
          ))}
        </select>
      </div>

      {/* 景点简介 */}
      <p className="leading-relaxed text-gray-700">{current.description}</p>

      {/* 无障碍设施 */}
      <section aria-labelledby="facility-heading">
        <h2
          id="facility-heading"
          className="mb-3 flex items-center gap-2 text-lg font-bold text-gray-900"
        >
          <Info aria-hidden="true" className="h-5 w-5 text-brand-600" />
          无障碍设施
        </h2>
        <ul className="space-y-3">
          {current.facilities.map((f: Facility) => (
            <FacilityCard key={f.id} facility={f} icon={FACILITY_ICONS[f.icon]} />
          ))}
        </ul>
      </section>

      {/* 景点推荐（按无障碍数据 + 距离加权排序） */}
      <section aria-labelledby="recommend-heading">
        <h2
          id="recommend-heading"
          className="mb-3 flex items-center gap-2 text-lg font-bold text-gray-900"
        >
          <Sparkles aria-hidden="true" className="h-5 w-5 text-brand-600" />
          推荐景点
        </h2>
        <p className="mb-3 text-sm text-gray-600">
          综合「无障碍水平」与「距离」为你推荐，点击即可切换。
        </p>
        <ul className="space-y-3">
          {recommendations.map((s: Spot) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => switchSpot(s.id)}
                className="focus-ring flex min-h-[72px] w-full items-center gap-4 rounded-2xl border-2 border-gray-200 bg-white p-4 text-left transition-colors hover:border-brand-400 hover:bg-brand-50"
              >
                <span
                  aria-hidden="true"
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700"
                >
                  <MapPin className="h-6 w-6" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-semibold text-gray-900">{s.name}</span>
                  <span className="mt-0.5 block text-sm text-gray-600">{recommendReason(s)}</span>
                </span>
                <span className="shrink-0 rounded-full bg-brand-50 px-3 py-1 text-sm font-bold text-brand-700">
                  {s.accessibilityScore.toFixed(1)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}