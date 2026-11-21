/**
 * The canvas only redraws when something on it changed: the backdrop refreshed, or a photo plane moved,
 * faded or animated. A still page costs a cheap composite at the backdrop's rate instead of a full redraw
 * at the display's refresh rate.
 */
export const frameGate = { dirty: true, renders: 0 };
export function markDirty() {
  frameGate.dirty = true;
}
