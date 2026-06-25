import { BookReaderPage } from "@/components/BookReaderPage";

export default async function ReadBookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <BookReaderPage bookId={decodeURIComponent(id)} />;
}
