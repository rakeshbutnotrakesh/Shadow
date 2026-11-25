import { useEffect, useRef, useState } from 'react';
import {
  Backpack,
  CircleHelp,
  Compass,
  Map as MapIcon,
  Maximize2,
  Pause,
  RotateCw,
  Shield,
  Sparkles,
  Sun,
  Swords,
} from 'lucide-react';
import { GameModals } from './components/GameModals';
import { MobileControls } from './components/MobileControls';
import { FullRealmMapModal, HudMinimap } from './components/RealmMap';
import { PLAYER_CLASSES } from './game/classes';
import { KalyugGameEngine } from './game/main';
import { DEFAULT_SETTINGS, hasSavedGame, loadSettings } from './game/save';
import { GameSettings, HudSnapshot } from './game/types';

const INITIAL_HUD: HudSnapshot = {
  screen: 'class_select',
  areaId: 'forest',
  areaName: 'Forgotten Forest',
  areaSubtitle: 'Chapter I · Grove of Whispering Banyans',
  playerClass: 'warrior',
  activeWeaponName: 'Khanda Astra Sword',
  health: 100,
  maxHealth: 100,
  energy: 100,
  maxEnergy: 100,
  level: 1,
  xp: 0,
  xpToNext: 76,
  difficultyTier: 'Easy',
  isGod: false,
  petId: null,
  blessings: [],
  blessingChoices: [],
  flashlightOn: true,
  shieldActive: false,
  shieldCooldown: 0,
  energyAttackCooldown: 0,
  heavyCooldown: 0,
  spinCooldown: 0,
  dashCooldown: 0,
  comboStep: 0,
  abilities: {},
  artifacts: [],
  consumables: { pranaElixir: 2, somaVial: 2 },
  activeQuest: null,
  allQuests: [],
  interactPrompt: null,
  levelUpChoices: [],
  boss: null,
  toast: null,
  loreModal: null,
  detectedEnemyCount: 0,
  pointerLocked: false,
  hasSave: hasSavedGame(),
  enemiesDefeated: 0,
  mandalaRings: [2, 1, 3],
  discoveredAreas: ['forest'],
  activeVedaMantra: null,
  forgeShards: 2,
  forgedWeaponBonus: 0,
  forgedWeaponsCount: 0,
  collectedWeaponIds: [],
  equippedChestWeaponId: null,
  chestWeaponBonus: 0,
  classSpecialCooldown: 0,
  yaggaActive: false,
  map: {
    boundsRadius: 48,
    playerX: 0,
    playerZ: 0,
    playerYaw: 0,
    enemies: [],
    markers: [],
  },
};

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<KalyugGameEngine | null>(null);
  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const [settings, setSettings] = useState<GameSettings>(() => loadSettings() ?? DEFAULT_SETTINGS);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);
  const [landscapeDismissed, setLandscapeDismissed] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const openHelp = () => {
    engineRef.current?.input.releasePointerLock();
    engineRef.current?.input.clearKeys();
    setShowHelp(true);
  };

  const openMap = () => {
    engineRef.current?.input.releasePointerLock();
    engineRef.current?.input.clearKeys();
    setShowMap(true);
  };

  const enterLandscapeMode = async () => {
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // Fullscreen may be restricted in some embedded previews
    }
    try {
      const orientation = screen.orientation as ScreenOrientation & {
        lock?: (orientation: 'landscape' | 'landscape-primary') => Promise<void>;
      };
      await orientation?.lock?.('landscape');
    } catch {
      // Browsers like iOS Safari rely on physical device rotation
    }
  };

  useEffect(() => {
    const checkTouchAndOrientation = () => {
      setIsTouchDevice(
        'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth <= 920
      );
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    checkTouchAndOrientation();
    window.addEventListener('resize', checkTouchAndOrientation);
    window.addEventListener('orientationchange', checkTouchAndOrientation);

    const handleHelpKeys = (e: KeyboardEvent) => {
      if (e.key === '?' || e.key === 'F1') {
        e.preventDefault();
        setShowHelp((prev) => {
          const next = !prev;
          if (next) {
            engineRef.current?.input.releasePointerLock();
            engineRef.current?.input.clearKeys();
          }
          return next;
        });
      } else if (e.key === 'Escape') {
        setShowHelp(false);
        setShowMap(false);
      }
    };
    window.addEventListener('keydown', handleHelpKeys);

    if (!canvasMountRef.current) {
      return () => {
        window.removeEventListener('resize', checkTouchAndOrientation);
        window.removeEventListener('orientationchange', checkTouchAndOrientation);
        window.removeEventListener('keydown', handleHelpKeys);
      };
    }

    const engine = new KalyugGameEngine(
      canvasMountRef.current,
      (snapshot) => {
        setHud(snapshot);
      },
      () => {
        setShowMap((prev) => !prev);
      }
    );
    engineRef.current = engine;

    return () => {
      window.removeEventListener('resize', checkTouchAndOrientation);
      window.removeEventListener('orientationchange', checkTouchAndOrientation);
      window.removeEventListener('keydown', handleHelpKeys);
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  // Attempt automatic landscape lock when entering gameplay on mobile
  useEffect(() => {
    if (hud.screen === 'playing' && isTouchDevice) {
      const orientation = screen.orientation as ScreenOrientation & {
        lock?: (orientation: 'landscape') => Promise<void>;
      };
      orientation?.lock?.('landscape')?.catch(() => {
        // Ignore if browser requires fullscreen gesture first
      });
    }
  }, [hud.screen, isTouchDevice]);

  const handleUpdateSettings = (partial: Partial<GameSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      engineRef.current?.updateSettings(partial);
      return next;
    });
  };

  const showTouchControls =
    hud.screen === 'playing' &&
    (settings.showMobileControls === 'on' ||
      (settings.showMobileControls === 'auto' && isTouchDevice));

  const hasSacredAttack =
    (hud.abilities.sacred_energy_attack ?? 0) > 0 ||
    hud.artifacts.includes('trishul_fragment') ||
    hud.level >= 2 ||
    hud.isGod;
  const hasDivineShield =
    (hud.abilities.divine_shield ?? 0) > 0 ||
    hud.artifacts.includes('divine_amulet') ||
    hud.level >= 3 ||
    hud.isGod;

  const hpPct = Math.max(0, Math.min(100, (hud.health / Math.max(1, hud.maxHealth)) * 100));
  const enPct = Math.max(0, Math.min(100, (hud.energy / Math.max(1, hud.maxEnergy)) * 100));
  const xpPct = Math.max(0, Math.min(100, (hud.xp / Math.max(1, hud.xpToNext)) * 100));

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#08070b]">
      {/* Isolated WebGL Viewport Container */}
      <div ref={canvasMountRef} className="absolute inset-0 h-full w-full" />

      {/* Playing HUD (Unobstructed Center Viewport, Compact on Landscape Phones) */}
      {hud.screen === 'playing' && engineRef.current && (
        <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between p-2 sm:p-3.5 [@media(max-height:500px)]:p-2">
          {/* Top Row */}
          <div className="flex items-start justify-between gap-2 sm:gap-3">
            {/* Top-Left: Vitals & Skills */}
            <div className="w-44 border border-[#d4a34a]/25 bg-[#0b090f]/85 p-2 sm:w-64 sm:p-3 [@media(max-height:500px)]:w-52 [@media(max-height:500px)]:p-2">
              <div className="mb-1 flex items-center justify-between text-[11px] sm:text-xs">
                <span className="truncate font-display font-semibold text-[#f5efe4]">
                  {PLAYER_CLASSES[hud.playerClass].name} · Lv {hud.level}/100
                </span>
                <span className="font-mono-num text-[#d4a34a]">
                  {hud.difficultyTier}
                </span>
              </div>
              <div className="mb-2 flex items-center justify-between gap-2 text-[11px] text-[#9c9387]">
                <span className="truncate text-[#cfc6b6]" title={hud.activeWeaponName}>
                  {hud.activeWeaponName}
                </span>
                <span className="shrink-0 font-mono-num text-[#cfc6b6]">
                  {hud.level >= 100 ? 'MAX' : `${hud.xp}/${hud.xpToNext} XP`}
                </span>
              </div>

              {/* Health */}
              <div className="mb-1.5">
                <div className="mb-0.5 flex justify-between text-[11px] text-[#cfc6b6]">
                  <span>Health</span>
                  <span className="font-mono-num">
                    {hud.health}/{hud.maxHealth}
                  </span>
                </div>
                <div className="h-2 w-full bg-white/10">
                  <div
                    className="h-full bg-[#b83a2d] transition-all duration-150"
                    style={{ width: `${hpPct}%` }}
                  />
                </div>
              </div>

              {/* Energy */}
              <div className="mb-1.5">
                <div className="mb-0.5 flex justify-between text-[11px] text-[#cfc6b6]">
                  <span>Energy</span>
                  <span className="font-mono-num">
                    {hud.energy}/{hud.maxEnergy}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-white/10">
                  <div
                    className="h-full bg-[#38bdf8] transition-all duration-150"
                    style={{ width: `${enPct}%` }}
                  />
                </div>
              </div>

              {/* XP Bar */}
              <div className="h-1 w-full bg-white/10">
                <div
                  className="h-full bg-[#d4a34a] transition-all duration-200"
                  style={{ width: `${hud.level >= 100 ? 100 : xpPct}%` }}
                />
              </div>

              {/* Quick Skills & Consumables Row */}
              <div className="pointer-events-auto mt-2 flex flex-wrap items-center gap-1 text-[10px] sm:gap-1.5 sm:text-[11px]">
                <button
                  type="button"
                  onClick={() => engineRef.current?.useConsumable('prana')}
                  title="Use Prana Elixir (Key 1)"
                  className="border border-white/15 bg-white/5 px-1.5 py-0.5 text-[#cfc6b6] hover:border-emerald-400 sm:px-2 sm:py-1"
                >
                  <span className="font-mono-num text-emerald-400">[1]</span> {hud.consumables.pranaElixir}
                </button>
                <button
                  type="button"
                  onClick={() => engineRef.current?.useConsumable('soma')}
                  title="Use Soma Vial (Key 2)"
                  className="border border-white/15 bg-white/5 px-1.5 py-0.5 text-[#cfc6b6] hover:border-sky-400 sm:px-2 sm:py-1"
                >
                  <span className="font-mono-num text-sky-400">[2]</span> {hud.consumables.somaVial}
                </button>
                <button
                  type="button"
                  onClick={() => engineRef.current?.input.triggerFlashlight()}
                  title="Toggle Flashlight (F)"
                  className={`flex items-center gap-1 border px-1.5 py-0.5 sm:px-2 sm:py-1 ${
                    hud.flashlightOn
                      ? 'border-[#d4a34a]/60 bg-[#d4a34a]/15 text-[#fbbf24]'
                      : 'border-white/15 bg-white/5 text-[#8a8175]'
                  }`}
                >
                  <Sun className="h-3 w-3" />
                  <span>F</span>
                </button>
                {hasSacredAttack && (
                  <button
                    type="button"
                    onClick={() => engineRef.current?.input.triggerSacredAttack()}
                    title="Sacred Energy Wave (Q)"
                    className="flex items-center gap-1 border border-amber-400/50 bg-amber-500/15 px-1.5 py-0.5 text-amber-300 sm:px-2 sm:py-1"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span className="font-mono-num">
                      {hud.energyAttackCooldown > 0 ? `${hud.energyAttackCooldown}s` : 'Q'}
                    </span>
                  </button>
                )}
                {hasDivineShield && (
                  <button
                    type="button"
                    onClick={() => engineRef.current?.input.triggerShield()}
                    title="Divine Shield (C)"
                    className={`flex items-center gap-1 border px-1.5 py-0.5 sm:px-2 sm:py-1 ${
                      hud.shieldActive
                        ? 'border-sky-300 bg-sky-500/25 text-white'
                        : 'border-sky-400/50 bg-sky-500/15 text-sky-300'
                    }`}
                  >
                    <Shield className="h-3 w-3" />
                    <span className="font-mono-num">
                      {hud.shieldCooldown > 0 ? `${hud.shieldCooldown}s` : 'C'}
                    </span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => engineRef.current?.invokeShadowTrialWave()}
                  title="Summon Scaled Shadow Trial Wave (T)"
                  className="border border-[#b83a2d]/60 bg-[#b83a2d]/20 px-1.5 py-0.5 text-[#fca5a5] hover:border-[#ef4444] sm:px-2 sm:py-1"
                >
                  [T] Trial
                </button>
              </div>

              {/* Attack Format Bar (Desktop & Quick Click) */}
              {!showTouchControls && (
                <div className="pointer-events-auto mt-1.5 flex flex-wrap items-center gap-1 text-[10px]">
                  <button
                    type="button"
                    onClick={() => engineRef.current?.input.triggerHeavyAttack()}
                    title="Heavy Overhead Slam / Piercing Surya Arrow (R or Shift+Click)"
                    className="border border-orange-400/55 bg-orange-950/45 px-1.5 py-0.5 font-medium text-orange-200 hover:border-orange-300"
                  >
                    [R] {hud.playerClass === 'archer' ? 'Pierce' : 'Heavy'}
                    {hud.heavyCooldown > 0 ? ` ${hud.heavyCooldown}s` : ''}
                  </button>
                  <button
                    type="button"
                    onClick={() => engineRef.current?.input.triggerSpinAttack()}
                    title="360° Chakra Spin / 3-Arrow Fan Burst (X)"
                    className="border border-amber-400/55 bg-amber-950/45 px-1.5 py-0.5 font-medium text-amber-200 hover:border-amber-300"
                  >
                    [X] {hud.playerClass === 'archer' ? 'Fan 3x' : 'Spin'}
                    {hud.spinCooldown > 0 ? ` ${hud.spinCooldown}s` : ''}
                  </button>
                  <button
                    type="button"
                    onClick={() => engineRef.current?.input.triggerDashAttack()}
                    title="Vayu Dash Lunge / Evade Shot (Z)"
                    className="border border-sky-400/55 bg-sky-950/45 px-1.5 py-0.5 font-medium text-sky-200 hover:border-sky-300"
                  >
                    [Z] {hud.playerClass === 'archer' ? 'Evade' : 'Dash'}
                    {hud.dashCooldown > 0 ? ` ${hud.dashCooldown}s` : ''}
                  </button>
                </div>
              )}

              {/* Class Path Quick Actions */}
              <div className="pointer-events-auto mt-1.5 flex flex-wrap items-center gap-1 text-[10px] sm:gap-1.5 sm:text-[11px]">
                {hud.playerClass === 'blacksmith' && (
                  <>
                    <span className="border border-orange-400/40 bg-orange-950/50 px-2 py-1 font-mono-num text-orange-300">
                      Shards: {hud.forgeShards}
                    </span>
                    <button
                      type="button"
                      onClick={() => engineRef.current?.performClassAction()}
                      title="Craft Weapon or Anvil Temper Strike (G)"
                      className="border border-amber-400/60 bg-amber-500/15 px-2 py-1 font-semibold text-amber-300 hover:border-amber-300"
                    >
                      [G] Forge{hud.classSpecialCooldown > 0 ? ` (${hud.classSpecialCooldown}s)` : ''}
                    </button>
                    <button
                      type="button"
                      onClick={() => engineRef.current?.setScreen('inventory')}
                      title="Open Blacksmith Weapon Forge (I)"
                      className="border border-orange-400/45 bg-white/5 px-2 py-1 text-orange-200 hover:border-orange-300"
                    >
                      [I] Recipes
                    </button>
                  </>
                )}

                {hud.playerClass === 'saint' && (
                  <>
                    <button
                      type="button"
                      onClick={() => engineRef.current?.performClassAction()}
                      title="Summon Sacred Fire Yagga Kund (G)"
                      className={`border px-2 py-1 font-semibold ${
                        hud.yaggaActive
                          ? 'border-orange-400 bg-orange-500/25 text-orange-200'
                          : 'border-amber-400/55 bg-amber-500/15 text-amber-300'
                      }`}
                    >
                      [G] Yagga{hud.yaggaActive ? ' · Active' : ''}
                    </button>
                    <button
                      type="button"
                      onClick={() => engineRef.current?.performSaintMantra()}
                      title="Chant Random Veda Mantra & Purifying Wave (H)"
                      className="border border-yellow-400/55 bg-yellow-500/15 px-2 py-1 font-semibold text-yellow-200 hover:border-yellow-300"
                    >
                      [H] Mantra
                    </button>
                    <button
                      type="button"
                      onClick={() => engineRef.current?.performSaintPuja()}
                      title="Perform Sacred Puja: Heal & Divine Shield (V)"
                      className="border border-sky-400/55 bg-sky-500/15 px-2 py-1 font-semibold text-sky-200 hover:border-sky-300"
                    >
                      [V] Puja{hud.classSpecialCooldown > 0 ? ` (${hud.classSpecialCooldown}s)` : ''}
                    </button>
                  </>
                )}

                {hud.playerClass === 'warrior' && (
                  <button
                    type="button"
                    onClick={() => engineRef.current?.performClassAction()}
                    title="360° Kshatriya War Cleave (G)"
                    className="border border-amber-400/55 bg-amber-500/15 px-2 py-1 font-semibold text-amber-300 hover:border-amber-300"
                  >
                    [G] Cleave{hud.classSpecialCooldown > 0 ? ` (${hud.classSpecialCooldown}s)` : ''}
                  </button>
                )}

                {hud.playerClass === 'archer' && (
                  <button
                    type="button"
                    onClick={() => engineRef.current?.performClassAction()}
                    title="Kodanda 5-Arrow Volley (G)"
                    className="border border-amber-400/55 bg-amber-500/15 px-2 py-1 font-semibold text-amber-300 hover:border-amber-300"
                  >
                    [G] Volley{hud.classSpecialCooldown > 0 ? ` (${hud.classSpecialCooldown}s)` : ''}
                  </button>
                )}

                {hud.playerClass === 'supporter' && (
                  <button
                    type="button"
                    onClick={() => engineRef.current?.performClassAction()}
                    title="Prana Sanctuary Pulse: Heal & Shield (G)"
                    className="border border-emerald-400/55 bg-emerald-500/15 px-2 py-1 font-semibold text-emerald-300 hover:border-emerald-300"
                  >
                    [G] Prana{hud.classSpecialCooldown > 0 ? ` (${hud.classSpecialCooldown}s)` : ''}
                  </button>
                )}
              </div>
            </div>

            {/* Top-Center: Boss Bar & Toast */}
            <div className="flex max-w-md flex-1 flex-col items-center gap-2">
              {hud.boss && hud.boss.active && (
                <div className="w-full border border-[#b83a2d]/60 bg-[#0d080c]/90 px-4 py-2.5">
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-display font-semibold text-[#f5efe4]">
                      {hud.boss.name} · {hud.boss.title}
                    </span>
                    <span className="font-mono-num text-[#ef4444]">
                      Phase {hud.boss.phase} · {hud.boss.health}/{hud.boss.maxHealth}
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-white/10">
                    <div
                      className="h-full bg-gradient-to-r from-[#991b1b] to-[#ef4444] transition-all duration-150"
                      style={{
                        width: `${Math.max(0, (hud.boss.health / hud.boss.maxHealth) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {hud.toast && (
                <div
                  className={`border px-3 py-1.5 text-center sm:px-4 sm:py-2 ${
                    hud.toast.tone === 'gold'
                      ? 'border-[#d4a34a]/60 bg-[#120e18]/92 text-[#fbbf24]'
                      : hud.toast.tone === 'crimson'
                      ? 'border-[#ef4444]/60 bg-[#180a0d]/92 text-[#fca5a5]'
                      : 'border-sky-400/50 bg-[#0b131d]/92 text-sky-300'
                  }`}
                >
                  <div className="font-display text-xs font-semibold sm:text-sm">{hud.toast.title}</div>
                  {hud.toast.subtitle && (
                    <div className="text-[11px] text-[#cfc6b6] sm:text-xs">{hud.toast.subtitle}</div>
                  )}
                </div>
              )}

              {hud.activeVedaMantra && (
                <div className="hidden border border-[#d4a34a]/45 bg-[#110c19]/90 px-3.5 py-2 text-center sm:block">
                  <div className="text-[10px] font-semibold tracking-wider text-[#d4a34a] uppercase">
                    {hud.activeVedaMantra.veda} · {hud.activeVedaMantra.title}
                  </div>
                  <div className="mt-0.5 text-xs font-semibold text-[#fbbf24]">
                    {hud.activeVedaMantra.sanskrit}
                  </div>
                  <div className="text-[11px] italic text-[#dcd3c5]">
                    {hud.activeVedaMantra.translit}
                  </div>
                </div>
              )}
            </div>

            {/* Top-Right: Radar Map, Quest & Utility Buttons */}
            <div className="flex flex-col items-end gap-1.5">
              <div className="pointer-events-auto flex flex-wrap items-center justify-end gap-1 sm:gap-1.5">
                {isTouchDevice && (
                  <button
                    type="button"
                    onClick={enterLandscapeMode}
                    title="Fullscreen Landscape Mode"
                    className="flex items-center gap-1 whitespace-nowrap border border-[#d4a34a]/40 bg-[#15111d]/90 px-2 py-1.5 text-[11px] font-medium text-[#fbbf24]"
                  >
                    <Maximize2 className="h-3.5 w-3.5 text-[#d4a34a]" />
                    <span className="hidden md:inline">Landscape</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={openMap}
                  title="Realm Map (M)"
                  className="flex items-center gap-1 whitespace-nowrap border border-[#d4a34a]/40 bg-[#15111d]/90 px-2 py-1.5 text-[11px] font-medium text-[#fbbf24] hover:border-[#d4a34a] sm:px-2.5 sm:text-xs"
                >
                  <MapIcon className="h-3.5 w-3.5 text-[#d4a34a]" />
                  <span className="hidden sm:inline">Map [M]</span>
                  <span className="sm:hidden">Map</span>
                </button>
                <button
                  type="button"
                  onClick={openHelp}
                  title="Help & Next Step Guide (?)"
                  className="flex items-center gap-1 whitespace-nowrap border border-[#d4a34a]/45 bg-[#15111d]/90 px-2 py-1.5 text-[11px] font-medium text-[#fbbf24] hover:border-[#d4a34a] sm:px-2.5 sm:text-xs"
                >
                  <CircleHelp className="h-3.5 w-3.5 text-[#d4a34a]" />
                  <span className="hidden md:inline">Help & Next Step</span>
                  <span className="md:hidden">Help</span>
                </button>
                <button
                  type="button"
                  onClick={() => engineRef.current?.setScreen('inventory')}
                  className="flex items-center gap-1 whitespace-nowrap border border-[#d4a34a]/30 bg-[#0b090f]/85 px-2 py-1.5 text-[11px] font-medium text-[#ede7dc] hover:border-[#d4a34a] sm:px-2.5 sm:text-xs"
                >
                  <Backpack className="h-3.5 w-3.5 text-[#d4a34a]" />
                  <span className="hidden sm:inline">Satchel [I]</span>
                  <span className="sm:hidden">Bag</span>
                </button>
                <button
                  type="button"
                  onClick={() => engineRef.current?.setScreen('paused')}
                  className="flex items-center gap-1 whitespace-nowrap border border-[#d4a34a]/30 bg-[#0b090f]/85 px-2 py-1.5 text-[11px] font-medium text-[#ede7dc] hover:border-[#d4a34a] sm:px-2.5 sm:text-xs"
                >
                  <Pause className="h-3.5 w-3.5 text-[#d4a34a]" />
                  <span className="hidden sm:inline">Pause</span>
                </button>
              </div>

              <div className="flex items-start gap-1.5 sm:gap-2">
                <HudMinimap
                  map={hud.map}
                  areaName={hud.areaName}
                  onExpand={openMap}
                />

                <div className="w-36 border border-[#d4a34a]/25 bg-[#0b090f]/85 p-2 text-right sm:w-52 sm:p-2.5 [@media(max-height:500px)]:w-44 [@media(max-height:500px)]:p-2">
                  <div className="flex items-center justify-end gap-1 text-[10px] font-semibold text-[#d4a34a] sm:text-xs">
                    <Compass className="h-3 w-3 shrink-0" />
                    <span className="truncate">{hud.areaName}</span>
                  </div>
                  {hud.activeQuest && (
                    <div className="mt-1.5 border-t border-white/10 pt-1.5 text-left">
                      <div className="truncate text-[11px] font-semibold text-[#f5efe4]">
                        {hud.activeQuest.title}
                      </div>
                      <div className="mt-1 space-y-0.5">
                        {hud.activeQuest.objectives.map((o) => (
                          <div
                            key={o.id}
                            className={`text-[10px] leading-tight sm:text-[11px] ${
                              o.completed ? 'text-emerald-400 line-through' : 'text-[#cfc6b6]'
                            }`}
                          >
                            {o.completed ? '✓' : '○'} {o.label}
                          </div>
                        ))}
                      </div>
                      {hud.activeQuest.completed && (
                        <button
                          type="button"
                          onClick={openHelp}
                          className="pointer-events-auto mt-1.5 block w-full border border-emerald-500/40 bg-emerald-950/35 px-1.5 py-1 text-left text-[10px] font-medium text-emerald-300 hover:border-emerald-400"
                        >
                          Next Step: Portal [E] →
                        </button>
                      )}
                    </div>
                  )}
                  {hud.detectedEnemyCount > 0 && (
                    <div className="mt-1.5 border-t border-white/10 pt-1 text-left text-[10px] text-sky-300">
                      Nearby Threats: {hud.detectedEnemyCount}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Subtle Center Reticle */}
          <div className="pointer-events-none fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="h-1.5 w-1.5 rounded-full bg-[#f5efe4]/55" />
          </div>

          {/* Bottom Center: Interact Prompt & Subtle Controls Strip */}
          <div className="flex flex-col items-center gap-2 pb-1">
            {hud.interactPrompt && (
              <button
                type="button"
                onClick={() => engineRef.current?.input.triggerInteract()}
                className="pointer-events-auto border border-[#d4a34a] bg-[#0b090f]/92 px-5 py-2.5 text-center transition-colors hover:bg-[#1a1523]"
              >
                <div className="text-xs font-semibold text-[#fbbf24]">
                  [E] {hud.interactPrompt.promptText}
                </div>
                {hud.interactPrompt.locked && hud.interactPrompt.lockReason && (
                  <div className="mt-0.5 text-[11px] text-[#fca5a5]">
                    {hud.interactPrompt.lockReason}
                  </div>
                )}
              </button>
            )}

            {!showTouchControls && (
              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-[#0b090f]/75 px-4 py-1.5 text-[11px] text-[#9c9387]">
                <span className="flex items-center gap-1">
                  <Swords className="h-3 w-3 text-[#d4a34a]" /> Click · {hud.playerClass === 'archer' ? 'Bow' : 'Combo'}
                </span>
                <span>R · {hud.playerClass === 'archer' ? 'Pierce' : 'Heavy'}</span>
                <span>X · {hud.playerClass === 'archer' ? '3x Fan' : 'Spin'}</span>
                <span>Z · {hud.playerClass === 'archer' ? 'Evade' : 'Dash'}</span>
                <span>WASD · Move</span>
                <span>E · Interact</span>
                <span>M · Map</span>
                {!hud.pointerLocked && <span>Click Viewport · Lock Camera</span>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Touch Controls */}
      {showTouchControls && engineRef.current && (
        <MobileControls
          engine={engineRef.current}
          hasSacredAttack={hasSacredAttack}
          hasDivineShield={hasDivineShield}
          canInteract={Boolean(hud.interactPrompt)}
          isBowClass={hud.playerClass === 'archer'}
          playerClass={hud.playerClass}
          yaggaActive={hud.yaggaActive}
          heavyCooldown={hud.heavyCooldown}
          spinCooldown={hud.spinCooldown}
          dashCooldown={hud.dashCooldown}
        />
      )}

      {/* Portrait-to-Landscape Mobile Helper */}
      {isTouchDevice && isPortrait && hud.screen === 'playing' && !landscapeDismissed && (
        <div className="fixed inset-x-3 bottom-32 z-30 mx-auto max-w-sm border border-[#d4a34a]/70 bg-[#0d0b12]/95 p-4 text-center shadow-2xl">
          <div className="flex items-center justify-center gap-2 text-sm font-semibold text-[#fbbf24]">
            <RotateCw className="h-4 w-4" />
            Landscape Mode Recommended
          </div>
          <p className="mt-1 text-xs text-[#cfc6b6]">
            Rotate your phone sideways for full 3D view and comfortable thumb combat controls.
          </p>
          <div className="mt-3 flex justify-center gap-2">
            <button
              type="button"
              onClick={enterLandscapeMode}
              className="border border-[#d4a34a] bg-[#d4a34a] px-3 py-1.5 text-xs font-semibold text-[#0b090f]"
            >
              Fullscreen Landscape
            </button>
            <button
              type="button"
              onClick={() => setLandscapeDismissed(true)}
              className="border border-white/20 px-3 py-1.5 text-xs text-[#ddd5c8]"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Expandable Full Realm Map */}
      {showMap && engineRef.current && (
        <FullRealmMapModal
          map={hud.map}
          areaId={hud.areaId}
          areaName={hud.areaName}
          discoveredAreas={hud.discoveredAreas}
          engine={engineRef.current}
          onClose={() => setShowMap(false)}
        />
      )}

      {/* Modals & Menus */}
      {engineRef.current && (
        <GameModals
          hud={hud}
          engine={engineRef.current}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          showHelp={showHelp}
          onOpenHelp={openHelp}
          onCloseHelp={() => setShowHelp(false)}
        />
      )}
    </div>
  );
}
