import { useEffect, useState } from 'react'
import type { MediaItem } from '@/utils/media'
import type { GetMediaResponse, Message } from '@/utils/messages'
import {
  fetchPodcasts,
  lastPodcastSetting,
  normaliseServerUrl,
  type Podcast,
  sendEpisode,
  serverUrlSetting,
  SignedOutError,
} from '@/utils/podnoms'
import { ShowPicker } from './show-picker'

type Load<T> = { state: 'loading' } | { state: 'ready'; value: T } | { state: 'error'; error: Error }

type SendStatus = { state: 'sending' } | { state: 'sent' } | { state: 'failed'; message: string }

const kindLabels: Record<MediaItem['kind'], string> = {
  page: 'Page',
  audio: 'Audio',
  video: 'Video',
  embed: 'Player',
  link: 'Link',
}

// What the active tab has, from its content script. Tabs opened before the
// extension was installed don't have one until they're reloaded, and the
// browser's own pages never do.
async function loadMedia(): Promise<{ items: MediaItem[]; tab: Browser.tabs.Tab }> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true })
  if (!tab?.id) throw new Error('No tab to look at')
  try {
    const items = (await browser.tabs.sendMessage(tab.id, { type: 'get-media' } satisfies Message)) as GetMediaResponse
    return { items, tab }
  } catch {
    throw new Error("PodNoms can't look at this page. If it was open before PodNoms was installed, reload it.")
  }
}

// Offered when nothing was found: yt-dlp knows far more sites than we do.
function pageFallback(tab: Browser.tabs.Tab): MediaItem | null {
  if (!tab.url || !/^https?:/.test(tab.url)) return null
  return { url: tab.url, kind: 'page', title: tab.title || tab.url, source: 'Try the page itself', isFile: false }
}

// Cut to what PodNoms takes. An image it can't fetch is left out there.
function episodeDetails(item: MediaItem) {
  return {
    title: item.title.slice(0, 200),
    description: item.description?.slice(0, 4000),
    imageUrl: item.image && item.image.length <= 2000 ? item.image : undefined,
  }
}

