// Finds what on a page PodNoms could turn into an episode. PodNoms downloads
// with yt-dlp, so anything it can fetch works: audio and video files, pages on
// the sites it knows (YouTube, SoundCloud, Mixcloud…), and as a last resort
// the page itself when it plays media we can't link to directly (blob: URLs).

export type MediaKind = 'page' | 'audio' | 'video' | 'embed' | 'link'

export interface MediaItem {
  url: string
  kind: MediaKind
  title: string
  // What the page says about it (its og:description and og:image), when it's
  // what the page is about.
  description?: string
  image?: string
  // Where on the page it was found, for the popup.
  source: string
  // A plain audio or video file, which yt-dlp knows nothing about but its
  // name, so the details found for it are sent along.
  isFile: boolean
}

// Links are often numerous (a YouTube home page), so they're capped.
const maxLinks = 50

const audioExtensions = ['mp3', 'm4a', 'aac', 'ogg', 'oga', 'opus', 'wav', 'flac', 'weba']
const videoExtensions = ['mp4', 'm4v', 'webm', 'mov', 'mkv', 'm3u8']

function parseHttpUrl(value: string | null | undefined, base?: string): URL | null {
  if (!value) return null
  try {
    const url = new URL(value.trim(), base)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url : null
  } catch {
    return null
  }
}

const onHost = (host: string, domain: string) => host === domain || host.endsWith(`.${domain}`)

function extensionOf(url: URL) {
  const match = /\.([a-z0-9]{2,5})$/i.exec(url.pathname)
  return match?.[1]?.toLowerCase() ?? null
}

export function fileKind(url: URL): 'audio' | 'video' | null {
  const extension = extensionOf(url)
  if (!extension) return null
  if (audioExtensions.includes(extension)) return 'audio'
  if (videoExtensions.includes(extension)) return 'video'
  return null
}

// SoundCloud and Mixcloud pages that aren't a single track or show.
const soundcloudPages = new Set(['discover', 'stream', 'you', 'search', 'upload', 'charts', 'pages', 'settings', 'messages', 'notifications', 'feed', 'people', 'terms-of-use', 'pro', 'signin'])
const mixcloudPages = new Set(['discover', 'live', 'search', 'upload', 'settings', 'notifications', 'dashboard', 'select', 'pro', 'about', 'categories', 'tag'])
const mixcloudUserTabs = new Set(['uploads', 'favorites', 'listens', 'playlists', 'stream', 'followers', 'following', 'reposts', 'shows', 'stats'])

// A single episode-sized item on a site yt-dlp knows, as a canonical link, or
// null if the URL isn't one (a channel, a search, a home page…).
export function platformItemUrl(url: URL): string | null {
  const host = url.hostname.toLowerCase()
  const segments = url.pathname.split('/').filter(Boolean)

  if (onHost(host, 'youtube.com') || onHost(host, 'youtube-nocookie.com')) {
    const id =
      (segments[0] === 'watch' && url.searchParams.get('v')) ||
      (['shorts', 'live', 'embed', 'v'].includes(segments[0] ?? '') && segments[1])
    return id ? `https://www.youtube.com/watch?v=${id}` : null
  }
  if (host === 'youtu.be') return segments[0] ? `https://www.youtube.com/watch?v=${segments[0]}` : null

  if (onHost(host, 'soundcloud.com') && !host.startsWith('w.') && !host.startsWith('api')) {
    const [user, track] = segments
    if (!user || !track || segments.length !== 2 || soundcloudPages.has(user) || track === 'sets') return null
    if (['tracks', 'albums', 'popular-tracks', 'reposts', 'likes', 'followers', 'following', 'comments'].includes(track)) return null
    return `https://soundcloud.com/${user}/${track}`
  }

  if (onHost(host, 'mixcloud.com')) {
    const [user, show] = segments
    if (!user || !show || segments.length !== 2 || mixcloudPages.has(user) || mixcloudUserTabs.has(show)) return null
    return `https://www.mixcloud.com/${user}/${show}/`
  }

  if (onHost(host, 'vimeo.com')) {
    const id = host === 'player.vimeo.com' ? segments[0] === 'video' && segments[1] : segments.find((s) => /^\d+$/.test(s))
    return id ? `https://vimeo.com/${id}` : null
  }

  if (onHost(host, 'dailymotion.com')) {
    const index = segments.indexOf('video')
    return index >= 0 && segments[index + 1] ? `https://www.dailymotion.com/video/${segments[index + 1]}` : null
  }

  if (onHost(host, 'twitch.tv')) {
    return segments[0] === 'videos' && segments[1] ? `https://www.twitch.tv/videos/${segments[1]}` : null
  }

  if (host.endsWith('.bandcamp.com')) {
    return segments[0] === 'track' && segments[1] ? `${url.origin}/track/${segments[1]}` : null
  }

  if (onHost(host, 'archive.org')) {
    return segments[0] === 'details' && segments[1] ? `https://archive.org/details/${segments[1]}` : null
  }

  if (onHost(host, 'tiktok.com')) {
    return segments[1] === 'video' && segments[2] ? `https://www.tiktok.com/${segments[0]}/video/${segments[2]}` : null
  }

  if (host === 'podcasts.apple.com') {
    return url.searchParams.get('i') ? url.href : null
  }

  return null
}

