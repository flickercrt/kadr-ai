export type DeviceGeo = { ip: string | null; country: string | null; city: string | null };

function clean(value: unknown) {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text ? text.slice(0, 80) : null;
}

/** Netlify sends x-nf-geo (base64 JSON or JSON), plus x-country. IP comes from the forwarding header. */
export function deviceGeo(header: (name: string) => string | null): DeviceGeo {
  const forwarded = header("x-forwarded-for")?.split(",")[0]?.trim() || header("x-real-ip");
  let country = clean(header("x-country"));
  let city = clean(header("x-city"));
  const raw = header("x-nf-geo");
  if (raw) {
    const parsed = parseNetlifyGeo(raw);
    country = parsed.country ?? country;
    city = parsed.city ?? city;
  }
  return { ip: clean(forwarded), country, city };
}

function parseNetlifyGeo(raw: string): { country: string | null; city: string | null } {
  const candidates = [raw];
  try {
    candidates.push(Buffer.from(raw, "base64").toString("utf8"));
  } catch {
    // Not base64.
  }
  for (const candidate of candidates) {
    try {
      const json = JSON.parse(candidate) as { city?: unknown; country?: { code?: unknown; name?: unknown } | string };
      const country = typeof json.country === "string" ? json.country : json.country?.code || json.country?.name;
      return { country: clean(country), city: clean(json.city) };
    } catch {
      // Try the next shape.
    }
  }
  return { country: null, city: null };
}
