const BASE_URL = 'https://openlibrary.org'

export interface OpenLibraryBook {
  key: string
  title: string
  author: string
  coverUrl: string | null
  pageCount: number | null
  genre: string | null
}

export async function searchBooks(query: string): Promise<OpenLibraryBook[]> {
  const encoded = encodeURIComponent(query)
  const url = `${BASE_URL}/search.json?title=${encoded}&limit=10&fields=key,title,author_name,cover_i,number_of_pages_median,subject`

  const res = await fetch(url)
  if (!res.ok) throw new Error('Open Library search failed')

  const data = await res.json() as any

  return (data.docs || []).map((doc: any) => ({
    key: doc.key || null,
    title: doc.title || 'Unknown Title',
    author: doc.author_name?.[0] || 'Unknown Author',
    coverUrl: doc.cover_i
      ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
      : null,
    pageCount: doc.number_of_pages_median || null,
    genre: doc.subject?.[0] || null,
  }))
}
