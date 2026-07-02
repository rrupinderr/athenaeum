import { NextRequest, NextResponse } from "next/server";

const TMDB_BASE = "https://api.themoviedb.org/3";

interface CreditPerson {
  name?: string;
  job?: string;
  character?: string;
  order?: number;
}

export async function GET(req: NextRequest) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "TMDB_API_KEY is not configured" }, { status: 429 });
  }

  const tmdbId = req.nextUrl.searchParams.get("tmdb_id");
  const type = req.nextUrl.searchParams.get("type") || "movie";

  if (!tmdbId || !/^\d+$/.test(tmdbId)) {
    return NextResponse.json({ directors: [], cast: [] });
  }

  try {
    const path =
      type === "tv"
        ? `${TMDB_BASE}/tv/${tmdbId}/aggregate_credits?api_key=${apiKey}`
        : `${TMDB_BASE}/movie/${tmdbId}/credits?api_key=${apiKey}`;

    const res = await fetch(path, { next: { revalidate: 86400 } });
    if (!res.ok) return NextResponse.json({ directors: [], cast: [] });

    const data = await res.json();
    const crew: CreditPerson[] = data.crew || [];
    const castList: CreditPerson[] = data.cast || [];

    const directors = crew
      .filter((c) => c.job === "Director")
      .map((c) => c.name || "")
      .filter(Boolean);

    const cast = castList
      .sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
      .slice(0, 6)
      .map((c) => c.name || "")
      .filter(Boolean);

    return NextResponse.json({ directors, cast });
  } catch {
    return NextResponse.json({ error: "Failed to load credits" }, { status: 502 });
  }
}
