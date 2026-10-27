import { describe, expect, it } from 'vitest'
import { matchShows } from '@/entrypoints/popup/show-picker'

const shows = ['Heavy Metal Live', 'Brent’s American Trad Rock Hour', 'Café Sessions', 'Live Wires'].map((title, i) => ({
  id: String(i),
  slug: String(i),
  title,
  imageUrl: null,
  url: '',
}))
const titles = (query: string) => matchShows(shows, query).map((s) => s.title)

describe('matchShows', () => {
  it('lists every show for an empty search', () => {
    expect(titles('  ')).toHaveLength(4)
  })

  it('puts titles starting with the search first, then words, then anywhere', () => {
    expect(titles('live')).toEqual(['Live Wires', 'Heavy Metal Live'])
    expect(titles('ock')).toEqual(['Brent’s American Trad Rock Hour'])
  })

  it('ignores case and accents', () => {
    expect(titles('CAFE')).toEqual(['Café Sessions'])
  })
})
