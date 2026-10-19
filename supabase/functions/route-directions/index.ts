// Route preview proxy. Keeps the Google Directions key on the server.
// Deploy: supabase functions deploy route-directions
// Secret: supabase secrets set GOOGLE_MAPS_API_KEY=your_key
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const key = Deno.env.get('GOOGLE_MAPS_API_KEY');
  if (!key) return json({ error: 'GOOGLE_MAPS_API_KEY is not set on the server' }, 503);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
  const { origin, destination } = body ?? {};
  const ok = (p: any) => p && Number.isFinite(p.latitude) && Number.isFinite(p.longitude)
    && Math.abs(p.latitude) <= 90 && Math.abs(p.longitude) <= 180;
  if (!ok(origin) || !ok(destination)) return json({ error: 'origin and destination need latitude/longitude' }, 400);

  const url = new URL('https://maps.googleapis.com/maps/api/directions/json');
  url.searchParams.set('origin', `${origin.latitude},${origin.longitude}`);
  url.searchParams.set('destination', `${destination.latitude},${destination.longitude}`);
  url.searchParams.set('key', key);
  const res = await fetch(url);
  const data = await res.json();
  const leg = data?.routes?.[0]?.legs?.[0];
  if (data.status !== 'OK' || !leg) return json({ error: data.error_message ?? data.status ?? 'No route found' }, 502);
  return json({
    polyline: data.routes[0].overview_polyline.points,
    distance_text: leg.distance.text,
    duration_text: leg.duration.text,
  });
});
