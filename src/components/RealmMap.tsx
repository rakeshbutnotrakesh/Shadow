import React from 'react';
import { Compass, MapPin, X } from 'lucide-react';
import { KalyugGameEngine } from '../game/main';
import { AreaId, MapMarker, MapSnapshot } from '../game/types';

interface MinimapProps {
  map: MapSnapshot;
  areaName: string;
  onExpand: () => void;
}

interface FullMapModalProps {
  map: MapSnapshot;
  areaId: AreaId;
  areaName: string;
  discoveredAreas: AreaId[];
  engine: KalyugGameEngine;
  onClose: () => void;
}

const AREA_LABELS: Record<AreaId, string> = {
  forest: 'Forgotten Forest',
  temple: 'Ancient Temple',
  catacombs: 'Underground Catacombs',
  sanctum: 'Cursed Sanctum',
  final_chamber: 'Final Chamber',
};

function getMarkerColor(m: MapMarker): string {
  if (m.kind === 'portal') return m.locked ? '#7a7267' : '#fbbf24';
  if (m.kind === 'artifact') return '#38bdf8';
  if (m.kind === 'trial_shrine') return '#c084fc';
  if (m.kind === 'chest') return '#34d399';
  if (m.kind === 'monolith' || m.kind === 'mandala_altar' || m.kind === 'bell') return '#f59e0b';
  return '#cfc6b6';
}

function projectPoint(x: number, z: number, boundsRadius: number, size: number) {
  const half = size / 2;
  const r = Math.max(12, boundsRadius);
  const scale = (half - 10) / r;
  return {
    px: half + x * scale,
    py: half + z * scale,
  };
}

export const HudMinimap: React.FC<MinimapProps> = ({ map, areaName, onExpand }) => {
  const size = 112;
  const half = size / 2;
  const p = projectPoint(map.playerX, map.playerZ, map.boundsRadius, size);
  const fx = Math.sin(map.playerYaw);
  const fy = Math.cos(map.playerYaw);
  const tipX = p.px + fx * 7;
  const tipY = p.py + fy * 7;
  const leftX = p.px - fx * 3.5 - fy * 4;
  const leftY = p.py - fy * 3.5 + fx * 4;
  const rightX = p.px - fx * 3.5 + fy * 4;
  const rightY = p.py - fy * 3.5 - fx * 4;

  return (
    <button
      type="button"
      onClick={onExpand}
      title="Open Realm Map (M)"
      className="pointer-events-auto group relative flex flex-col items-center border border-[#d4a34a]/45 bg-[#0b090f]/88 p-1.5 transition-colors hover:border-[#fbbf24]"
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="h-20 w-20 sm:h-24 sm:w-24 [@media(max-height:500px)]:h-16 [@media(max-height:500px)]:w-16"
      >
        <circle
          cx={half}
          cy={half}
          r={half - 4}
          fill="#120e1a"
          stroke="rgba(212,163,74,0.35)"
          strokeWidth="1.2"
        />
        <circle
          cx={half}
          cy={half}
          r={(half - 4) * 0.55}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeDasharray="2 3"
        />
        <line x1={half} y1={6} x2={half} y2={size - 6} stroke="rgba(255,255,255,0.06)" />
        <line x1={6} y1={half} x2={size - 6} y2={half} stroke="rgba(255,255,255,0.06)" />

        {/* Interactive Markers */}
        {map.markers.map((m) => {
          const pt = projectPoint(m.x, m.z, map.boundsRadius, size);
          const color = getMarkerColor(m);
          if (m.kind === 'portal') {
            return (
              <polygon
                key={m.id}
                points={`${pt.px},${pt.py - 4} ${pt.px + 4},${pt.py} ${pt.px},${pt.py + 4} ${pt.px - 4},${pt.py}`}
                fill={color}
              />
            );
          }
          return <circle key={m.id} cx={pt.px} cy={pt.py} r={2.6} fill={color} />;
        })}

        {/* Enemies */}
        {map.enemies.map((e, idx) => {
          const pt = projectPoint(e.x, e.z, map.boundsRadius, size);
          return (
            <circle
              key={idx}
              cx={pt.px}
              cy={pt.py}
              r={e.isBoss ? 4.4 : 2.3}
              fill={e.isBoss ? '#f43f5e' : '#ef4444'}
              stroke={e.isBoss ? '#fbbf24' : 'none'}
              strokeWidth={e.isBoss ? 1.2 : 0}
            />
          );
        })}

        {/* Player Direction Arrow */}
        <polygon
          points={`${tipX},${tipY} ${leftX},${leftY} ${rightX},${rightY}`}
          fill="#f8fafc"
          stroke="#fbbf24"
          strokeWidth="0.9"
        />
      </svg>
      <div className="mt-0.5 flex w-full items-center justify-between px-0.5 text-[9px] font-medium text-[#cfc6b6] group-hover:text-[#fbbf24]">
        <span className="truncate max-w-[54px]">{areaName.split(' ')[0]}</span>
        <span className="font-mono-num text-[#d4a34a]">[M]</span>
      </div>
    </button>
  );
};

