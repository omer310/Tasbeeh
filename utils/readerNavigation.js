function swipePage(page, translationX, total = 604) {
  if (Math.abs(translationX) < 60) return page;
  return Math.max(1, Math.min(total, page + (translationX > 0 ? 1 : -1)));
}
module.exports = { swipePage };
