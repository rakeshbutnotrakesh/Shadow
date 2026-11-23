import { PlayerInputState } from './player';

export class InputManager {
  public keys: Record<string, boolean> = {};
  public pointerLocked = false;

  private pendingAttack = false;
  private pendingSacredAttack = false;
  private pendingShield = false;
  private pendingFlashlight = false;
  private pendingInteract = false;
  private pendingJump = false;
  private pendingUsePrana = false;
  private pendingUseSoma = false;
  private pendingPause = false;
  private pendingInventory = false;
  private pendingTrial = false;
  private pendingClassAction = false;
  private pendingSaintMantra = false;
  private pendingSaintPuja = false;

  private camDeltaX = 0;
  private camDeltaY = 0;
  private wheelDelta = 0;

  // Mobile virtual joystick vector (-1..1)
  public mobileMoveX = 0;
  public mobileMoveY = 0;
  public mobileSprint = false;

  private isDraggingMouse = false;
  private lastMouseX = 0;
  private lastMouseY = 0;
  private activeTouchId: number | null = null;
  private lastTouchX = 0;
  private lastTouchY = 0;

  private canvas: HTMLCanvasElement | null = null;
  private isPlayingFn: () => boolean;

  constructor(isPlayingFn: () => boolean) {
    this.isPlayingFn = isPlayingFn;
  }

  public attach(canvas: HTMLCanvasElement): () => void {
    this.canvas = canvas;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) {
        this.keys[e.code] = true;
        return;
      }
      this.keys[e.code] = true;

      if (e.code === 'Escape' || e.code === 'KeyP') {
        this.pendingPause = true;
      } else if (e.code === 'KeyI') {
        this.pendingInventory = true;
      }

      if (!this.isPlayingFn()) return;

      if (e.code === 'Space') {
        e.preventDefault();
        this.pendingJump = true;
      } else if (e.code === 'KeyF') {
        this.pendingFlashlight = true;
      } else if (e.code === 'KeyE') {
        this.pendingInteract = true;
      } else if (e.code === 'KeyQ') {
        this.pendingSacredAttack = true;
      } else if (e.code === 'KeyC') {
        this.pendingShield = true;
      } else if (e.code === 'KeyJ') {
        this.pendingAttack = true;
      } else if (e.code === 'Digit1') {
        this.pendingUsePrana = true;
      } else if (e.code === 'Digit2') {
        this.pendingUseSoma = true;
      } else if (e.code === 'KeyT') {
        this.pendingTrial = true;
      } else if (e.code === 'KeyG') {
        this.pendingClassAction = true;
      } else if (e.code === 'KeyH') {
        this.pendingSaintMantra = true;
      } else if (e.code === 'KeyV') {
        this.pendingSaintPuja = true;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      this.keys[e.code] = false;
    };

    const onMouseDown = (e: MouseEvent) => {
      if (!this.isPlayingFn()) return;
      if (e.target !== canvas) return;

      if (e.button === 0) {
        if (!this.pointerLocked && canvas.requestPointerLock) {
          try {
            canvas.requestPointerLock();
          } catch {
            // Fallback to drag if pointer lock is blocked in iframe
          }
        }
        this.pendingAttack = true;
        this.isDraggingMouse = true;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
      } else if (e.button === 2) {
        this.pendingShield = true;
      }
    };

