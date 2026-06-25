export interface Episode {
  label: string;
  path: string;
}

export interface SubtitleInfo {
  has_local: boolean;
  has_embedded: boolean;
  files: string[];
  languages: string[];
  embedded_languages: string[];
  source: "none" | "external" | "embedded" | "both";
}

export interface MediaTitle {
  id: string;
  title: string;
  year?: number | null;
  type: "movie" | "tv";
  genres: string[];
  primary_genre: string;
  directors: string[];
  poster?: string | null;
  overview?: string | null;
  vote_average?: number | null;
  canonical_path: string;
  folder_name: string;
  video_path?: string | null;
  episodes?: Episode[];
  subtitles?: SubtitleInfo;
  tmdb_id?: number | null;
  match_title?: string | null;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  format: string;
  path: string;
  folder_path: string;
  collection: string;
  cover?: string | null;
  cover_file?: string | null;
  readable_in_browser: boolean;
}

export interface IndexBucket<T> {
  count: number;
  titles?: T[];
  books?: Book[];
}

export interface LibraryData {
  app_name: string;
  generated_at: string;
  library_root: string;
  stats: {
    directors: number;
    genres: number;
    titles: number;
    movies: number;
    tv: number;
    books: number;
    with_poster: number;
  };
  directors: Record<string, IndexBucket<MediaTitle>>;
  genres: Record<string, IndexBucket<MediaTitle>>;
  books: {
    count: number;
    authors: Record<string, IndexBucket<Book>>;
  };
}

export interface BookBookmark {
  id: string;
  label: string;
  cfi: string;
  created: string;
}

export interface LibraryState {
  watched: Record<string, boolean>;
  favorites: Record<string, boolean>;
  book_progress?: Record<string, { cfi?: string; page?: number; percent?: number; updated: string }>;
  bookmarks?: Record<string, BookBookmark[]>;
}

export interface FilmographyItem {
  tmdb_id: number;
  title: string;
  year?: number | null;
  poster?: string | null;
  overview?: string | null;
  in_library: boolean;
  search_url: string;
  tmdb_url: string;
  local_id?: string;
  video_path?: string;
}

export interface SubtitleRow {
  index: number;
  fileId: number;
  language: string;
  downloads: number;
  release: string;
  flags: string;
  uploader: string;
}
