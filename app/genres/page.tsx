import { LibraryProvider } from "@/components/LibraryProvider";
import { GenresView } from "@/components/DirectorsView";

export default function GenresPage() {
  return (
    <LibraryProvider>
      <GenresView />
    </LibraryProvider>
  );
}
