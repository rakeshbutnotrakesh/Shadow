import React, { useState } from 'react';
import {
  CircleHelp,
  Compass,
  Crown,
  Flame,
  Hammer,
  RotateCcw,
  Settings,
  Sparkles,
  Volume2,
  X,
} from 'lucide-react';
import { GOD_BLESSINGS } from '../game/blessings';
import { ALL_CLASS_IDS, FORGE_RECIPES, PLAYER_CLASSES } from '../game/classes';
import { ALL_ARTIFACT_IDS, ARTIFACTS } from '../game/inventory';
import { KalyugGameEngine } from '../game/main';
import { ALL_PET_IDS, PETS } from '../game/pet';
import { ABILITIES, ALL_ABILITY_IDS } from '../game/progression';
import { getRealm, REALMS } from '../game/realms';
import { ClassId, GameSettings, HudSnapshot } from '../game/types';
import { CHEST_WEAPONS } from '../game/weapons';

interface GameModalsProps {
  hud: HudSnapshot;
  engine: KalyugGameEngine;
  settings: GameSettings;
  onUpdateSettings: (partial: Partial<GameSettings>) => void;
  showHelp: boolean;
  onOpenHelp: () => void;
  onCloseHelp: () => void;
}

const REALM_BUCKETS = [
  { label: '1–20 (Easy/Med)', min: 1, max: 20 },
  { label: '21–40 (Med)', min: 21, max: 40 },
  { label: '41–60 (Med/Hard)', min: 41, max: 60 },
  { label: '61–80 (Hard)', min: 61, max: 80 },
  { label: '81–100 (Extreme/Final)', min: 81, max: 100 },
];

const TANDAVA_VERSES = [
  {
    sanskrit: 'जटाटवीगलज्जलप्रवाहपावितस्थले गलेऽवलम्ब्य लम्बितां भुजङ्गतुङ्गमालिकाम् ।',
    translit: 'Jatatavi galajjala pravaha pavitasthale gale valambya lambitam bhujanga tunga malikam',
    meaning:
      'From the forest of His matted locks flows the sacred river purifying all realms, as serpents coil like living garlands around His throat.',
  },
  {
    sanskrit: 'डमड्डमड्डमड्डमन्निनादवड्डमर्वयं चकार चण्डताण्डवं तनोतु नः शिवः शिवम् ॥',
    translit: 'Damad damad damad daman ninada vad damarvayam chakara chanda tandavam tanotu nah shivah shivam',
    meaning:
      'To the thunderous cadence of the Damaru — Damad Damad — He performs the cosmic Tandava, awakening fearlessness and auspicious light within us.',
  },
  {
    sanskrit: 'धराधरेन्द्रनन्दिनीविलासबन्धुबन्धुरस्फुरद्दिगन्तसन्ततिप्रमोदमानमानसे ।',
    translit: 'Dharadharendra nandini vilasa bandhu bandhura sphurad diganta santati pramoda mana manase',
    meaning:
      'All ten directions shimmer with boundless grace as the primordial rhythm dissolves shadow and awakens inner strength for the final trial.',
  },
];