// What an embedded player (an iframe) is playing.
export function embedItemUrl(url: URL): string | null {
  const host = url.hostname.toLowerCase()
  if (host === 'w.soundcloud.com') {
    const inner = parseHttpUrl(url.searchParams.get('url'))
    return inner?.href ?? null
  }
  if (onHost(host, 'mixcloud.com') && url.pathname.startsWith('/widget/')) {
    const feed = url.searchParams.get('feed')
    if (!feed) return null
    const inner = parseHttpUrl(feed, 'https://www.mixcloud.com')
    return inner && platformItemUrl(inner)
  }
  return platformItemUrl(url)
}

function fileName(url: URL) {
  const last = url.pathname.split('/').filter(Boolean).pop()
  if (!last) return url.hostname
  try {
    return decodeURIComponent(last)
  } catch {
    return last
  }
}

const clean = (text: string | null | undefined) => text?.replace(/\s+/g, ' ').trim() ?? ''

function metaContent(doc: Document, ...names: string[]) {
  for (const name of names) {
    const value = doc.querySelector(`meta[property="${name}"], meta[name="${name}"]`)?.getAttribute('content')
    if (value) return value
  }
  return null
}

export function pageTitle(doc: Document) {
  return clean(metaContent(doc, 'og:title', 'twitter:title')) || clean(doc.title) || doc.location.hostname
}

export interface PageDetails {
  title: string
  description?: string
  image?: string
}

// How the page describes itself in link previews.
export function pageDetails(doc: Document): PageDetails {
  const description = clean(metaContent(doc, 'og:description', 'twitter:description', 'description'))
  const image = parseHttpUrl(metaContent(doc, 'og:image:secure_url', 'og:image', 'og:image:url', 'twitter:image', 'twitter:image:src'), doc.location.href)
  return {
    title: pageTitle(doc),
    ...(description && { description }),
    ...(image && { image: image.href }),
  }
}

// Links to media rarely end in .mp3 (…/episodes/42/audio), so the type the
// page gives for them counts too.
const mediaType = (type: string | null) => !!type && /^(audio|video)\/|mpegurl/i.test(type)

