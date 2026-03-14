/**
 * DOM-based touch controls for iPad/tablet.
 * Left: Up/Down buttons (slide-switchable) | Right: Forward + Boost + Barrel Roll
 */
import { InputManager } from './input';

export class DomTouchControls {
  private root: HTMLElement;

  constructor(input: InputManager) {
    this.root = document.getElementById('touch-controls')!;

    // only show on touch devices
    if (!('ontouchstart' in window)) return;
    this.root.classList.remove('hidden');

    // --- D-Pad: up/down with slide support ---
    const upBtn = this.root.querySelector<HTMLElement>('[data-dir="up"]')!;
    const downBtn = this.root.querySelector<HTMLElement>('[data-dir="down"]')!;
    const dpadBase = this.root.querySelector<HTMLElement>('.touch-dpad-base')!;

    // Track which d-pad direction is active per pointer
    let activeDpadDir: 'up' | 'down' | null = null;
    let dpadPointerId: number | null = null;

    const setDpad = (dir: 'up' | 'down' | null) => {
      if (dir === activeDpadDir) return;
      // release previous
      if (activeDpadDir === 'up') { input.touchUp = false; upBtn.classList.remove('pressed'); }
      if (activeDpadDir === 'down') { input.touchDown = false; downBtn.classList.remove('pressed'); }
      activeDpadDir = dir;
      // activate new
      if (dir === 'up') { input.touchUp = true; upBtn.classList.add('pressed'); }
      if (dir === 'down') { input.touchDown = true; downBtn.classList.add('pressed'); }
    };

    const hitTestDpad = (x: number, y: number): 'up' | 'down' | null => {
      const upRect = upBtn.getBoundingClientRect();
      const downRect = downBtn.getBoundingClientRect();
      if (x >= upRect.left && x <= upRect.right && y >= upRect.top && y <= upRect.bottom) return 'up';
      if (x >= downRect.left && x <= downRect.right && y >= downRect.top && y <= downRect.bottom) return 'down';
      return null;
    };

    const onDpadDown = (e: PointerEvent, dir: 'up' | 'down') => {
      dpadPointerId = e.pointerId;
      setDpad(dir);
      // Capture pointer on the base so we get move/up events even outside the button
      dpadBase.setPointerCapture(e.pointerId);
    };

    upBtn.addEventListener('pointerdown', (e) => onDpadDown(e, 'up'));
    downBtn.addEventListener('pointerdown', (e) => onDpadDown(e, 'down'));

    dpadBase.addEventListener('pointermove', (e) => {
      if (e.pointerId !== dpadPointerId) return;
      const dir = hitTestDpad(e.clientX, e.clientY);
      setDpad(dir);
    });

    const releaseDpad = (e: PointerEvent) => {
      if (e.pointerId !== dpadPointerId) return;
      setDpad(null);
      dpadPointerId = null;
    };
    dpadBase.addEventListener('pointerup', releaseDpad);
    dpadBase.addEventListener('pointercancel', releaseDpad);

    // Forward button (right arrow, next to boost)
    this.bindHold('touch-forward', () => { input.touchRight = true; }, () => { input.touchRight = false; });

    // Boost button
    this.bindTap('touch-boost', () => { input.touchBoost = true; });

    // Barrel roll button
    this.bindTap('touch-barrel', () => { input.touchBarrel = true; });
  }

  /** Bind a hold-to-activate button (pressed while held, released on up) */
  private bindHold(id: string, onDown: () => void, onUp: () => void) {
    const btn = document.getElementById(id)!;
    btn.addEventListener('pointerdown', () => {
      onDown();
      btn.classList.add('pressed');
    });
    const release = () => {
      onUp();
      btn.classList.remove('pressed');
    };
    btn.addEventListener('pointerup', release);
    btn.addEventListener('pointerleave', release);
    btn.addEventListener('pointercancel', release);
  }

  /** Bind a single-tap button (fires once on press) */
  private bindTap(id: string, onTap: () => void) {
    const btn = document.getElementById(id)!;
    btn.addEventListener('pointerdown', () => {
      onTap();
      btn.classList.add('pressed');
    });
    const release = () => btn.classList.remove('pressed');
    btn.addEventListener('pointerup', release);
    btn.addEventListener('pointerleave', release);
    btn.addEventListener('pointercancel', release);
  }
}
