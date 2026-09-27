function locationLabel(address) {
  if (!address) return '';
  const place = address.district || address.city || address.subregion || address.region;
  const region = address.city && address.city !== place ? address.city : address.region;
  return [...new Set([place, region].filter(Boolean))].join(', ');
}
module.exports = { locationLabel };