export const FullRealmMapModal: React.FC<FullMapModalProps> = ({
  map,
  areaId,
  areaName,
  discoveredAreas,
  engine,
  onClose,
}) => {
  const size = 320;
  const half = size / 2;
  const p = projectPoint(map.playerX, map.playerZ, map.boundsRadius, size);
  const fx = Math.sin(map.playerYaw);
  const fy = Math.cos(map.playerYaw);
  const tipX = p.px + fx * 11;
  const tipY = p.py + fy * 11;
  const leftX = p.px - fx * 5 - fy * 6;
  const leftY = p.py - fy * 5 + fx * 6;
  const rightX = p.px - fx * 5 + fy * 6;
  const rightY = p.py - fy * 5 - fx * 6;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/82 p-3 sm:p-4">
      <div className="max-h-[94vh] w-full max-w-3xl overflow-y-auto border border-[#d4a34a]/45 bg-[#0d0b12] p-4 sm:p-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-[#d4a34a]" />
            <div>
              <h2 className="font-display text-lg font-semibold text-[#f5efe4] sm:text-xl">
                Realm Map · {areaName}
              </h2>
              <p className="text-[11px] text-[#a89f92]">
                Live radar of portals, relics, shrines & threats
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Map"
            className="flex h-9 w-9 items-center justify-center border border-white/15 text-[#ede7dc]/80 hover:border-[#d4a34a] hover:text-[#d4a34a]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-[auto_1fr] md:items-start">
          {/* Radar Map Canvas */}
          <div className="flex flex-col items-center">
            <svg
              width={size}
              height={size}
              viewBox={`0 0 ${size} ${size}`}
              className="h-56 w-56 border border-[#d4a34a]/35 bg-[#120e1a] sm:h-72 sm:w-72"
            >
              <circle
                cx={half}
                cy={half}
                r={half - 10}
                fill="none"
                stroke="rgba(212,163,74,0.35)"
                strokeWidth="1.5"
              />
              <circle
                cx={half}
                cy={half}
                r={(half - 10) * 0.55}
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeDasharray="4 4"
              />
              <line x1={half} y1={10} x2={half} y2={size - 10} stroke="rgba(255,255,255,0.07)" />
              <line x1={10} y1={half} x2={size - 10} y2={half} stroke="rgba(255,255,255,0.07)" />

              <text x={half} y={22} textAnchor="middle" fill="#9c9387" fontSize="10">N</text>
              <text x={half} y={size - 14} textAnchor="middle" fill="#9c9387" fontSize="10">S</text>
              <text x={18} y={half + 3} textAnchor="middle" fill="#9c9387" fontSize="10">W</text>
              <text x={size - 18} y={half + 3} textAnchor="middle" fill="#9c9387" fontSize="10">E</text>

              {map.markers.map((m) => {
                const pt = projectPoint(m.x, m.z, map.boundsRadius, size);
                const color = getMarkerColor(m);
                return (
                  <g key={m.id}>
                    {m.kind === 'portal' ? (
                      <polygon
                        points={`${pt.px},${pt.py - 6} ${pt.px + 6},${pt.py} ${pt.px},${pt.py + 6} ${pt.px - 6},${pt.py}`}
                        fill={color}
                        stroke="#0b090f"
                        strokeWidth="1"
                      />
                    ) : (
                      <circle cx={pt.px} cy={pt.py} r={4.5} fill={color} stroke="#0b090f" strokeWidth="1" />
                    )}
                  </g>
                );
              })}

              {map.enemies.map((e, idx) => {
                const pt = projectPoint(e.x, e.z, map.boundsRadius, size);
                return (
                  <circle
                    key={idx}
                    cx={pt.px}
                    cy={pt.py}
                    r={e.isBoss ? 7 : 3.8}
                    fill={e.isBoss ? '#f43f5e' : '#ef4444'}
                    stroke={e.isBoss ? '#fbbf24' : '#0b090f'}
                    strokeWidth={e.isBoss ? 1.8 : 0.8}
                  />
                );
              })}

              <polygon
                points={`${tipX},${tipY} ${leftX},${leftY} ${rightX},${rightY}`}
                fill="#ffffff"
                stroke="#fbbf24"
                strokeWidth="1.4"
              />
            </svg>
          </div>

          {/* Legend, Nearby Landmarks & Fast Travel */}
          <div className="space-y-4 text-xs">
            <div className="border border-white/10 bg-[#14101c] p-3">
              <div className="mb-2 font-semibold text-[#d4a34a]">Map Legend</div>
              <div className="grid grid-cols-2 gap-1.5 text-[#cfc6b6]">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 bg-white border border-[#fbbf24]" /> You (Facing)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#ef4444]" /> Shadow Enemies ({map.enemies.length})
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rotate-45 bg-[#fbbf24]" /> Portal Gate
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#38bdf8]" /> Mythic Artifact
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#f59e0b]" /> Altar / Bell / Monolith
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#34d399]" /> Relic Chest
                </span>
              </div>
            </div>

            <div className="border border-white/10 bg-[#14101c] p-3">
              <div className="mb-2 flex items-center gap-1.5 font-semibold text-[#d4a34a]">
                <MapPin className="h-3.5 w-3.5" />
                Active Landmarks in {areaName}
              </div>
              <div className="max-h-32 space-y-1 overflow-y-auto pr-1">
                {map.markers.length === 0 ? (
                  <p className="text-[#9c9387]">All landmarks cleared in this realm.</p>
                ) : (
                  map.markers.map((m) => (
                    <div key={m.id} className="flex items-center justify-between text-[#ddd5c8]">
                      <span className="flex items-center gap-2 truncate">
                        <span
                          className="inline-block h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: getMarkerColor(m) }}
                        />
                        <span className="truncate">{m.label}</span>
                      </span>
                      <span className="shrink-0 font-mono-num text-[11px] text-[#9c9387]">
                        {m.locked ? 'Sealed' : `${Math.round(Math.hypot(m.x - map.playerX, m.z - map.playerZ))}m`}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="border border-white/10 bg-[#14101c] p-3">
              <div className="mb-2 font-semibold text-[#d4a34a]">Realm Fast Travel</div>
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(AREA_LABELS) as AreaId[]).map((aid) => {
                  const discovered = discoveredAreas.includes(aid);
                  const current = aid === areaId;
                  return (
                    <button
                      key={aid}
                      type="button"
                      disabled={!discovered || current}
                      onClick={() => {
                        engine.travelToDiscoveredArea(aid);
                        onClose();
                      }}
                      className={`border px-2.5 py-1.5 text-[11px] font-medium ${
                        current
                          ? 'border-[#d4a34a] bg-[#d4a34a]/20 text-[#fbbf24]'
                          : discovered
                          ? 'border-white/15 bg-[#1a1524] text-[#ede7dc] hover:border-[#d4a34a]'
                          : 'border-white/10 bg-[#0f0c14] text-[#7a7267] opacity-55'
                      }`}
                    >
                      {AREA_LABELS[aid]}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
