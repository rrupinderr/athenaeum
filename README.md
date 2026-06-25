# Athenaeum

Next.js gallery for your personal film, TV, and book library.

## Setup

```powershell
cd E:\github\athenaeum
copy .env.local.example .env.local
npm install
```

Ensure `F:\movies\athenaeum.ps1` has been run so `data/library.json` exists.

## Development

```powershell
npm run dev
```

Open [http://localhost:3000/directors](http://localhost:3000/directors).

## Environment

| Variable | Default |
|----------|---------|
| `MEDIA_ROOT` | `F:\movies` |
| `METADATA_ROOT` | `E:\github\athenaeum\data` |
| `SCRIPTS_ROOT` | `F:\movies\_scripts` |

OpenSubtitles/TMDB credentials stay in `F:\movies\_scripts\config.json` only.

## Architecture

- **F:\movies** — media files, sync scripts, rebuild via `athenaeum.ps1`
- **E:\github\athenaeum** — this app + generated metadata in `data/`
