/** Keyboard / touch input manager */

export class InputManager {
  keys: Record<string, boolean> = {};
  private onKeyDown: (e: KeyboardEvent) => void;
  private onKeyUp: (e: KeyboardEvent) => void;

  // touch virtual pad state
  touchUp = false;
  touchDown = false;
  touchLeft = false;
  touchRight = false;
  touchBoost = false;
  touchBarrel = false;

  // one-shot flags (consumed after read)
  private _boostPressed = false;
  private _barrelPressed = false;

  constructor() {
    this.onKeyDown = (e: KeyboardEvent) => {
      this.keys[e.code] = true;
      if (e.code === 'Space') this._boostPressed = true;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this._barrelPressed = true;
      e.preventDefault();
    };
    this.onKeyUp = (e: KeyboardEvent) => {
      this.keys[e.code] = false;
    };
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  get up() { return this.keys['ArrowUp'] || this.touchUp; }
  get down() { return this.keys['ArrowDown'] || this.touchDown; }
  get left() { return this.keys['ArrowLeft'] || this.touchLeft; }
  get right() { return this.keys['ArrowRight'] || this.touchRight; }

  consumeBoost(): boolean {
    if (this._boostPressed || this.touchBoost) {
      this._boostPressed = false;
      this.touchBoost = false;
      return true;
    }
    return false;
  }

  consumeBarrel(): boolean {
    if (this._barrelPressed || this.touchBarrel) {
      this._barrelPressed = false;
      this.touchBarrel = false;
      return true;
    }
    return false;
  }

  destroy() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }
}
