// The PodNoms server's extension API (src/routes/api/extension/* in
// podnoms-platform). Requests carry the user's own session cookie, so they
// sign in on the site as usual.
import { storage } from '#imports'

// Production builds use podnoms.com; dev builds take theirs from .env.development.
export const defaultServerUrl: string = import.meta.env.WXT_PODNOMS_URL || 'https://podnoms.com'

export const serverUrlSetting = storage.defineItem<string>('sync:serverUrl', { fallback: defaultServerUrl })
// The podcast last sent to, chosen again next time.
export const lastPodcastSetting = storage.defineItem<string | null>('local:lastPodcastId', { fallback: null })

export interface Podcast {
  id: string
  slug: string
  title: string
  imageUrl: string | null
  url: string
}

export interface CreatedEpisode {
  id: string
  slug: string
}

export class SignedOutError extends Error {
  constructor() {
    super('Sign in to PodNoms first')
  }
}

// The address as typed, tidied: no trailing slash, https:// if left off.
export function normaliseServerUrl(value: string) {
  const trimmed = value.trim().replace(/\/+$/, '')
  const url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`)
  return url.origin
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const server = await serverUrlSetting.getValue()
  let response: Response
  try {
    response = await fetch(`${server}${path}`, { ...init, credentials: 'include' })
  } catch {
    throw new Error(`Couldn't reach ${new URL(server).host}`)
  }
  if (response.status === 401) throw new SignedOutError()
  if (response.status === 404 && path === '/api/extension/podcasts') {
    throw new Error(`${new URL(server).host} doesn't have the extension API yet`)
  }
  if (!response.ok) {
    const text = await response.text().catch(() => '')
    // An HTML error page says nothing useful in a popup.
    throw new Error(text && !text.trimStart().startsWith('<') ? text : `PodNoms answered ${response.status}`)
  }
  return response.json() as Promise<T>
}

export function fetchPodcasts() {
  return request<Podcast[]>('/api/extension/podcasts')
}

// What the page says about it, for sources yt-dlp can't tell PodNoms about.
export interface EpisodeDetails {
  title?: string
  description?: string
  imageUrl?: string
}

export function sendEpisode(podcastId: string, sourceUrl: string, details: EpisodeDetails = {}) {
  return request<CreatedEpisode>('/api/extension/episodes', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ podcastId, sourceUrl, ...details }),
  })
}
