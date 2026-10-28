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
- `POST /api/extension/episodes` — `{ podcastId, sourceUrl, title?, description?, imageUrl? }`, adds a link episode

There are no tokens: requests carry the user's PodNoms session cookie, which
the browser sends because the extension has permission for the site. Sign in on
the site as usual. The server address defaults to `https://podnoms.com` and can
be changed from the popup's settings (e.g. `http://localhost:5173` for
development).

Detection lives in `utils/media.ts`; to recognise another site, add it to
`platformItemUrl`.

## Releasing

`.github/workflows/release.yml` builds both browsers' zips and submits them to
the Chrome Web Store and Firefox Add-ons (with `wxt submit`) whenever a tag is pushed:

```sh
# bump "version" in package.json, commit, then
git tag v0.2.0 && git push origin v0.2.0
```

The tag must match package.json's version. The zips are also attached to a
GitHub release. Run the workflow by hand (Actions → Release → Run workflow) for
a dry run that only checks the stores' credentials.

### One-time setup

The first version has to be uploaded to each store by hand. The workflow only
updates an existing listing.

**Chrome Web Store:** upload `.output/podnoms-extension-*-chrome.zip` in the
[developer dashboard](https://chrome.google.com/webstore/devconsole) and fill in
the listing. Then create a Google Cloud service account, enable the Chrome Web
Store API, and add the service account's email under the dashboard's
*Account → Service accounts*. In the repo's settings
(*Secrets and variables → Actions*), add:

- variable `CHROME_EXTENSION_ID`: the extension's ID from the dashboard
- variable `CHROME_PUBLISHER_ID`: your publisher ID from the dashboard
- secret `CHROME_SERVICE_ACCOUNT_CLIENT_EMAIL`: the service account's email
- secret `CHROME_SERVICE_ACCOUNT_PRIVATE_KEY`: the `private_key` from its JSON key

**Firefox Add-ons:** submit `.output/podnoms-extension-*-firefox.zip` (and the
`-sources.zip`, since the code is bundled) at
[addons.mozilla.org](https://addons.mozilla.org/developers/). The add-on ID
`extension@podnoms.com` is set in `wxt.config.ts` and can't change once published.
Create API credentials under *Tools → Manage API Keys* and add:

- secret `FIREFOX_JWT_ISSUER`: the JWT issuer
- secret `FIREFOX_JWT_SECRET`: the JWT secret

`bunx wxt submit init` walks through getting these interactively.
