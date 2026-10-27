// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest'
import { detectMedia, embedItemUrl, platformItemUrl } from '@/utils/media'

const item = (url: string) => platformItemUrl(new URL(url))

describe('platformItemUrl', () => {
  it('recognises single videos and tracks, canonically', () => {
    expect(item('https://www.youtube.com/watch?v=abc&t=10')).toBe('https://www.youtube.com/watch?v=abc')
    expect(item('https://youtu.be/abc')).toBe('https://www.youtube.com/watch?v=abc')
    expect(item('https://m.youtube.com/shorts/abc')).toBe('https://www.youtube.com/watch?v=abc')
    expect(item('https://soundcloud.com/artist/track-name?in=x')).toBe('https://soundcloud.com/artist/track-name')
    expect(item('https://www.mixcloud.com/dj/the-show/')).toBe('https://www.mixcloud.com/dj/the-show/')
    expect(item('https://vimeo.com/12345')).toBe('https://vimeo.com/12345')
    expect(item('https://artist.bandcamp.com/track/song')).toBe('https://artist.bandcamp.com/track/song')
  })

  it("ignores pages that aren't a single item", () => {
    expect(item('https://www.youtube.com/')).toBeNull()
    expect(item('https://www.youtube.com/@channel')).toBeNull()
    expect(item('https://soundcloud.com/discover/sets')).toBeNull()
    expect(item('https://soundcloud.com/artist/sets')).toBeNull()
    expect(item('https://soundcloud.com/artist')).toBeNull()
    expect(item('https://www.mixcloud.com/dj/uploads/')).toBeNull()
    expect(item('https://example.com/watch?v=abc')).toBeNull()
  })
})

describe('embedItemUrl', () => {
  it('finds what embedded players play', () => {
    expect(embedItemUrl(new URL('https://www.youtube-nocookie.com/embed/abc?rel=0'))).toBe('https://www.youtube.com/watch?v=abc')
    expect(embedItemUrl(new URL('https://player.vimeo.com/video/42'))).toBe('https://vimeo.com/42')
    expect(
      embedItemUrl(new URL('https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/123')),
    ).toBe('https://api.soundcloud.com/tracks/123')
    expect(embedItemUrl(new URL('https://www.mixcloud.com/widget/iframe/?feed=%2Fdj%2Fthe-show%2F'))).toBe(
      'https://www.mixcloud.com/dj/the-show/',
    )
  })
})

describe('detectMedia', () => {
  beforeEach(() => {
    document.head.innerHTML = ''
    document.body.innerHTML = ''
    document.title = 'A page'
  })

  it('finds nothing on a page without media', () => {
    document.body.innerHTML = '<p>Hello</p><a href="/about">About</a>'
    expect(detectMedia(document)).toEqual([])
  })

  it('finds players, embeds, shared media and media links, deduplicated', () => {
    document.head.innerHTML = '<title>A page</title><meta property="og:audio" content="https://cdn.example.com/ep1.mp3">'
    document.body.innerHTML = `
      <audio src="https://cdn.example.com/ep1.mp3"></audio>
      <video><source src="/clip.mp4"></video>
      <iframe src="https://www.youtube.com/embed/xyz" title="A talk"></iframe>
      <a href="https://cdn.example.com/ep2.m4a">Episode 2: The sequel</a>
      <a href="https://youtu.be/xyz">Same video</a>
      <a href="https://soundcloud.com/a/b">A track</a>
      <a href="/page.html">Not media</a>
    `
    const found = detectMedia(document).map(({ url, kind, title, isFile }) => ({ url, kind, title, isFile }))
    expect(found).toEqual([
      // The player plays what the page shares, so it takes the page's title.
      { url: 'https://cdn.example.com/ep1.mp3', kind: 'audio', title: 'A page', isFile: true },
      { url: `${location.origin}/clip.mp4`, kind: 'video', title: 'clip.mp4', isFile: true },
      { url: 'https://www.youtube.com/watch?v=xyz', kind: 'embed', title: 'A talk', isFile: false },
      { url: 'https://cdn.example.com/ep2.m4a', kind: 'link', title: 'Episode 2: The sequel', isFile: true },
      { url: 'https://soundcloud.com/a/b', kind: 'link', title: 'A track', isFile: false },
    ])
  })

  it("uses the page's details for what it shares, even without a file extension", () => {
    document.head.innerHTML = `
      <meta property="og:title" content="Eine Kleine Nachtnoodle">
      <meta property="og:description" content="Late night boogie.">
      <meta property="og:image" content="https://podnoms.com/images/art.jpg?og">
      <meta property="og:audio" content="https://podnoms.com/api/episodes/42/audio">
      <meta property="og:audio:type" content="audio/mpeg">
    `
    expect(detectMedia(document)).toEqual([
      {
        url: 'https://podnoms.com/api/episodes/42/audio',
        kind: 'audio',
        title: 'Eine Kleine Nachtnoodle',
        description: 'Late night boogie.',
        image: 'https://podnoms.com/images/art.jpg?og',
        source: 'Shared by the page',
        isFile: true,
      },
    ])

    // Its player, found first, is named for the page rather than "audio".
    document.body.innerHTML = '<audio src="https://podnoms.com/api/episodes/42/audio"></audio>'
    expect(detectMedia(document)).toMatchObject([
      { title: 'Eine Kleine Nachtnoodle', description: 'Late night boogie.', source: 'Audio player' },
    ])
  })

  it("doesn't take links without a media type or extension for media", () => {
    document.head.innerHTML = '<meta property="og:audio" content="https://example.com/player">'
    expect(detectMedia(document)).toEqual([])
  })

  it("gives a page's only player its details, but not one of several", () => {
    document.head.innerHTML = '<meta property="og:title" content="The show"><meta property="og:image" content="/art.jpg">'
    document.body.innerHTML = '<audio src="/stream"></audio>'
    expect(detectMedia(document)).toMatchObject([{ title: 'The show', image: `${location.origin}/art.jpg` }])

    document.body.innerHTML = '<audio src="/one.mp3"></audio><audio src="/two.mp3"></audio>'
    const found = detectMedia(document)
    expect(found.map((item) => item.title)).toEqual(['one.mp3', 'two.mp3'])
    expect(found.every((item) => !item.image)).toBe(true)
  })

  it('offers the page itself when its player streams from a blob', () => {
    document.body.innerHTML = '<video src="blob:https://example.com/123"></video>'
    expect(detectMedia(document)).toEqual([
      { url: location.href, kind: 'page', title: 'A page', source: 'Plays media on this page', isFile: false },
    ])
  })
})
