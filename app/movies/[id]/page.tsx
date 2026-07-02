import { LibraryProvider } from "@/components/LibraryProvider";
import { MovieCollectionPage } from "@/components/MovieCollectionPage";

export default async function MovieCollectionRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <LibraryProvider>
      <MovieCollectionPage movieId={decodeURIComponent(id)} />
    </LibraryProvider>
  );
}