export default function App() {
  const [media, setMedia] = useState<Load<{ items: MediaItem[]; fallback: MediaItem | null }>>({ state: 'loading' })
  const [podcasts, setPodcasts] = useState<Load<Podcast[]>>({ state: 'loading' })
  const [podcastId, setPodcastId] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [statuses, setStatuses] = useState<Record<string, SendStatus>>({})
  const [serverUrl, setServerUrl] = useState('')
  const [showSettings, setShowSettings] = useState(false)

  function loadPodcasts() {
    setPodcasts({ state: 'loading' })
    Promise.all([fetchPodcasts(), lastPodcastSetting.getValue()]).then(
      ([list, lastId]) => {
        setPodcasts({ state: 'ready', value: list })
        setPodcastId(list.find((p) => p.id === lastId)?.id ?? list[0]?.id ?? '')
      },
      (error: Error) => setPodcasts({ state: 'error', error }),
    )
  }

  useEffect(() => {
    void serverUrlSetting.getValue().then(setServerUrl)
    loadPodcasts()
    loadMedia().then(
      ({ items, tab }) => {
        setMedia({ state: 'ready', value: { items, fallback: items.length ? null : pageFallback(tab) } })
        // The likeliest choice: the page itself, or else the first player.
        if (items[0]) setSelected(new Set([items[0].url]))
      },
      (error: Error) => setMedia({ state: 'error', error }),
    )
  }, [])

  const items = media.state === 'ready' ? [...media.value.items, ...(media.value.fallback ? [media.value.fallback] : [])] : []
  const podcast = podcasts.state === 'ready' ? podcasts.value.find((p) => p.id === podcastId) : undefined
  const sending = Object.values(statuses).some((s) => s.state === 'sending')
  const toSend = items.filter((item) => selected.has(item.url) && statuses[item.url]?.state !== 'sent')

  function toggle(url: string) {
    setSelected((current) => {
      const next = new Set(current)
      if (!next.delete(url)) next.add(url)
      return next
    })
  }

  async function send() {
    if (!podcast) return
    void lastPodcastSetting.setValue(podcast.id)
    // One at a time, so they're added (and queued) in the order listed.
    for (const item of toSend) {
      setStatuses((s) => ({ ...s, [item.url]: { state: 'sending' } }))
      try {
        await sendEpisode(podcast.id, item.url, item.isFile ? episodeDetails(item) : undefined)
        setStatuses((s) => ({ ...s, [item.url]: { state: 'sent' } }))
      } catch (error) {
        if (error instanceof SignedOutError) setPodcasts({ state: 'error', error })
        setStatuses((s) => ({ ...s, [item.url]: { state: 'failed', message: (error as Error).message } }))
      }
    }
  }

  async function saveServer(event: React.FormEvent) {
    event.preventDefault()
    try {
      const url = normaliseServerUrl(serverUrl)
      await serverUrlSetting.setValue(url)
      setServerUrl(url)
      setShowSettings(false)
      loadPodcasts()
    } catch {
      // Left open for them to correct.
    }
  }

  const openSite = (path = '') => {
    void browser.tabs.create({ url: `${serverUrl}${path}` })
    window.close()
  }

  return (
    <main>
      <header>
        <img src="/icon/48.png" alt="" width={24} height={24} />
        <h1>Send to PodNoms</h1>
        <button type="button" className="icon-button" title="Settings" onClick={() => setShowSettings((v) => !v)}>
          ⚙
        </button>
      </header>

      {showSettings && (
        <form className="settings" onSubmit={saveServer}>
          <label htmlFor="server">PodNoms address</label>
          <div className="row">
            <input id="server" value={serverUrl} onChange={(e) => setServerUrl(e.target.value)} placeholder="https://podnoms.com" />
            <button type="submit">Save</button>
          </div>
        </form>
      )}

      <section>
        <label htmlFor="podcast">Show</label>
        {podcasts.state === 'loading' && <p className="muted">Loading your shows…</p>}
        {podcasts.state === 'error' &&
          (podcasts.error instanceof SignedOutError ? (
            <div className="notice">
              <p>Sign in to PodNoms to send things to your shows.</p>
              <button type="button" onClick={() => openSite('/login')}>
                Sign in
              </button>
            </div>
          ) : (
            <div className="notice error">
              <p>{podcasts.error.message}</p>
              <button type="button" onClick={loadPodcasts}>
                Try again
              </button>
            </div>
          ))}
        {podcasts.state === 'ready' &&
          (podcasts.value.length ? (
            <ShowPicker id="podcast" podcasts={podcasts.value} value={podcastId} onChange={setPodcastId} />
          ) : (
            <div className="notice">
              <p>You don't have any shows yet.</p>
              <button type="button" onClick={() => openSite()}>
                Create one
              </button>
            </div>
          ))}
      </section>

      <section>
        <h2>On this page</h2>
        {media.state === 'loading' && <p className="muted">Looking…</p>}
        {media.state === 'error' && <p className="muted">{media.error.message}</p>}
        {media.state === 'ready' && media.value.items.length === 0 && (
          <p className="muted">Nothing PodNoms knows how to use was found here.</p>
        )}
        {items.length > 0 && (
          <ul className="items">
            {items.map((item) => {
              const status = statuses[item.url]
              return (
                <li key={item.url}>
                  <label>
                    <input
                      type="checkbox"
                      checked={selected.has(item.url)}
                      disabled={status?.state === 'sent' || sending}
                      onChange={() => toggle(item.url)}
                    />
                    {item.image && <img className="item-image" src={item.image} alt="" width={40} height={40} />}
                    <span className="item">
                      <span className="item-title">
                        <span className={`kind kind-${item.kind}`}>{kindLabels[item.kind]}</span>
                        {item.title}
                      </span>
                      {item.description && (
                        <span className="item-description" title={item.description}>
                          {item.description}
                        </span>
                      )}
                      <span className="item-url" title={item.url}>
                        {item.source} · {item.url}
                      </span>
                      {status?.state === 'sending' && <span className="status">Sending…</span>}
                      {status?.state === 'sent' && <span className="status sent">Added to {podcast?.title}</span>}
                      {status?.state === 'failed' && <span className="status failed">{status.message}</span>}
                    </span>
                  </label>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <footer>
        {Object.values(statuses).some((s) => s.state === 'sent') && podcast && (
          <button type="button" className="link-button" onClick={() => openSite(new URL(podcast.url).pathname)}>
            Open {podcast.title}
          </button>
        )}
        <button type="button" className="primary" disabled={!podcast || toSend.length === 0 || sending} onClick={send}>
          {sending ? 'Sending…' : toSend.length > 1 ? `Send ${toSend.length} to PodNoms` : 'Send to PodNoms'}
        </button>
      </footer>
    </main>
  )
}
