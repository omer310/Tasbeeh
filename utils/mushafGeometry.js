function mushafGeometry(rows, width, height, zoom) {
  const widest = Math.max(1, ...rows.filter(([, kind]) => kind === 'text').map(([, , words]) => words.reduce((sum, w) => sum + w[4], 0) + (words.length - 1) * 0.25));
  const availableWidth = Math.max(100, Math.min(820, width - 32));
  const widthSize = availableWidth / (widest + 0.8);
  const fit = Math.min(40, widthSize, Math.max(1, height - 76) / (rows.length * 1.95 + 1));
  const scroll = zoom || fit < 14;
  const size = (scroll ? Math.min(36, widthSize) : fit) * (zoom ? 1.65 : 1);
  return { scroll, size, pageWidth: zoom ? Math.max(availableWidth, (widest + 0.8) * size) : availableWidth,
    contentHeight: size * (rows.length * 1.95 + 0.5) };
}
module.exports = { mushafGeometry };
