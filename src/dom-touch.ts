/**
 * DOM-based touch controls for iPad/tablet.
 * Left: Up/Down buttons | Right: Forward + Boost + Barrel Roll
 */
import { InputManager } from './input';

export class DomTouchControls {
  private root: HTMLElement;

  constructor(input: InputManager) {
    this.root = document.getElementById('touch-controls')!;

    // only show on touch devices
    if (!('ontouchstart' in window)) return;
    this.root.classList.remove('hidden');

    // D-Pad buttons (up/down only)
    const dirs: Record<string, 'touchUp' | 'touchDown'> = {
      up: 'touchUp',
      down: 'touchDown',
    };

    for (const btn of this.root.querySelectorAll<HTMLElement>('.touch-dpad-btn')) {
      const dir = btn.dataset.dir as string;
      const prop = dirs[dir];
      if (!prop) continue;

      btn.addEventListener('pointerdown', () => {
        (input as any)[prop] = true;
        btn.classList.add('pressed');
      });
      const release = () => {
        (input as any)[prop] = false;
        btn.classList.remove('pressed');
      };
      btn.addEventListener('pointerup', release);
      btn.addEventListener('pointerleave', release);
      btn.addEventListener('pointercancel', release);
    }

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