export const GameModals: React.FC<GameModalsProps> = ({
  hud,
  engine,
  settings,
  onUpdateSettings,
  showHelp,
  onOpenHelp,
  onCloseHelp,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [invTab, setInvTab] = useState<'artifacts' | 'blessings' | 'abilities' | 'quests'>('artifacts');
  const [pickedClass, setPickedClass] = useState<ClassId>('warrior');
  const [realmBucketIdx, setRealmBucketIdx] = useState(0);

  // HELP & NEXT STEP MODAL
  if (showHelp) {
    const isPreGame = hud.screen === 'class_select' || hud.screen === 'menu';
    const pendingObjectives = hud.activeQuest
      ? hud.activeQuest.objectives.filter((o) => !o.completed)
      : [];

    const currentRealm = getRealm(hud.areaId);
    const nextRealm = currentRealm.nextAreaId ? getRealm(currentRealm.nextAreaId) : null;
    const realmNextGuidance =
      hud.areaId === 'forest'
        ? 'Head north to the glowing Forest Gate portal and press [E] to enter Area 2 (Ancient Temple).'
        : hud.areaId === 'temple'
        ? 'Use the Catacombs Portal in the temple courtyard ([E]) once the Trishul Fragment is claimed.'
        : hud.areaId === 'catacombs'
        ? 'Use the Sunken Stepwell Portal ([E]) once the Ancient Yantra is recovered.'
        : hud.areaId === 'sanctum'
        ? 'Purify all 3 Corrupted Monoliths to unseal the northern Eclipse Gate to Area 100 (Final Chamber).'
        : hud.areaId === 'final_chamber'
        ? 'Claim the Divine Amulet at the threshold and defeat Kali Purusha to win the realm!'
        : `Banish ${currentRealm.requiredKills} Shadows in ${currentRealm.name} and enter the northern portal ([E]) to Area ${nextRealm?.index ?? 100} (${nextRealm?.name ?? 'Next Realm'}).`;

    const classTipMap: Record<ClassId, string> = {
      warrior:
        'Fight up close with Left Click (Khanda) and press [G] for 360° War Cleave. Use [T] Trial waves anytime to level up faster.',
      archer:
        'Keep distance and shoot with Left Click (Kodanda Bow). Press [G] to loose a 5-Arrow Volley into shadow groups.',
      blacksmith: `You hold ${hud.forgeShards} Forge Shard(s). Press [G] to auto-craft your next weapon (or extract +1 Shard via Anvil Strike when empty), or open Satchel [I] to pick a weapon recipe.`,
      saint:
        'Perform sacred rituals: [G] Yagga creates an 8.5s fire zone, [H] Mantra restores +40 Energy & waves foes, [V] Puja heals 35% HP + Divine Shield.',
      supporter:
        'Strike with your Mace and press [G] Prana Pulse whenever low on health for a 40% heal + 4s Kavach Shield.',
    };

    const nextMilestone =
      hud.level < 50
        ? `Level 50: Claim your 3D Sacred Companion Pet & enter Hard Tier (${50 - hud.level} levels away).`
        : hud.level < 90
        ? `Level 90: Experience the Shiva Tandava Stotram & +30% Power (${90 - hud.level} levels away).`
        : hud.level < 100
        ? `Level 100: Receive Maha Maya's Supreme Weapon & Ascend as a God (${100 - hud.level} levels away).`
        : 'Ascended God (Lv 100/100): Enter Area 100 (Final Chamber) and banish Kali Purusha!';

    const activeBucket = REALM_BUCKETS[realmBucketIdx];
    const roadmapRealms = REALMS.filter(
      (r) => r.index >= activeBucket.min && r.index <= activeBucket.max
    );

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/82 p-3 sm:p-4">
        <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto border border-[#d4a34a]/45 bg-[#0d0b12] p-5 sm:p-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Compass className="h-5 w-5 text-[#d4a34a]" />
              <h2 className="font-display text-xl font-semibold text-[#f5efe4]">
                Help & Next Step Guide
              </h2>
            </div>
            <button
              type="button"
              onClick={onCloseHelp}
              aria-label="Close Help"
              className="flex h-9 w-9 items-center justify-center border border-white/15 text-[#ede7dc]/80 hover:border-[#d4a34a] hover:text-[#d4a34a]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-5 space-y-5 text-sm">
            {/* Dynamic Next Step */}
            <div className="border border-[#d4a34a]/45 bg-[#15111e] p-4">
              <div className="text-xs font-semibold text-[#d4a34a]">
                {isPreGame
                  ? 'Getting Started'
                  : `Your Next Step · Area ${hud.areaIndex}/100 (${hud.areaName}) · Lv ${hud.level}/100`}
              </div>

              {isPreGame ? (
                <div className="mt-2 space-y-2 text-xs leading-relaxed text-[#ddd5c8]">
                  <p>
                    1. Choose a character path: <strong className="text-[#fbbf24]">Warrior</strong> or{' '}
                    <strong className="text-[#fbbf24]">Archer</strong> to fight directly,{' '}
                    <strong className="text-[#fbbf24]">Blacksmith</strong> to forge stronger weapons,{' '}
                    <strong className="text-[#fbbf24]">Saint</strong> to perform Yagga, Mantra & Puja, or{' '}
                    <strong className="text-[#fbbf24]">Supporter</strong> for Prana healing & shields.
                  </p>
                  <p>
                    2. Click <strong className="text-[#fbbf24]">Begin Journey</strong> (or{' '}
                    <strong className="text-[#fbbf24]">Continue Saved</strong> if available) to enter the 3D Forgotten Forest and explore 100 realms.
                  </p>
                </div>
              ) : (
                <div className="mt-2.5 space-y-2.5 text-xs leading-relaxed text-[#ddd5c8]">
                  {pendingObjectives.length > 0 ? (
                    <div>
                      <div className="font-semibold text-[#fbbf24]">
                        Active Quest: {hud.activeQuest?.title}
                      </div>
                      <ul className="mt-1 space-y-1">
                        {pendingObjectives.map((obj) => (
                          <li key={obj.id} className="text-[#f5efe4]">
                            ○ Next Objective: {obj.label}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="font-semibold text-emerald-300">
                      ✓ {realmNextGuidance}
                    </div>
                  )}

                  <div className="border-t border-white/10 pt-2 text-[#cfc6b6]">
                    <span className="font-semibold text-[#fbbf24]">
                      {PLAYER_CLASSES[hud.playerClass].name} Path Tip:
                    </span>{' '}
                    {classTipMap[hud.playerClass]}
                  </div>

                  <div className="text-[#a89f92]">
                    <span className="font-semibold text-[#d4a34a]">Milestone:</span> {nextMilestone}
                  </div>
                </div>
              )}
            </div>

            {/* 100-Realm Roadmap */}
            <div>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-display text-sm font-semibold text-[#f5efe4]">
                  100-Realm Progression Roadmap ({hud.discoveredAreas.length}/100 Discovered)
                </h3>
                <div className="flex flex-wrap gap-1">
                  {REALM_BUCKETS.map((b, idx) => (
                    <button
                      key={b.label}
                      type="button"
                      onClick={() => setRealmBucketIdx(idx)}
                      className={`border px-2 py-0.5 text-[10px] font-semibold ${
                        realmBucketIdx === idx
                          ? 'border-[#d4a34a] bg-[#d4a34a]/20 text-[#fbbf24]'
                          : 'border-white/15 text-[#9c9387] hover:text-[#ede7dc]'
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="max-h-60 space-y-1.5 overflow-y-auto pr-1">
                {roadmapRealms.map((r) => {
                  const isCurrent = !isPreGame && hud.areaId === r.id;
                  const isDiscovered = hud.discoveredAreas.includes(r.id);
                  return (
                    <div
                      key={r.id}
                      className={`flex flex-col justify-between gap-1 border p-2.5 sm:flex-row sm:items-center ${
                        isCurrent
                          ? 'border-[#d4a34a] bg-[#1a1424]'
                          : isDiscovered
                          ? 'border-white/15 bg-[#120f18]'
                          : 'border-white/10 bg-[#0f0c14] opacity-70'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-semibold text-[#fbbf24]">
                          {String(r.index).padStart(2, '0')}. {r.name}{' '}
                          <span className="font-normal text-[#9c9387]">
                            ({r.tier} · Lv {r.recommendedLevel})
                          </span>
                        </div>
                        <div className="mt-0.5 text-[11px] text-[#cfc6b6]">{r.loreText}</div>
                      </div>
                      <span className="shrink-0 text-[11px] font-medium text-[#d4a34a]">
                        {isCurrent ? 'Current' : isDiscovered ? 'Discovered' : 'Locked'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Controls Quick Reference */}
            <div>
              <h3 className="mb-2 font-display text-sm font-semibold text-[#f5efe4]">
                Controls & Shortcuts
              </h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 border border-white/10 bg-[#120f18] p-3 text-xs text-[#cfc6b6] sm:grid-cols-3">
                <span>WASD / Touch Pad · Move</span>
                <span>Mouse / Drag · Camera</span>
                <span>Click · 3-Hit Combo / Bow</span>
                <span>R / Shift+Click · Heavy / Pierce</span>
                <span>X · 360° Spin / 3x Fan</span>
                <span>Z · Vayu Dash / Evade</span>
                <span>Space · Jump</span>
                <span>Shift · Sprint</span>
                <span>E · Interact / Portals</span>
                <span>M · Realm Radar Map</span>
                <span>G · Class Path Action</span>
                <span>H / V · Saint Mantra / Puja</span>
                <span>T · Summon Trial Wave</span>
                <span>Q · Sacred Energy Wave</span>
                <span>C · Divine Shield</span>
                <span>F · Toggle Flashlight</span>
                <span>1 / 2 · Prana / Soma</span>
                <span>I · Satchel & Forge</span>
                <span>ESC · Pause Menu</span>
              </div>
            </div>
          </div>

          <div className="mt-5 flex justify-end border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={onCloseHelp}
              className="border border-[#d4a34a] bg-[#d4a34a] px-6 py-2 text-sm font-semibold text-[#0b090f] hover:bg-[#e5b85c]"
            >
              Got It
            </button>
          </div>
        </div>
      </div>
    );
  }

  // SETTINGS MODAL
  if (showSettings) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-4">
        <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto border border-[#d4a34a]/30 bg-[#0d0b12] p-5 shadow-2xl sm:p-6">
          <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
            <h2 className="font-display text-xl font-semibold text-[#ede7dc]">
              Settings
            </h2>
            <button
              type="button"
              onClick={() => setShowSettings(false)}
              className="flex h-9 w-9 items-center justify-center border border-white/15 text-[#ede7dc]/80 hover:border-[#d4a34a] hover:text-[#d4a34a]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4 text-sm">
            <div>
              <div className="mb-1 flex justify-between text-[#cfc6b6]">
                <span>Camera Distance</span>
                <span className="font-mono-num">{settings.cameraDistance.toFixed(1)}m</span>
              </div>
              <input
                type="range"
                min={3.5}
                max={10.0}
                step={0.1}
                value={settings.cameraDistance}
                onChange={(e) => onUpdateSettings({ cameraDistance: Number(e.target.value) })}
                className="w-full accent-[#d4a34a]"
              />
            </div>

            <div>
              <div className="mb-1 flex justify-between text-[#cfc6b6]">
                <span>Camera Sensitivity</span>
                <span className="font-mono-num">{settings.mouseSensitivity.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min={0.4}
                max={2.2}
                step={0.05}
                value={settings.mouseSensitivity}
                onChange={(e) => onUpdateSettings({ mouseSensitivity: Number(e.target.value) })}
                className="w-full accent-[#d4a34a]"
              />
            </div>

            <div>
              <div className="mb-1 flex justify-between text-[#cfc6b6]">
                <span className="flex items-center gap-1.5">
                  <Volume2 className="h-3.5 w-3.5 text-[#d4a34a]" />
                  Master Volume
                </span>
                <span className="font-mono-num">{Math.round(settings.masterVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={settings.masterVolume}
                onChange={(e) => onUpdateSettings({ masterVolume: Number(e.target.value) })}
                className="w-full accent-[#d4a34a]"
              />
            </div>

            <div>
              <div className="mb-1 flex justify-between text-[#cfc6b6]">
                <span>Ambience Volume</span>
                <span className="font-mono-num">{Math.round(settings.ambienceVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={settings.ambienceVolume}
                onChange={(e) => onUpdateSettings({ ambienceVolume: Number(e.target.value) })}
                className="w-full accent-[#d4a34a]"
              />
            </div>

            <div>
              <div className="mb-1 flex justify-between text-[#cfc6b6]">
                <span>SFX Volume</span>
                <span className="font-mono-num">{Math.round(settings.sfxVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={settings.sfxVolume}
                onChange={(e) => onUpdateSettings({ sfxVolume: Number(e.target.value) })}
                className="w-full accent-[#d4a34a]"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[#cfc6b6]">Dynamic Shadows</span>
              <button
                type="button"
                onClick={() => onUpdateSettings({ shadowsEnabled: !settings.shadowsEnabled })}
                className={`border px-3 py-1.5 text-xs font-medium transition-colors ${
                  settings.shadowsEnabled
                    ? 'border-[#d4a34a] bg-[#d4a34a]/20 text-[#fbbf24]'
                    : 'border-white/15 bg-white/5 text-[#cfc6b6]'
                }`}
              >
                {settings.shadowsEnabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[#cfc6b6]">Touch Controls</span>
              <div className="flex gap-1.5">
                {(['auto', 'on', 'off'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => onUpdateSettings({ showMobileControls: mode })}
                    className={`border px-3 py-1.5 text-xs font-medium capitalize ${
                      settings.showMobileControls === mode
                        ? 'border-[#d4a34a] bg-[#d4a34a]/20 text-[#fbbf24]'
                        : 'border-white/15 bg-white/5 text-[#cfc6b6]'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[#cfc6b6]">Performance Mode</span>
              <div className="flex gap-1.5">
                {(
                  [
                    ['auto', 'Auto'],
                    ['eco', 'Eco'],
                    ['high', 'High'],
                  ] as const
                ).map(([mode, label]) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => onUpdateSettings({ qualityMode: mode })}
                    className={`border px-3 py-1.5 text-xs font-medium ${
                      settings.qualityMode === mode
                        ? 'border-[#d4a34a] bg-[#d4a34a]/20 text-[#fbbf24]'
                        : 'border-white/15 bg-white/5 text-[#cfc6b6]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={() => setShowSettings(false)}
              className="border border-[#d4a34a] bg-[#d4a34a] px-6 py-2 text-sm font-semibold text-[#0b090f] hover:bg-[#e5b85c]"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  // MAIN MENU (Secondary Navigation)
  if (hud.screen === 'menu') {
    return (
      <div className="fixed inset-0 z-30 flex items-center bg-gradient-to-r from-[#07060a]/95 via-[#07060a]/75 to-transparent p-6 md:p-16">
        <div className="max-w-xl space-y-7">
          <div className="space-y-3">
            <h1 className="font-display text-4xl font-bold leading-tight text-[#f5efe4] md:text-6xl" style={{ textWrap: 'balance' }}>
              SHADOW.exe
            </h1>
            <p className="font-display text-lg tracking-wider text-[#c99e4c] md:text-xl">
              The Curse of Kalyug
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:max-w-xs">
            {hud.hasSave && (
              <button
                type="button"
                onClick={() => engine.continueGame()}
                className="flex items-center justify-between border border-[#d4a34a] bg-[#d4a34a] px-5 py-3 text-sm font-semibold text-[#0b090f] transition-colors hover:bg-[#e5b85c]"
              >
                <span>Continue Journey</span>
                <span className="font-mono-num text-xs opacity-85">
                  Lv {hud.level} · {hud.difficultyTier}
                </span>
              </button>
            )}
            <button
              type="button"
              onClick={() => engine.openClassSelect()}
              className={`border px-5 py-3 text-left text-sm font-semibold transition-colors ${
                hud.hasSave
                  ? 'border-[#d4a34a]/50 bg-[#14101c]/90 text-[#f5efe4] hover:border-[#d4a34a]'
                  : 'border-[#d4a34a] bg-[#d4a34a] text-[#0b090f] hover:bg-[#e5b85c]'
              }`}
            >
              New Game
            </button>
            <button
              type="button"
              onClick={onOpenHelp}
              className="flex items-center justify-between border border-white/15 bg-[#120f18]/85 px-5 py-3 text-sm font-medium text-[#ddd5c8] transition-colors hover:border-[#d4a34a]/60"
            >
              <span>Help & Next Step</span>
              <CircleHelp className="h-4 w-4 text-[#d4a34a]" />
            </button>
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              className="flex items-center justify-between border border-white/15 bg-[#120f18]/85 px-5 py-3 text-sm font-medium text-[#ddd5c8] transition-colors hover:border-[#d4a34a]/60"
            >
              <span>Settings</span>
              <Settings className="h-4 w-4 text-[#d4a34a]" />
            </button>
          </div>

          <div className="border-t border-white/10 pt-4 text-xs text-[#9c9387]">
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 sm:grid-cols-3">
              <span>WASD · Move</span>
              <span>Mouse · Camera</span>
              <span>Left Click · Attack / Bow</span>
              <span>Space · Jump</span>
              <span>Shift · Sprint</span>
              <span>F · Flashlight</span>
              <span>E · Interact</span>
              <span>Q / C · Abilities</span>
              <span>T · Shadow Trial</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // CLASS SELECTION SCREEN — 1ST PRIORITY ENTRY (Distinct Class Paths)
  if (hud.screen === 'class_select') {
    const activeCls = PLAYER_CLASSES[pickedClass];
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#07060a]/90 p-3 sm:p-4">
        <div className="max-h-[94vh] w-full max-w-6xl overflow-y-auto border border-[#d4a34a]/45 bg-[#0d0b12]/95 p-4 sm:p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.22em] text-[#d4a34a] uppercase">
                SHADOW.exe: The Curse of Kalyug
              </p>
              <h1 className="mt-1 font-display text-2xl font-bold text-[#f5efe4] sm:text-3xl">
                Choose Your Character & Sacred Path
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {hud.hasSave && (
                <button
                  type="button"
                  onClick={() => engine.continueGame()}
                  className="border border-[#d4a34a] bg-[#1b1526] px-4 py-2 text-xs font-semibold text-[#fbbf24] hover:bg-[#271e36]"
                >
                  Continue Saved (Lv {hud.level})
                </button>
              )}
              <button
                type="button"
                onClick={onOpenHelp}
                className="flex items-center gap-1.5 border border-[#d4a34a]/45 bg-[#171220] px-3.5 py-2 text-xs font-medium text-[#fbbf24] hover:border-[#d4a34a]"
              >
                <CircleHelp className="h-3.5 w-3.5 text-[#d4a34a]" />
                Help & Next Step
              </button>
              <button
                type="button"
                onClick={() => setShowSettings(true)}
                className="flex items-center gap-1.5 border border-white/15 px-3.5 py-2 text-xs text-[#cfc6b6] hover:border-[#d4a34a]"
              >
                <Settings className="h-3.5 w-3.5 text-[#d4a34a]" />
                Settings
              </button>
              <button
                type="button"
                onClick={() => engine.setScreen('menu')}
                className="border border-white/15 px-3.5 py-2 text-xs text-[#cfc6b6] hover:border-[#d4a34a]"
              >
                Menu
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {ALL_CLASS_IDS.map((cid) => {
              const cls = PLAYER_CLASSES[cid];
              const selected = pickedClass === cid;
              return (
                <button
                  key={cid}
                  type="button"
                  onClick={() => setPickedClass(cid)}
                  className={`flex flex-col justify-between border p-4 text-left transition-colors ${
                    selected
                      ? 'border-[#fbbf24] bg-[#1a1426]'
                      : 'border-white/12 bg-[#13101a] hover:border-[#d4a34a]/60'
                  }`}
                >
                  <div>
                    <div className="text-[11px] font-semibold text-[#d4a34a]">
                      {cls.pathRole}
                    </div>
                    <h3 className="mt-1 font-display text-lg font-semibold text-[#f5efe4]">
                      {cls.name}
                    </h3>
                    <div className="text-[11px] text-[#9c9387]">{cls.sanskritTitle}</div>
                    <div className="mt-1.5 text-xs font-medium text-[#fbbf24]">
                      {cls.weaponName}
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-[#b8afa2]">
                      {cls.description}
                    </p>
                  </div>
                  <div className="mt-3 border-t border-white/10 pt-2.5 text-[11px] text-[#ddd5c8]">
                    {cls.bonusSummary}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-5">
            <div className="text-xs text-[#cfc6b6]">
              Selected: <span className="font-semibold text-[#fbbf24]">{activeCls.name}</span> ·{' '}
              <span className="text-[#d4a34a]">{activeCls.pathRole}</span> ·{' '}
              <span className="text-[#9c9387]">{activeCls.specialActionLabel}</span>
            </div>
            <button
              type="button"
              onClick={() => engine.startNewGame(pickedClass)}
              className="border border-[#d4a34a] bg-[#d4a34a] px-7 py-3 text-sm font-bold text-[#0b090f] hover:bg-[#e5b85c]"
            >
              Begin Journey as {activeCls.name}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // LORE MODAL
  if (hud.loreModal) {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-4">
        <div className="w-full max-w-md border border-[#d4a34a]/40 bg-[#0d0b12] p-6">
          <p className="text-xs font-medium text-[#d4a34a]">Ancient Inscription</p>
          <h2 className="mt-1 font-display text-2xl font-semibold text-[#f5efe4]">
            {hud.loreModal.title}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-[#cfc6b6]">
            {hud.loreModal.text}
          </p>
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={() => engine.closeLoreModal()}
              className="border border-[#d4a34a] bg-[#d4a34a] px-5 py-2 text-sm font-semibold text-[#0b090f] hover:bg-[#e5b85c]"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // MANDALA PUZZLE MODAL
  if (hud.screen === 'puzzle') {
    const rings = hud.mandalaRings;
    const labels = ['Outer Ring (Time)', 'Middle Ring (Stillness)', 'Inner Ring (Light)'];
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 p-4">
        <div className="w-full max-w-md border border-[#d4a34a]/40 bg-[#0d0b12] p-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h2 className="font-display text-xl font-semibold text-[#f5efe4]">
                Sacred Mandala Altar
              </h2>
              <p className="text-xs text-[#a89f92]">
                Align all three concentric rings to North (0°) to break the seal.
              </p>
            </div>
            <button
              type="button"
              onClick={() => engine.setScreen('playing')}
              className="border border-white/15 px-3 py-1.5 text-xs text-[#cfc6b6] hover:border-[#d4a34a]"
            >
              Back
            </button>
          </div>

          <div className="my-6 flex flex-col items-center">
            <div className="relative flex h-52 w-52 items-center justify-center">
              {[0, 1, 2].map((idx) => {
                const size = 200 - idx * 54;
                const deg = rings[idx] * 90;
                const aligned = rings[idx] === 0;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => engine.rotateMandalaRing(idx as 0 | 1 | 2)}
                    style={{
                      width: `${size}px`,
                      height: `${size}px`,
                      transform: `rotate(${deg}deg)`,
                    }}
                    className={`absolute flex items-start justify-center rounded-full border-2 transition-transform duration-200 ${
                      aligned
                        ? 'border-[#fbbf24] bg-[#fbbf24]/10'
                        : 'border-[#b83a2d]/80 bg-[#18121d]/80 hover:border-[#d4a34a]'
                    }`}
                  >
                    <span
                      className={`-mt-2 h-3.5 w-3.5 rotate-45 ${
                        aligned ? 'bg-[#fbbf24]' : 'bg-[#ef4444]'
                      }`}
                    />
                  </button>
                );
              })}
              <span className="pointer-events-none font-display text-xs text-[#d4a34a]">N</span>
            </div>
          </div>

          <div className="space-y-2">
            {labels.map((lbl, idx) => (
              <div
                key={lbl}
                className="flex items-center justify-between border border-white/10 bg-white/5 px-3 py-2 text-xs"
              >
                <span className="text-[#cfc6b6]">{lbl}</span>
                <div className="flex items-center gap-3">
                  <span className="font-mono-num text-[#fbbf24]">{rings[idx] * 90}°</span>
                  <button
                    type="button"
                    onClick={() => engine.rotateMandalaRing(idx as 0 | 1 | 2)}
                    className="border border-[#d4a34a]/50 px-2.5 py-1 text-xs font-medium text-[#f5efe4] hover:bg-[#d4a34a]/20"
                  >
                    Rotate
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // LEVEL-UP GOD / RISHI WEAPON BLESSING MODAL (1..100, Level 100 = Maha Maya)
  if (hud.screen === 'levelup') {
    const isMahaMayaFinal =
      hud.blessingChoices.length === 1 && hud.blessingChoices[0].id === 'blessing_100';
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4">
        <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto border border-[#d4a34a]/55 bg-[#0d0b12] p-4 sm:p-6 md:p-8">
          <div className="text-center">
            <p className="text-xs font-semibold tracking-[0.2em] text-[#d4a34a] uppercase">
              Level {hud.level} / 100 · {hud.difficultyTier} · Blessings {hud.blessings.length}/100
            </p>
            <h2 className="mt-1 font-display text-2xl font-bold text-[#f5efe4] sm:text-3xl">
              {isMahaMayaFinal
                ? 'Final Blessing of Supreme Goddess Maha Maya'
                : hud.level <= 10
                ? 'Receive an Easy God or Rishi Blessing & Weapon'
                : 'Receive a God Blessing & Sacred Weapon'}
            </h2>
            <p className="mt-1 text-sm text-[#a89f92]">
              {isMahaMayaFinal
                ? 'The strongest Adi Parashakti Goddess bestows her ultimate cosmic weapon for the battle against Kali Purusha.'
                : 'Every level awakens a divine blessing along with the sacred weapon of its patron Deity or Rishi.'}
            </p>
          </div>

          {hud.activeVedaMantra && (
            <div className="mt-4 border border-[#d4a34a]/35 bg-[#140f1d] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-semibold tracking-wider text-[#d4a34a] uppercase">
                  {hud.activeVedaMantra.veda} · {hud.activeVedaMantra.title}
                </span>
                <button
                  type="button"
                  onClick={() => engine.replayVedaMantra()}
                  className="flex items-center gap-1.5 border border-[#d4a34a]/40 bg-[#1d1629] px-2.5 py-1 text-[11px] font-medium text-[#fbbf24] hover:border-[#fbbf24]"
                >
                  <Volume2 className="h-3 w-3" />
                  Chant Mantra
                </button>
              </div>
              <p className="mt-1.5 text-sm font-semibold text-[#fbbf24]">
                {hud.activeVedaMantra.sanskrit}
              </p>
              <p className="mt-0.5 text-xs italic text-[#dcd3c5]">
                {hud.activeVedaMantra.translit}
              </p>
              <p className="mt-1 text-xs text-[#a89f92]">{hud.activeVedaMantra.meaning}</p>
            </div>
          )}

          <div
            className={`mt-5 grid gap-4 ${
              hud.blessingChoices.length === 1
                ? 'mx-auto max-w-lg grid-cols-1'
                : hud.blessingChoices.length === 2
                ? 'mx-auto max-w-2xl md:grid-cols-2'
                : 'md:grid-cols-3'
            }`}
          >
            {hud.blessingChoices.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => engine.selectGodBlessing(b.id)}
                className={`group flex flex-col justify-between border p-5 text-left transition-all hover:-translate-y-0.5 ${
                  b.id === 'blessing_100'
                    ? 'border-[#fbbf24] bg-[#1c1328] hover:bg-[#241834]'
                    : 'border-white/15 bg-[#15121d] hover:border-[#d4a34a] hover:bg-[#1b1625]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-[#d4a34a]">
                    <span>{b.deity}</span>
                    <span className="font-mono-num">#{b.index}</span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-[#9c9387]">{b.deityRank}</div>
                  <h3 className="mt-2 font-display text-lg font-semibold text-[#f5efe4] group-hover:text-[#fbbf24]">
                    {b.name}
                  </h3>
                  <div className="mt-2 border border-[#d4a34a]/30 bg-[#0d0a14] px-3 py-2 text-xs">
                    <div className="font-semibold text-[#fbbf24]">
                      Weapon: {b.weaponName}
                    </div>
                    <div className="text-[11px] text-[#d8cfc0]">
                      +{b.weaponPower} Base Weapon Power
                    </div>
                  </div>
                  <p className="mt-2.5 text-xs leading-relaxed text-[#b8afa2]">
                    {b.description}
                  </p>
                </div>
                <div className="mt-4 border-t border-white/10 pt-3 text-xs font-semibold text-[#fbbf24]">
                  {b.id === 'blessing_100' ? 'Accept Maha Maya Supreme Weapon' : 'Claim Blessing & Weapon'}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // LEVEL 50 COMPANION PET CLAIM MODAL
  if (hud.screen === 'pet_claim') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/88 p-4">
        <div className="w-full max-w-3xl border border-[#d4a34a]/60 bg-[#0d0b12] p-6 md:p-8">
          <div className="text-center">
            <p className="text-xs font-semibold tracking-[0.22em] text-[#d4a34a] uppercase">
              Level 50 Milestone · Hard Tier Unlocked
            </p>
            <h2 className="mt-1 font-display text-3xl font-bold text-[#f5efe4]">
              Claim Your Sacred Companion Pet
            </h2>
            <p className="mt-1 text-sm text-[#a89f92]">
              Your devotion has summoned a celestial Vahana companion to fight beside you in 3D.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {ALL_PET_IDS.map((pid) => {
              const p = PETS[pid];
              return (
                <button
                  key={pid}
                  type="button"
                  onClick={() => engine.claimPet(pid)}
                  className="group flex flex-col justify-between border border-[#d4a34a]/35 bg-[#15121d] p-5 text-left transition-all hover:-translate-y-0.5 hover:border-[#fbbf24] hover:bg-[#1d1728]"
                >
                  <div>
                    <p className="text-xs font-medium text-[#d4a34a]">{p.subtitle}</p>
                    <h3 className="mt-1 font-display text-xl font-semibold text-[#f5efe4] group-hover:text-[#fbbf24]">
                      {p.name}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-[#b8afa2]">
                      {p.description}
                    </p>
                  </div>
                  <div className="mt-4 border-t border-white/10 pt-3 text-xs font-semibold text-[#fbbf24]">
                    {p.bonusText}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // LEVEL 90 SHIVA TANDAVA STOTRAM MODAL
  if (hud.screen === 'shiva_tandava') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#07050c]/95 p-4">
        <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto border border-[#d4a34a]/65 bg-[#0e0a16] p-6 md:p-8">
          <div className="text-center">
            <Flame className="mx-auto h-8 w-8 text-[#fbbf24]" />
            <p className="mt-2 text-xs font-semibold tracking-[0.24em] text-[#d4a34a] uppercase">
              Level 90 Awakening · Entering Hardest Tier (90–100)
            </p>
            <h2 className="mt-1 font-display text-3xl font-bold text-[#f5efe4] md:text-4xl">
              Shiva Tandava Stotram
            </h2>
            <p className="mt-1 text-xs text-[#b8afa2]">
              Cosmic Rhythm of Nataraja · +30% All Combat Power Granted
            </p>
          </div>

          <div className="mt-6 space-y-4">
            {TANDAVA_VERSES.map((v, idx) => (
              <div
                key={idx}
                className="border border-[#d4a34a]/25 bg-[#151020] p-4"
              >
                <p className="text-base font-semibold text-[#fbbf24]">{v.sanskrit}</p>
                <p className="mt-1 text-xs italic text-[#d8cfc0]">{v.translit}</p>
                <p className="mt-2 text-xs leading-relaxed text-[#a89f92]">{v.meaning}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={() => engine.replayTandavaAudio()}
              className="flex items-center gap-2 border border-[#d4a34a]/50 bg-[#1a1326] px-4 py-2 text-xs font-semibold text-[#fbbf24] hover:border-[#fbbf24]"
            >
              <Volume2 className="h-4 w-4" />
              Replay Damaru Resonance
            </button>
            <button
              type="button"
              onClick={() => engine.closeShivaTandava()}
              className="border border-[#d4a34a] bg-[#d4a34a] px-6 py-2.5 text-sm font-semibold text-[#0b090f] hover:bg-[#e5b85c]"
            >
              Enter the Final Trial (Lv 90–100)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // LEVEL 100 GODHOOD ASCENSION MODAL
  if (hud.screen === 'god_ascension') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#09070d]/94 p-4">
        <div className="w-full max-w-xl border border-[#fbbf24]/70 bg-[#14101c] p-8 text-center">
          <Crown className="mx-auto h-10 w-10 text-[#fbbf24]" />
          <p className="mt-3 text-xs font-semibold tracking-[0.24em] text-[#fbbf24] uppercase">
            Level 100 Attained · 100 Blessings Embodied
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold text-[#f5efe4] md:text-4xl">
            Devatva: You Have Ascended as a God
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[#cfc6b6]">
            The golden cosmic halo now crowns your form in the 3D realm. Your Astra Blade strikes
            with divine radiance (+120% God Multiplier, +500 Max Health, +25 HP/sec Regeneration).
            March into the Final Chamber and banish Kali Purusha!
          </p>
          <div className="mt-6">
            <button
              type="button"
              onClick={() => engine.closeGodAscension()}
              className="border border-[#fbbf24] bg-[#fbbf24] px-7 py-3 text-sm font-bold text-[#0b090f] hover:bg-[#fde047]"
            >
              Wield Divine Power
            </button>
          </div>
        </div>
      </div>
    );
  }

  // INVENTORY / BLESSINGS / ABILITIES / QUESTS MODAL
  if (hud.screen === 'inventory') {
    const ownedBlessingSet = new Set(hud.blessings);
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 p-4">
        <div className="flex max-h-[88vh] w-full max-w-4xl flex-col border border-[#d4a34a]/35 bg-[#0d0b12]">
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
            <div>
              <h2 className="font-display text-xl font-semibold text-[#f5efe4]">
                Sacred Satchel & Chronicles
              </h2>
              <p className="text-xs text-[#a89f92]">
                Class: {PLAYER_CLASSES[hud.playerClass].name} · Lv {hud.level}/100 ({hud.difficultyTier}) ·{' '}
                {hud.blessings.length}/100 Blessings
                {hud.petId ? ` · Pet: ${PETS[hud.petId].name}` : ''}
              </p>
            </div>
            <button
              type="button"
              onClick={() => engine.setScreen('playing')}
              className="border border-white/15 px-3 py-1.5 text-xs text-[#cfc6b6] hover:border-[#d4a34a]"
            >
              Resume
            </button>
          </div>

          <div className="flex flex-wrap border-b border-white/10 px-6">
            {(
              [
                ['artifacts', 'Class, Gear & Artifacts'],
                ['blessings', `Blessings & Weapons (${hud.blessings.length}/100)`],
                ['abilities', 'Abilities'],
                ['quests', 'Quests & Realms'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setInvTab(key)}
                className={`border-b-2 px-4 py-3 text-xs font-semibold transition-colors ${
                  invTab === key
                    ? 'border-[#d4a34a] text-[#fbbf24]'
                    : 'border-transparent text-[#9c9387] hover:text-[#ede7dc]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="overflow-y-auto p-6">
            {invTab === 'artifacts' && (
              <div className="space-y-6">
                <div className="border border-[#d4a34a]/40 bg-[#15111e] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-xs text-[#d4a34a]">
                        {PLAYER_CLASSES[hud.playerClass].name} · {PLAYER_CLASSES[hud.playerClass].pathRole}
                      </div>
                      <h4 className="mt-0.5 font-display text-base font-semibold text-[#fbbf24]">
                        Equipped Weapon: {hud.activeWeaponName}
                      </h4>
                    </div>
                    <span className="text-xs text-[#cfc6b6]">
                      {PLAYER_CLASSES[hud.playerClass].bonusSummary}
                    </span>
                  </div>
                </div>

                {/* Collected Weapons Dropped From Relic Boxes */}
                <div className="border border-[#f472b6]/40 bg-[#15101b] p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h4 className="font-display text-base font-semibold text-[#f9a8d4]">
                      Box Weapons Arsenal ({hud.collectedWeaponIds.length} Collected)
                    </h4>
                    <span className="font-mono-num text-xs text-[#fbbf24]">
                      Active Box Bonus: +{hud.chestWeaponBonus} ATK
                    </span>
                  </div>
                  {hud.collectedWeaponIds.length === 0 ? (
                    <p className="text-xs text-[#a89f92]">
                      Open Relic Chests across any of the 100 realms to drop random Rare, Epic, Mythic & Divya weapons! Collect them in 3D to equip and fight onward.
                    </p>
                  ) : (
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      {hud.collectedWeaponIds.map((wid) => {
                        const w = CHEST_WEAPONS.find((item) => item.id === wid);
                        if (!w) return null;
                        const equipped = hud.equippedChestWeaponId === wid;
                        return (
                          <div
                            key={wid}
                            className={`flex items-center justify-between gap-3 border p-3 ${
                              equipped
                                ? 'border-[#fbbf24] bg-[#21182c]'
                                : 'border-white/12 bg-[#110d17]'
                            }`}
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span
                                  className="text-[10px] font-bold uppercase"
                                  style={{ color: w.accentColor }}
                                >
                                  {w.rarity}
                                </span>
                                <span className="text-xs font-semibold text-[#f5efe4]">
                                  {w.name}
                                </span>
                              </div>
                              <div className="text-[11px] font-medium text-[#fbbf24]">
                                +{w.powerBonus} Attack Power
                              </div>
                              <div className="mt-0.5 text-[11px] text-[#a89f92]">
                                {w.description}
                              </div>
                            </div>
                            <button
                              type="button"
                              disabled={equipped}
                              onClick={() => engine.equipChestWeapon(wid)}
                              className={`shrink-0 border px-3 py-1.5 text-xs font-semibold ${
                                equipped
                                  ? 'border-[#fbbf24]/50 bg-[#fbbf24]/15 text-[#fbbf24]'
                                  : 'border-[#d4a34a] bg-[#d4a34a] text-[#0b090f] hover:bg-[#e5b85c]'
                              }`}
                            >
                              {equipped ? 'Equipped' : 'Equip'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {hud.playerClass === 'blacksmith' && (
                  <div className="border border-[#f97316]/50 bg-[#19110e] p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Hammer className="h-4 w-4 text-[#fb923c]" />
                        <h4 className="font-display text-base font-semibold text-[#fdba74]">
                          Blacksmith Weapon Forge
                        </h4>
                      </div>
                      <span className="font-mono-num text-xs font-semibold text-[#fbbf24]">
                        Forge Shards: {hud.forgeShards} · Crafted: {hud.forgedWeaponsCount} (+{hud.forgedWeaponBonus} Power)
                      </span>
                    </div>
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      {FORGE_RECIPES.map((r) => {
                        const canAfford = hud.forgeShards >= r.shardCost;
                        return (
                          <div
                            key={r.id}
                            className="flex items-center justify-between gap-3 border border-white/10 bg-[#120d0b] p-3"
                          >
                            <div>
                              <div className="text-xs font-semibold text-[#f5efe4]">{r.name}</div>
                              <div className="text-[11px] text-[#fbbf24]">
                                +{r.powerGain} Weapon Power · Cost: {r.shardCost} Shards
                              </div>
                              <div className="mt-0.5 text-[11px] text-[#a89f92]">{r.description}</div>
                            </div>
                            <button
                              type="button"
                              disabled={!canAfford}
                              onClick={() => engine.forgeBlacksmithWeapon(r.id)}
                              className="shrink-0 border border-[#f97316] bg-[#f97316]/20 px-3 py-1.5 text-xs font-semibold text-[#fdba74] hover:bg-[#f97316]/35 disabled:opacity-40"
                            >
                              Forge
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {hud.playerClass === 'saint' && (
                  <div className="border border-[#fbbf24]/50 bg-[#18130e] p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Flame className="h-4 w-4 text-[#fbbf24]" />
                      <h4 className="font-display text-base font-semibold text-[#fbbf24]">
                        Saint Sacred Rituals (Yagga · Mantra · Puja)
                      </h4>
                    </div>
                    <div className="grid gap-2.5 sm:grid-cols-3">
                      <button
                        type="button"
                        onClick={() => {
                          engine.setScreen('playing');
                          engine.performSaintYagga();
                        }}
                        className="border border-[#f97316]/50 bg-[#22150e] p-3 text-left hover:border-[#fbbf24]"
                      >
                        <div className="text-xs font-semibold text-[#fdba74]">Yagga [G]</div>
                        <div className="mt-1 text-[11px] text-[#cfc6b6]">
                          Ignite a 3D Agni Havan Kund burning nearby foes for 8.5s.
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          engine.setScreen('playing');
                          engine.performSaintMantra();
                        }}
                        className="border border-[#fbbf24]/50 bg-[#1e170e] p-3 text-left hover:border-[#fbbf24]"
                      >
                        <div className="text-xs font-semibold text-[#fbbf24]">Mantra [H]</div>
                        <div className="mt-1 text-[11px] text-[#cfc6b6]">
                          Chant a Veda Mantra wave restoring +40 Energy & damaging shadows.
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          engine.setScreen('playing');
                          engine.performSaintPuja();
                        }}
                        className="border border-sky-400/50 bg-[#0f1722] p-3 text-left hover:border-sky-300"
                      >
                        <div className="text-xs font-semibold text-sky-300">Puja [V]</div>
                        <div className="mt-1 text-[11px] text-[#cfc6b6]">
                          Ring temple bell to restore 35% Health & activate Divine Shield.
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {hud.petId && (
                  <div className="border border-[#d4a34a]/50 bg-[#171221] p-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-display text-base font-semibold text-[#fbbf24]">
                        Companion Pet: {PETS[hud.petId].name}
                      </h4>
                      <span className="text-xs text-[#d4a34a]">{PETS[hud.petId].subtitle}</span>
                    </div>
                    <p className="mt-1 text-xs text-[#cfc6b6]">{PETS[hud.petId].description}</p>
                    <p className="mt-1.5 text-xs font-semibold text-[#fbbf24]">
                      {PETS[hud.petId].bonusText}
                    </p>
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex items-center justify-between border border-white/10 bg-[#14111b] p-4">
                    <div>
                      <p className="text-sm font-semibold text-[#f5efe4]">Prana Elixir</p>
                      <p className="text-xs text-[#9c9387]">Restores Health [Key 1]</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono-num text-base font-semibold text-emerald-400">
                        x{hud.consumables.pranaElixir}
                      </span>
                      <button
                        type="button"
                        disabled={hud.consumables.pranaElixir <= 0}
                        onClick={() => engine.useConsumable('prana')}
                        className="border border-[#d4a34a]/50 px-3 py-1.5 text-xs font-medium text-[#f5efe4] disabled:opacity-40"
                      >
                        Use
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border border-white/10 bg-[#14111b] p-4">
                    <div>
                      <p className="text-sm font-semibold text-[#f5efe4]">Soma Vial</p>
                      <p className="text-xs text-[#9c9387]">Restores Energy [Key 2]</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono-num text-base font-semibold text-sky-400">
                        x{hud.consumables.somaVial}
                      </span>
                      <button
                        type="button"
                        disabled={hud.consumables.somaVial <= 0}
                        onClick={() => engine.useConsumable('soma')}
                        className="border border-[#d4a34a]/50 px-3 py-1.5 text-xs font-medium text-[#f5efe4] disabled:opacity-40"
                      >
                        Use
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 font-display text-sm font-semibold text-[#d4a34a]">
                    Mythic Artifacts ({hud.artifacts.length} / 5)
                  </h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {ALL_ARTIFACT_IDS.map((id) => {
                      const def = ARTIFACTS[id];
                      const owned = hud.artifacts.includes(id);
                      return (
                        <div
                          key={id}
                          className={`border p-4 ${
                            owned
                              ? 'border-[#d4a34a]/50 bg-[#16121d]'
                              : 'border-white/10 bg-[#0f0c14] opacity-55'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="font-display text-base font-semibold text-[#f5efe4]">
                              {def.name}
                            </h4>
                            <span className="text-xs font-medium text-[#d4a34a]">
                              {owned ? 'Collected' : 'Undiscovered'}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-[#9c9387]">{def.sanskritSub}</p>
                          <p className="mt-2 text-xs text-[#cfc6b6]">{def.lore}</p>
                          <p className="mt-2 text-xs font-medium text-[#fbbf24]">
                            {def.gameplayEffect}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {invTab === 'blessings' && (
              <div className="grid gap-2.5 sm:grid-cols-2 md:grid-cols-3">
                {GOD_BLESSINGS.map((b) => {
                  const owned = ownedBlessingSet.has(b.id);
                  return (
                    <div
                      key={b.id}
                      className={`border p-3 ${
                        owned
                          ? 'border-[#d4a34a]/50 bg-[#17121f]'
                          : 'border-white/10 bg-[#0f0c14] opacity-45'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] text-[#d4a34a]">
                        <span>{b.deity}</span>
                        <span className="font-mono-num">#{b.index}</span>
                      </div>
                      <h4 className="mt-1 font-display text-xs font-semibold text-[#f5efe4]">
                        {b.name}
                      </h4>
                      <div className="mt-1 text-[11px] font-medium text-[#fbbf24]">
                        {b.weaponName} (+{b.weaponPower})
                      </div>
                      <p className="mt-1 text-[11px] text-[#a89f92]">{b.description}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {invTab === 'abilities' && (
              <div className="grid gap-3 sm:grid-cols-2">
                {ALL_ABILITY_IDS.map((id) => {
                  const def = ABILITIES[id];
                  const rank = hud.abilities[id] ?? 0;
                  return (
                    <div
                      key={id}
                      className={`border p-4 ${
                        rank > 0
                          ? 'border-[#d4a34a]/45 bg-[#16121d]'
                          : 'border-white/10 bg-[#0f0c14] opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-display text-sm font-semibold text-[#f5efe4]">
                          {def.name}
                        </h4>
                        <span className="font-mono-num text-xs text-[#fbbf24]">
                          Rank {rank}/{def.maxRank}
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs text-[#b8afa2]">{def.description}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {invTab === 'quests' && (() => {
              const bucket = REALM_BUCKETS[realmBucketIdx];
              const visibleRealms = REALMS.filter(
                (r) => r.index >= bucket.min && r.index <= bucket.max
              );
              const visibleQuests = hud.allQuests.filter((q) => {
                const idx = getRealm(q.areaId).index;
                return idx >= bucket.min && idx <= bucket.max;
              });
              return (
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-2 border border-white/10 bg-[#14111b] p-3">
                    <span className="text-xs font-semibold text-[#d4a34a]">
                      100 Realms & Quests · Discovered {hud.discoveredAreas.length}/100
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {REALM_BUCKETS.map((b, idx) => (
                        <button
                          key={b.label}
                          type="button"
                          onClick={() => setRealmBucketIdx(idx)}
                          className={`border px-2 py-0.5 text-[10px] font-semibold ${
                            realmBucketIdx === idx
                              ? 'border-[#d4a34a] bg-[#d4a34a]/20 text-[#fbbf24]'
                              : 'border-white/15 text-[#9c9387] hover:text-[#ede7dc]'
                          }`}
                        >
                          {b.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {visibleQuests.map((q) => (
                      <div
                        key={q.id}
                        className={`border p-3.5 ${
                          q.completed
                            ? 'border-emerald-500/40 bg-emerald-950/20'
                            : q.areaId === hud.areaId
                            ? 'border-[#d4a34a]/60 bg-[#1a1424]'
                            : 'border-white/10 bg-[#14111b]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-display text-sm font-semibold text-[#f5efe4]">
                            {q.title}
                          </h4>
                          <span className="text-xs font-medium text-[#d4a34a]">
                            {q.completed ? 'Completed' : `+${q.xpReward} XP`}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-[#a89f92]">{q.description}</p>
                        <div className="mt-2 space-y-1">
                          {q.objectives.map((o) => (
                            <div
                              key={o.id}
                              className={`text-xs ${
                                o.completed ? 'text-emerald-400 line-through' : 'text-[#ddd5c8]'
                              }`}
                            >
                              {o.completed ? '✓' : '○'} {o.label}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <h3 className="mb-2 font-display text-sm font-semibold text-[#d4a34a]">
                      Realm Fast Travel ({bucket.min}–{bucket.max})
                    </h3>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {visibleRealms.map((r) => {
                        const discovered = hud.discoveredAreas.includes(r.id);
                        return (
                          <button
                            key={r.id}
                            type="button"
                            disabled={!discovered || hud.areaId === r.id}
                            onClick={() => engine.travelToDiscoveredArea(r.id)}
                            className={`truncate border px-3 py-2 text-left text-xs font-medium transition-colors ${
                              hud.areaId === r.id
                                ? 'border-[#d4a34a] bg-[#d4a34a]/20 text-[#fbbf24]'
                                : discovered
                                ? 'border-white/15 bg-[#14111b] text-[#cfc6b6] hover:border-[#d4a34a]/60'
                                : 'cursor-not-allowed border-white/10 bg-[#0f0c14] text-[#7a7267] opacity-55'
                            }`}
                          >
                            {r.index}. {r.name}
                            {!discovered ? ' (Locked)' : ''}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    );
  }

  // PAUSE MENU
  if (hud.screen === 'paused') {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-4">
        <div className="w-full max-w-sm border border-[#d4a34a]/40 bg-[#0d0b12] p-6">
          <h2 className="font-display text-2xl font-semibold text-[#f5efe4]">Paused</h2>
          <p className="mt-1 text-xs text-[#9c9387]">
            {hud.areaName} · Level {hud.level}/100 ({hud.difficultyTier})
          </p>

          <div className="mt-6 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => engine.setScreen('playing')}
              className="border border-[#d4a34a] bg-[#d4a34a] px-4 py-2.5 text-sm font-semibold text-[#0b090f] hover:bg-[#e5b85c]"
            >
              Resume
            </button>
            <button
              type="button"
              onClick={() => engine.manualSave()}
              className="border border-white/15 bg-[#15121d] px-4 py-2.5 text-sm font-medium text-[#ede7dc] hover:border-[#d4a34a]"
            >
              Save Progress
            </button>
            <button
              type="button"
              onClick={() => engine.setScreen('inventory')}
              className="border border-white/15 bg-[#15121d] px-4 py-2.5 text-sm font-medium text-[#ede7dc] hover:border-[#d4a34a]"
            >
              Satchel, Blessings & Quests
            </button>
            <button
              type="button"
              onClick={onOpenHelp}
              className="border border-[#d4a34a]/45 bg-[#171220] px-4 py-2.5 text-sm font-medium text-[#fbbf24] hover:border-[#d4a34a]"
            >
              Help & Next Step
            </button>
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              className="border border-white/15 bg-[#15121d] px-4 py-2.5 text-sm font-medium text-[#ede7dc] hover:border-[#d4a34a]"
            >
              Settings
            </button>
            <button
              type="button"
              onClick={() => engine.returnToMenu()}
              className="border border-[#b83a2d]/50 bg-[#1a0f12] px-4 py-2.5 text-sm font-medium text-[#f2b8b5] hover:border-[#ef4444]"
            >
              Main Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  // GAME OVER
  if (hud.screen === 'gameover') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#090406]/90 p-4">
        <div className="w-full max-w-md border border-[#b83a2d]/60 bg-[#110a0d] p-8 text-center">
          <p className="text-xs font-semibold tracking-[0.2em] text-[#ef4444] uppercase">
            Fallen in Kalyug
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold text-[#f5efe4]">
            The Shadow Consumed You
          </h2>
          <p className="mt-3 text-sm text-[#b8afa2]">
            Yet the sacred ember endures. Rise again from your last saved seal or begin anew.
          </p>

          <div className="mt-7 flex flex-col gap-3">
            {hud.hasSave && (
              <button
                type="button"
                onClick={() => engine.continueGame()}
                className="flex items-center justify-center gap-2 border border-[#d4a34a] bg-[#d4a34a] px-5 py-3 text-sm font-semibold text-[#0b090f] hover:bg-[#e5b85c]"
              >
                <RotateCcw className="h-4 w-4" />
                Load Last Save
              </button>
            )}
            <button
              type="button"
              onClick={() => engine.openClassSelect()}
              className="border border-white/20 bg-white/5 px-5 py-3 text-sm font-medium text-[#f5efe4] hover:border-[#d4a34a]"
            >
              Restart New Game
            </button>
            <button
              type="button"
              onClick={() => engine.returnToMenu()}
              className="text-xs text-[#9c9387] hover:text-[#ede7dc]"
            >
              Return to Main Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  // VICTORY SEQUENCE
  if (hud.screen === 'victory') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#09070d]/92 p-4">
        <div className="w-full max-w-xl border border-[#d4a34a]/60 bg-[#120e18] p-8 text-center">
          <Sparkles className="mx-auto h-9 w-9 text-[#fbbf24]" />
          <p className="mt-3 text-xs font-semibold tracking-[0.22em] text-[#d4a34a] uppercase">
            Satya Yuga Awakens
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold text-[#f5efe4] md:text-4xl">
            Kali Purusha Banished!
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[#cfc6b6]">
            Kali Purusha, Sovereign of Kalyug, shatters into golden light. Across all hundred sacred
            realms, Dharma is restored.
          </p>

          <div className="my-6 grid grid-cols-4 gap-2 border-y border-white/10 py-4 text-center">
            <div>
              <div className="font-mono-num text-xl font-bold text-[#fbbf24]">{hud.level}/100</div>
              <div className="text-[11px] text-[#9c9387]">Level</div>
            </div>
            <div>
              <div className="font-mono-num text-xl font-bold text-[#fbbf24]">
                {hud.blessings.length}/100
              </div>
              <div className="text-[11px] text-[#9c9387]">Blessings</div>
            </div>
            <div>
              <div className="font-mono-num text-xl font-bold text-[#fbbf24]">
                {hud.artifacts.length}/5
              </div>
              <div className="text-[11px] text-[#9c9387]">Artifacts</div>
            </div>
            <div>
              <div className="font-mono-num text-xl font-bold text-[#fbbf24]">
                {hud.enemiesDefeated}
              </div>
              <div className="text-[11px] text-[#9c9387]">Banished</div>
            </div>
          </div>

          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => engine.setScreen('playing')}
              className="border border-[#d4a34a]/50 bg-[#1a1523] px-5 py-2.5 text-sm font-medium text-[#f5efe4] hover:border-[#d4a34a]"
            >
              Continue Exploring (Reach Lv 100)
            </button>
            <button
              type="button"
              onClick={() => engine.openClassSelect()}
              className="border border-[#d4a34a] bg-[#d4a34a] px-5 py-2.5 text-sm font-semibold text-[#0b090f] hover:bg-[#e5b85c]"
            >
              Play Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
