/**
 * DOM-based touch controls for iPad/tablet.
 * D-Pad (left) + Boost & Barrel Roll buttons (right).
 */
import { InputManager } from './input';

export class DomTouchControls {
  private root: HTMLElement;

  constructor(input: InputManager) {
    this.root = document.getElementById('touch-controls')!;

    // only show on touch devices
    if (!('ontouchstart' in window)) return;
    this.root.classList.remove('hidden');

    // D-Pad buttons
    const dirs: Record<string, keyof InputManager> = {
      up: 'touchUp',
      down: 'touchDown',
      left: 'touchLeft',
      right: 'touchRight',
    };

    for (const btn of this.root.querySelectorAll<HTMLElement>('.touch-dpad-btn')) {
      const dir = btn.dataset.dir as string;
      const prop = dirs[dir] as 'touchUp' | 'touchDown' | 'touchLeft' | 'touchRight';
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

    // Boost button
    const boostBtn = document.getElementById('touch-boost')!;
    boostBtn.addEventListener('pointerdown', () => {
      input.touchBoost = true;
      boostBtn.classList.add('pressed');
    });
    const releaseBoost = () => boostBtn.classList.remove('pressed');
    boostBtn.addEventListener('pointerup', releaseBoost);
    boostBtn.addEventListener('pointerleave', releaseBoost);
    boostBtn.addEventListener('pointercancel', releaseBoost);

    // Barrel roll button
    const barrelBtn = document.getElementById('touch-barrel')!;
    barrelBtn.addEventListener('pointerdown', () => {
      input.touchBarrel = true;
      barrelBtn.classList.add('pressed');
    });
    const releaseBarrel = () => barrelBtn.classList.remove('pressed');
    barrelBtn.addEventListener('pointerup', releaseBarrel);
    barrelBtn.addEventListener('pointerleave', releaseBarrel);
    barrelBtn.addEventListener('pointercancel', releaseBarrel);
  }
}
