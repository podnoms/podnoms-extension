import type { MediaItem } from './media'

// Between the content script, the background and the popup.
export type Message =
  // Content script → background: what the page has, to light up the icon.
  | { type: 'media-found'; count: number }
  // Popup or background → content script: answered with MediaItem[].
  | { type: 'get-media' }

export type GetMediaResponse = MediaItem[]
