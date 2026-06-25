import { LibraryProvider } from "@/components/LibraryProvider";
import { DirectorsView } from "@/components/DirectorsView";

export default function DirectorsPage() {
  return (
    <LibraryProvider>
      <DirectorsView />
    </LibraryProvider>
  );
}
