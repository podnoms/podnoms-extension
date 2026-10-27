# PodNoms browser extension

Lights up when a page has audio, video or links PodNoms can turn into an
episode (YouTube, SoundCloud, Mixcloud, Vimeo… pages and embeds, audio/video
files, and players on the page). Click it to pick what to send and which show
to send it to; PodNoms downloads it in the background like any other link.

Built with [WXT](https://wxt.dev) and React.

## Development

```sh
bun install
bun run dev            # builds .output/chrome-mv3-dev and watches; load it unpacked yourself, and
                       # it reloads itself on changes (through the dev server on port 3100) while this runs
bun run dev:firefox    # .output/firefox-mv2-dev
bun run build          # .output/chrome-mv3, load unpacked from chrome://extensions
bun run zip
bun run compile        # typecheck
bun run test           # vitest
```

## How it talks to PodNoms

It uses the extension API in `podnoms-platform` (`src/routes/api/extension/`):

- `GET /api/extension/podcasts` — the signed-in user's shows
- `POST /api/extension/episodes` — `{ podcastId, sourceUrl, title? }`, adds a link episode

There are no tokens: requests carry the user's PodNoms session cookie, which
the browser sends because the extension has permission for the site. Sign in on
the site as usual. The server address defaults to `https://podnoms.com` and can
be changed from the popup's settings (e.g. `http://localhost:5173` for
development).

Detection lives in `utils/media.ts`; to recognise another site, add it to
`platformItemUrl`.
