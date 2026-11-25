import React, { useRef, useState } from 'react';
import { KalyugGameEngine } from '../game/main';
import { ClassId } from '../game/types';

interface MobileControlsProps {
  engine: KalyugGameEngine;
  hasSacredAttack: boolean;
  hasDivineShield: boolean;
  canInteract: boolean;
  isBowClass?: boolean;
  playerClass: ClassId;
  yaggaActive?: boolean;
  heavyCooldown?: number;
  spinCooldown?: number;
  dashCooldown?: number;
}

const CLASS_ACTION_LABELS: Record<ClassId, string> = {
  warrior: 'Cleave',
  archer: 'Volley',
  blacksmith: 'Forge',
  saint: 'Yagga',
  supporter: 'Prana',
};

export const MobileControls: React.FC<MobileControlsProps> = ({
  engine,
  hasSacredAttack,
  hasDivineShield,
  canInteract,
  isBowClass = false,
  playerClass,
  yaggaActive = false,
  heavyCooldown = 0,
  spinCooldown = 0,
  dashCooldown = 0,
}) => {
  const padRef = useRef<HTMLDivElement | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const touchIdRef = useRef<number | null>(null);

  const updateStick = (clientX: number, clientY: number) => {
    const pad = padRef.current;
    if (!pad) return;
    const rect = pad.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const maxR = rect.width * 0.38;

    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > maxR) {
      dx = (dx / dist) * maxR;
      dy = (dy / dist) * maxR;
    }

    setKnob({ x: dx, y: dy });
    engine.input.mobileMoveX = dx / maxR;
    engine.input.mobileMoveY = dy / maxR;
    engine.input.mobileSprint = dist > maxR * 0.84;
  };

  const resetStick = () => {
    touchIdRef.current = null;
    setKnob({ x: 0, y: 0 });
    engine.input.mobileMoveX = 0;
    engine.input.mobileMoveY = 0;
    engine.input.mobileSprint = false;
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-20 flex items-end justify-between px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] sm:px-5 sm:pb-4">
      {/* Left Virtual Thumb Joystick */}
      <div
        ref={padRef}
        className="pointer-events-auto relative h-24 w-24 touch-none rounded-full border border-[#d4a34a]/50 bg-[#0b090f]/78 sm:h-28 sm:w-28"
        onTouchStart={(e) => {
          const t = e.changedTouches[0];
          if (t) {
            touchIdRef.current = t.identifier;
            updateStick(t.clientX, t.clientY);
          }
        }}
        onTouchMove={(e) => {
          for (let i = 0; i < e.changedTouches.length; i++) {
            const t = e.changedTouches[i];
            if (t.identifier === touchIdRef.current) {
              updateStick(t.clientX, t.clientY);
            }
          }
        }}
        onTouchEnd={resetStick}
        onTouchCancel={resetStick}
      >
        <div
          className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#d4a34a]/80 bg-[#d4a34a]/35 sm:h-11 sm:w-11"
          style={{ transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }}
        />
      </div>

      {/* Right Landscape-Optimized Multi-Attack & Ritual Cluster */}
      <div className="pointer-events-auto grid grid-cols-4 gap-1 sm:gap-1.5">
        {/* Row 1: Class Path + Torch */}
        {playerClass === 'saint' ? (
          <>
            <button
              type="button"
              onTouchStart={(e) => {
                e.preventDefault();
                engine.performClassAction();
              }}
              onClick={() => engine.performClassAction()}
              className={`min-h-[42px] min-w-[46px] rounded-lg border px-1.5 text-[10px] font-semibold active:scale-95 sm:text-[11px] ${
                yaggaActive
                  ? 'border-orange-400 bg-orange-500/30 text-orange-200'
                  : 'border-amber-400/60 bg-[#14101c]/90 text-amber-300'
              }`}
            >
              Yagga
            </button>
            <button
              type="button"
              onTouchStart={(e) => {
                e.preventDefault();
                engine.performSaintMantra();
              }}
              onClick={() => engine.performSaintMantra()}
              className="min-h-[42px] min-w-[46px] rounded-lg border border-yellow-400/55 bg-[#14101c]/90 px-1.5 text-[10px] font-semibold text-yellow-200 active:scale-95 sm:text-[11px]"
            >
              Mantra
            </button>
            <button
              type="button"
              onTouchStart={(e) => {
                e.preventDefault();
                engine.performSaintPuja();
              }}
              onClick={() => engine.performSaintPuja()}
              className="min-h-[42px] min-w-[46px] rounded-lg border border-sky-400/55 bg-[#14101c]/90 px-1.5 text-[10px] font-semibold text-sky-200 active:scale-95 sm:text-[11px]"
            >
              Puja
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onTouchStart={(e) => {
                e.preventDefault();
                engine.performClassAction();
              }}
              onClick={() => engine.performClassAction()}
              className="col-span-2 min-h-[42px] rounded-lg border border-[#d4a34a]/70 bg-[#1b1424]/92 px-2 text-[10px] font-semibold text-[#fbbf24] active:scale-95 sm:text-[11px]"
            >
              {CLASS_ACTION_LABELS[playerClass]}
            </button>
            {playerClass === 'blacksmith' ? (
              <button
                type="button"
                onTouchStart={(e) => {
                  e.preventDefault();
                  engine.setScreen('inventory');
                }}
                onClick={() => engine.setScreen('inventory')}
                className="min-h-[42px] min-w-[46px] rounded-lg border border-orange-400/60 bg-[#14101c]/90 px-1.5 text-[10px] font-semibold text-orange-300 active:scale-95 sm:text-[11px]"
              >
                Forge UI
              </button>
            ) : hasSacredAttack ? (
              <button
                type="button"
                onTouchStart={(e) => {
                  e.preventDefault();
                  engine.input.triggerSacredAttack();
                }}
                onClick={() => engine.input.triggerSacredAttack()}
                className="min-h-[42px] min-w-[46px] rounded-lg border border-amber-400/50 bg-[#14101c]/90 px-1.5 text-[10px] font-semibold text-amber-300 active:scale-95 sm:text-[11px]"
              >
                Wave
              </button>
            ) : (
              <button
                type="button"
                onTouchStart={(e) => {
                  e.preventDefault();
                  engine.invokeShadowTrialWave();
                }}
                onClick={() => engine.invokeShadowTrialWave()}
                className="min-h-[42px] min-w-[46px] rounded-lg border border-[#b83a2d]/50 bg-[#14101c]/90 px-1.5 text-[10px] font-semibold text-[#fca5a5] active:scale-95 sm:text-[11px]"
              >
                Trial
              </button>
            )}
          </>
        )}

        <button
          type="button"
          onTouchStart={(e) => {
            e.preventDefault();
            engine.input.triggerFlashlight();
          }}
          onClick={() => engine.input.triggerFlashlight()}
          className="min-h-[42px] min-w-[46px] rounded-lg border border-white/20 bg-[#14101c]/90 px-1.5 text-[10px] font-semibold text-[#ede7dc] active:scale-95 sm:text-[11px]"
        >
          Light
        </button>

        {/* Row 2: Attack Formats (Heavy / Spin / Dash / Shield or Wave) */}
        <button
          type="button"
          onTouchStart={(e) => {
            e.preventDefault();
            engine.input.triggerHeavyAttack();
          }}
          onClick={() => engine.input.triggerHeavyAttack()}
          className={`min-h-[42px] min-w-[48px] rounded-lg border px-1.5 text-[10px] font-semibold active:scale-95 sm:text-[11px] ${
            heavyCooldown > 0
              ? 'border-white/15 bg-[#14101c]/75 text-[#8a8175]'
              : 'border-orange-400/65 bg-orange-950/70 text-orange-200'
          }`}
        >
          {heavyCooldown > 0 ? `${heavyCooldown}s` : isBowClass ? 'Pierce' : 'Heavy'}
        </button>

        <button
          type="button"
          onTouchStart={(e) => {
            e.preventDefault();
            engine.input.triggerSpinAttack();
          }}
          onClick={() => engine.input.triggerSpinAttack()}
          className={`min-h-[42px] min-w-[48px] rounded-lg border px-1.5 text-[10px] font-semibold active:scale-95 sm:text-[11px] ${
            spinCooldown > 0
              ? 'border-white/15 bg-[#14101c]/75 text-[#8a8175]'
              : 'border-amber-400/65 bg-amber-950/70 text-amber-200'
          }`}
        >
          {spinCooldown > 0 ? `${spinCooldown}s` : isBowClass ? 'Fan 3x' : 'Spin'}
        </button>

        <button
          type="button"
          onTouchStart={(e) => {
            e.preventDefault();
            engine.input.triggerDashAttack();
          }}
          onClick={() => engine.input.triggerDashAttack()}
          className={`min-h-[42px] min-w-[48px] rounded-lg border px-1.5 text-[10px] font-semibold active:scale-95 sm:text-[11px] ${
            dashCooldown > 0
              ? 'border-white/15 bg-[#14101c]/75 text-[#8a8175]'
              : 'border-sky-400/65 bg-sky-950/70 text-sky-200'
          }`}
        >
          {dashCooldown > 0 ? `${dashCooldown}s` : isBowClass ? 'Evade' : 'Dash'}
        </button>

        {hasDivineShield ? (
          <button
            type="button"
            onTouchStart={(e) => {
              e.preventDefault();
              engine.input.triggerShield();
            }}
            onClick={() => engine.input.triggerShield()}
            className="min-h-[42px] min-w-[46px] rounded-lg border border-sky-400/50 bg-[#14101c]/90 px-1.5 text-[10px] font-semibold text-sky-300 active:scale-95 sm:text-[11px]"
          >
            Shield
          </button>
        ) : hasSacredAttack ? (
          <button
            type="button"
            onTouchStart={(e) => {
              e.preventDefault();
              engine.input.triggerSacredAttack();
            }}
            onClick={() => engine.input.triggerSacredAttack()}
            className="min-h-[42px] min-w-[46px] rounded-lg border border-amber-400/50 bg-[#14101c]/90 px-1.5 text-[10px] font-semibold text-amber-300 active:scale-95 sm:text-[11px]"
          >
            Wave
          </button>
        ) : (
          <button
            type="button"
            onTouchStart={(e) => {
              e.preventDefault();
              engine.invokeShadowTrialWave();
            }}
            onClick={() => engine.invokeShadowTrialWave()}
            className="min-h-[42px] min-w-[46px] rounded-lg border border-[#b83a2d]/50 bg-[#14101c]/90 px-1.5 text-[10px] font-semibold text-[#fca5a5] active:scale-95 sm:text-[11px]"
          >
            Trial
          </button>
        )}

        {/* Row 3: Interact/Trial + Jump + Primary Attack/Shoot */}
        {canInteract ? (
          <button
            type="button"
            onTouchStart={(e) => {
              e.preventDefault();
              engine.input.triggerInteract();
            }}
            onClick={() => engine.input.triggerInteract()}
            className="min-h-[46px] min-w-[48px] rounded-lg border border-[#d4a34a] bg-[#d4a34a]/30 px-2 text-[11px] font-bold text-[#fbbf24] active:scale-95"
          >
            Use
          </button>
        ) : (
          <button
            type="button"
            onTouchStart={(e) => {
              e.preventDefault();
              engine.invokeShadowTrialWave();
            }}
            onClick={() => engine.invokeShadowTrialWave()}
            className="min-h-[46px] min-w-[48px] rounded-lg border border-[#b83a2d]/55 bg-[#14101c]/90 px-2 text-[10px] font-semibold text-[#fca5a5] active:scale-95 sm:text-[11px]"
          >
            Trial
          </button>
        )}

        <button
          type="button"
          onTouchStart={(e) => {
            e.preventDefault();
            engine.input.triggerJump();
          }}
          onClick={() => engine.input.triggerJump()}
          className="min-h-[46px] min-w-[48px] rounded-lg border border-white/25 bg-[#14101c]/90 px-2 text-[11px] font-semibold text-[#ede7dc] active:scale-95"
        >
          Jump
        </button>

        <button
          type="button"
          onTouchStart={(e) => {
            e.preventDefault();
            engine.input.triggerAttack();
          }}
          onClick={() => engine.input.triggerAttack()}
          className="col-span-2 min-h-[46px] rounded-lg border border-[#ef4444] bg-[#b83a2d]/55 px-3 text-xs font-bold text-white active:scale-95"
        >
          {isBowClass ? 'Shoot Bow' : 'Combo Attack'}
        </button>
      </div>
    </div>
  );
};


