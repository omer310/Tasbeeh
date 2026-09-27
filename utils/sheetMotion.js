// Shared handle behavior. Distances are logical pixels, velocity is pixels/ms.
const SHEET_SPRING = { damping: 20, stiffness: 240, mass: 0.8 };
function isHandleDrag({ dx, dy }) {
  return Math.abs(dy) > 6 && Math.abs(dy) > Math.abs(dx) * 1.2;
}
function sheetRevealForDrag(origin, dy, height) {
  // The bottom edge stays fixed. A handle pull changes the revealed height,
  // never translates the bar/sheet and never resets it before dismissal.
  return Math.max(0, Math.min(1, origin - dy / Math.max(1, height)));
}
function sheetHeight({ height, viewport, maximum, header, content, bottom, scrollable }) {
  const requested = typeof height === 'number' ? height
    : typeof height === 'string' && /^\d+(?:\.\d+)?%$/.test(height) ? viewport * parseFloat(height) / 100 : null;
  if (requested !== null) return Math.min(maximum, Math.max(0, requested));
  if (!scrollable || header === null || content === null) return maximum;
  return Math.min(maximum, header + content + bottom + 2);
}
function sheetDismissDirection({ dy, vy }, height) {
  const distance = Math.abs(dy);
  const threshold = Math.min(110, Math.max(60, height * 0.22));
  const flick = distance >= 16 && Math.abs(vy) >= 0.65 && Math.sign(vy) === Math.sign(dy);
  return distance >= threshold || flick ? Math.sign(dy) : 0;
}
module.exports = { SHEET_SPRING, isHandleDrag, sheetRevealForDrag, sheetHeight, sheetDismissDirection };
