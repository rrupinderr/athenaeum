import { LibraryProvider } from "@/components/LibraryProvider";
import { SeriesDetailPage } from "@/components/SeriesDetailPage";

export default async function TvSeriesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <LibraryProvider>
      <SeriesDetailPage seriesId={decodeURIComponent(id)} />
    </LibraryProvider>
  );
}
