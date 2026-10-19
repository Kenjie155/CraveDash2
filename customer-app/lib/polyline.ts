// Decodes a Google encoded polyline into map coordinates.
export function decodePolyline(str: string): { latitude: number; longitude: number }[] {
  let i = 0, lat = 0, lng = 0;
  const out: { latitude: number; longitude: number }[] = [];
  while (i < str.length) {
    for (const axis of [0, 1]) {
      let shift = 0, result = 0, b: number;
      do { b = str.charCodeAt(i++) - 63; result |= (b & 31) << shift; shift += 5; } while (b >= 32);
      const d = result & 1 ? ~(result >> 1) : result >> 1;
      if (axis === 0) lat += d; else lng += d;
    }
    out.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return out;
}
