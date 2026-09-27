const { test } = require('node:test');
const assert = require('node:assert/strict');
const { isHandleDrag, sheetRevealForDrag, sheetHeight, sheetDismissDirection } = require('../utils/sheetMotion');

test('the handle ignores tap jitter and horizontal movement before taking a vertical drag', () => {
  assert.equal(isHandleDrag({ dx: 1, dy: 5 }), false);
  assert.equal(isHandleDrag({ dx: 60, dy: 12 }), false);
  assert.equal(isHandleDrag({ dx: 30, dy: 32 }), false);
  assert.equal(isHandleDrag({ dx: 2, dy: 10 }), true);
  assert.equal(isHandleDrag({ dx: 2, dy: -10 }), true);
});

test('small releases spring back; deliberate up/down drags dismiss at phone and tablet sizes', () => {
  for (const height of [180, 436, 900]) {
    for (const sign of [-1, 1]) {
      assert.equal(sheetDismissDirection({ dy: sign * 24, vy: sign * 0.1 }, height), 0);
      assert.equal(sheetDismissDirection({ dy: sign * 115, vy: sign * 0.1 }, height), sign);
    }
  }
});

test('short flicks dismiss in either direction, but jitter and reversed flicks do not', () => {
  for (const sign of [-1, 1]) {
    assert.equal(sheetDismissDirection({ dy: sign * 20, vy: sign * 0.8 }, 500), sign);
    assert.equal(sheetDismissDirection({ dy: sign * 8, vy: sign * 2 }, 500), 0);
    assert.equal(sheetDismissDirection({ dy: sign * 20, vy: -sign * 0.8 }, 500), 0);
  }
});

test('pulling the Quran handle reduces the options height without moving its 56-point base', () => {
  const optionsHeight = 380, base = 56;
  const pulled = sheetRevealForDrag(1, 90, optionsHeight);
  assert.equal(base + optionsHeight * pulled, 346);
  assert.equal(base + optionsHeight * sheetRevealForDrag(1, 500, optionsHeight), base);
  assert.equal(sheetDismissDirection({ dy: 90, vy: 0.8 }, optionsHeight + base), 1);
});

test('grabbing during collapse starts at its current reveal and can reverse without a reset', () => {
  const halfway = 0.5;
  assert.equal(sheetRevealForDrag(halfway, 0, 400), halfway);
  assert.equal(sheetRevealForDrag(halfway, 80, 400), 0.3);
  assert.equal(sheetRevealForDrag(halfway, -80, 400), 0.7);
});

test('large flicks and tiny viewports cannot stretch the card or invert its height', () => {
  for (const height of [0, 40, 436, 900]) {
    assert.equal(sheetRevealForDrag(1, -1000, height), 1);
    assert.equal(sheetRevealForDrag(1, 1000, height), 0);
    assert.ok(Number.isFinite(sheetRevealForDrag(0, 0, height)));
  }
});

test('auto sheets fit measured text and content, with a bound for long lists and keyboards', () => {
  const sizes = { viewport: 800, maximum: 740, header: 96, content: 220, bottom: 24, scrollable: true };
  assert.equal(sheetHeight(sizes), 342);
  assert.equal(sheetHeight({ ...sizes, header: 124 }), 370); // wrapped/translated title
  assert.equal(sheetHeight({ ...sizes, content: 3000 }), 740);
  assert.equal(sheetHeight({ ...sizes, maximum: 280 }), 280); // keyboard/landscape
  assert.equal(sheetHeight({ ...sizes, header: null }), 740); // initial measurement stage
});

test('fixed and percentage sheets resolve against the viewport, independently of the reveal', () => {
  const sizes = { viewport: 800, maximum: 740, header: null, content: null, bottom: 24, scrollable: false };
  assert.equal(sheetHeight({ ...sizes, height: 400 }), 400);
  assert.equal(sheetHeight({ ...sizes, height: '80%' }), 640);
  assert.equal(sheetHeight({ ...sizes, height: '100%' }), 740);
  assert.equal(sheetHeight({ ...sizes, height: '80%', maximum: 280 }), 280);
});