    const onMouseUp = () => {
      this.isDraggingMouse = false;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!this.isPlayingFn()) return;
      if (this.pointerLocked) {
        this.camDeltaX += e.movementX;
        this.camDeltaY += e.movementY;
      } else if (this.isDraggingMouse) {
        this.camDeltaX += (e.clientX - this.lastMouseX) * 1.4;
        this.camDeltaY += (e.clientY - this.lastMouseY) * 1.4;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
      }
    };

    const onWheel = (e: WheelEvent) => {
      if (!this.isPlayingFn()) return;
      this.wheelDelta += Math.sign(e.deltaY) * 0.55;
    };

    const onContextMenu = (e: MouseEvent) => {
      if (this.isPlayingFn()) e.preventDefault();
    };

    const onPointerLockChange = () => {
      this.pointerLocked = document.pointerLockElement === canvas;
    };

    const onTouchStart = (e: TouchEvent) => {
      if (!this.isPlayingFn()) return;
      if (e.target !== canvas) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (this.activeTouchId === null) {
          this.activeTouchId = t.identifier;
          this.lastTouchX = t.clientX;
          this.lastTouchY = t.clientY;
        }
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!this.isPlayingFn()) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === this.activeTouchId) {
          this.camDeltaX += (t.clientX - this.lastTouchX) * 1.65;
          this.camDeltaY += (t.clientY - this.lastTouchY) * 1.45;
          this.lastTouchX = t.clientX;
          this.lastTouchY = t.clientY;
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === this.activeTouchId) {
          this.activeTouchId = null;
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('wheel', onWheel, { passive: true });
    canvas.addEventListener('contextmenu', onContextMenu);
    document.addEventListener('pointerlockchange', onPointerLockChange);
    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    canvas.addEventListener('touchmove', onTouchMove, { passive: true });
    canvas.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('contextmenu', onContextMenu);
      document.removeEventListener('pointerlockchange', onPointerLockChange);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
    };
  }

  public releasePointerLock(): void {
    if (document.pointerLockElement === this.canvas) {
      document.exitPointerLock?.();
    }
  }

  // Trigger methods for mobile / HUD buttons
  public triggerAttack(): void { this.pendingAttack = true; }
  public triggerSacredAttack(): void { this.pendingSacredAttack = true; }
  public triggerShield(): void { this.pendingShield = true; }
  public triggerJump(): void { this.pendingJump = true; }
  public triggerInteract(): void { this.pendingInteract = true; }
  public triggerFlashlight(): void { this.pendingFlashlight = true; }
  public triggerClassAction(): void { this.pendingClassAction = true; }
  public triggerSaintMantra(): void { this.pendingSaintMantra = true; }
  public triggerSaintPuja(): void { this.pendingSaintPuja = true; }

  public consumeCameraDeltas(): { dx: number; dy: number; wheel: number } {
    const out = { dx: this.camDeltaX, dy: this.camDeltaY, wheel: this.wheelDelta };
    this.camDeltaX = 0;
    this.camDeltaY = 0;
    this.wheelDelta = 0;
    return out;
  }

  public consumeSystemActions(): {
    pause: boolean;
    inventory: boolean;
    usePrana: boolean;
    useSoma: boolean;
    invokeTrial: boolean;
    classAction: boolean;
    saintMantra: boolean;
    saintPuja: boolean;
  } {
    const out = {
      pause: this.pendingPause,
      inventory: this.pendingInventory,
      usePrana: this.pendingUsePrana,
      useSoma: this.pendingUseSoma,
      invokeTrial: this.pendingTrial,
      classAction: this.pendingClassAction,
      saintMantra: this.pendingSaintMantra,
      saintPuja: this.pendingSaintPuja,
    };
    this.pendingPause = false;
    this.pendingInventory = false;
    this.pendingUsePrana = false;
    this.pendingUseSoma = false;
    this.pendingTrial = false;
    this.pendingClassAction = false;
    this.pendingSaintMantra = false;
    this.pendingSaintPuja = false;
    return out;
  }

  public consumePlayerInput(): PlayerInputState {
    let forward = 0;
    let right = 0;
    if (this.keys['KeyW'] || this.keys['ArrowUp']) forward += 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) forward -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) right += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) right -= 1;

    if (Math.abs(this.mobileMoveX) > 0.08 || Math.abs(this.mobileMoveY) > 0.08) {
      forward = THREE.MathUtils.clamp(forward - this.mobileMoveY, -1, 1);
      right = THREE.MathUtils.clamp(right + this.mobileMoveX, -1, 1);
    }

    const sprint = Boolean(this.keys['ShiftLeft'] || this.keys['ShiftRight'] || this.mobileSprint);

    const state: PlayerInputState = {
      forward,
      right,
      sprint,
      jump: this.pendingJump,
      attack: this.pendingAttack,
      sacredAttack: this.pendingSacredAttack,
      shield: this.pendingShield,
      flashlightToggle: this.pendingFlashlight,
      interact: this.pendingInteract,
    };

    this.pendingJump = false;
    this.pendingAttack = false;
    this.pendingSacredAttack = false;
    this.pendingShield = false;
    this.pendingFlashlight = false;
    this.pendingInteract = false;

    return state;
  }

  public clearKeys(): void {
    this.keys = {};
    this.mobileMoveX = 0;
    this.mobileMoveY = 0;
  }
}

import * as THREE from 'three';