// Everything on the page PodNoms might use: the page itself first, then
// players on it, then links.
export function detectMedia(doc: Document): MediaItem[] {
  const base = doc.location.href
  const items = new Map<string, MediaItem>()
  let links = 0

  function add(url: string, item: Omit<MediaItem, 'url'>) {
    if (items.has(url)) return
    if (item.kind === 'link') {
      if (links >= maxLinks) return
      links++
    }
    items.set(url, { url, ...item })
  }

  const pageUrl = parseHttpUrl(base)
  const details = pageDetails(doc)
  const pageItem = pageUrl && platformItemUrl(pageUrl)
  if (pageItem) add(pageItem, { kind: 'page', ...details, source: 'This page', isFile: false })

  // What the page says it's about, for link previews.
  const shared: { url: URL; kind: 'audio' | 'video'; isFile: boolean }[] = []
  for (const [prefix, kind, names] of [
    ['og:audio', 'audio', ['og:audio', 'og:audio:url', 'og:audio:secure_url']],
    ['og:video', 'video', ['og:video', 'og:video:url', 'og:video:secure_url', 'twitter:player:stream']],
  ] as const) {
    const url = parseHttpUrl(metaContent(doc, ...names), base)
    if (!url) continue
    if (platformItemUrl(url)) shared.push({ url, kind, isFile: false })
    else if (fileKind(url) || mediaType(metaContent(doc, `${prefix}:type`, 'twitter:player:stream:content_type'))) {
      shared.push({ url, kind, isFile: true })
    }
  }
  const sharedFiles = new Set(shared.filter((s) => s.isFile).map((s) => s.url.href))

  // Players on the page. Media streamed in pieces (blob: URLs) can't be linked
  // to, but yt-dlp may well find it from the page.
  let unlinkedPlayer = false
  const players: { url: URL; kind: 'audio' | 'video'; label: string }[] = []
  for (const element of doc.querySelectorAll<HTMLMediaElement>('audio, video')) {
    const kind = element.tagName === 'AUDIO' ? 'audio' : 'video'
    const sources = [element.currentSrc, element.getAttribute('src'), ...[...element.querySelectorAll('source')].map((s) => s.getAttribute('src'))]
    const urls = sources.map((src) => parseHttpUrl(src, base)).filter((url): url is URL => url !== null)
    if (urls.length === 0) {
      if (sources.some(Boolean)) unlinkedPlayer = true
      continue
    }
    players.push({ url: urls[0]!, kind, label: clean(element.getAttribute('title') || element.getAttribute('aria-label')) })
  }
  // The page's details are for what it shares, or its only player: a page of
  // several players is about all of them.
  const isTheMedia = (url: URL) => sharedFiles.has(url.href) || players.length === 1
  for (const { url, kind, label } of players) {
    const about = isTheMedia(url) ? details : null
    add(url.href, {
      kind,
      ...about,
      title: label || about?.title || fileName(url),
      source: kind === 'audio' ? 'Audio player' : 'Video player',
      isFile: true,
    })
  }

  for (const frame of doc.querySelectorAll('iframe[src]')) {
    const url = parseHttpUrl(frame.getAttribute('src'), base)
    const item = url && embedItemUrl(url)
    if (item) add(item, { kind: 'embed', title: clean(frame.getAttribute('title')) || item, source: 'Embedded player', isFile: false })
  }

  for (const { url, kind, isFile } of shared) {
    if (isFile) add(url.href, { kind, ...details, source: 'Shared by the page', isFile })
    else add(platformItemUrl(url)!, { kind: 'embed', ...details, source: 'Shared by the page', isFile })
  }

  if (unlinkedPlayer && pageUrl && !pageItem) {
    add(pageUrl.href, { kind: 'page', ...details, source: 'Plays media on this page', isFile: false })
  }

  for (const anchor of doc.querySelectorAll<HTMLAnchorElement>('a[href]')) {
    const url = parseHttpUrl(anchor.getAttribute('href'), base)
    if (!url) continue
    const label = clean(anchor.getAttribute('title') || anchor.getAttribute('aria-label') || anchor.textContent)
    const kind = fileKind(url)
    if (kind) {
      add(url.href, { kind: 'link', title: label || fileName(url), source: kind === 'audio' ? 'Audio link' : 'Video link', isFile: true })
      continue
    }
    const item = platformItemUrl(url)
    if (item && item !== pageItem) add(item, { kind: 'link', title: label || item, source: 'Link', isFile: false })
  }

  return [...items.values()]
}
