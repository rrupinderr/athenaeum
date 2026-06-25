import { LibraryProvider } from "@/components/LibraryProvider";
import { BooksView } from "@/components/BooksView";

export default function BooksPage() {
  return (
    <LibraryProvider>
      <BooksView />
    </LibraryProvider>
  );
}
