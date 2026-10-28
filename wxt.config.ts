import { defineConfig } from 'wxt'

// See https://wxt.dev/api/reference/wxt/interfaces/inlineconfig.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  // Dev builds aren't opened in a browser of their own: load .output/chrome-mv3-dev
  // (or firefox-mv2-dev) unpacked in your own, and it reloads as files change.
  webExt: { disabled: true },
  // What the dev build reloads itself from. Not 3000, which the PodNoms dev
  // proxy uses on this machine.
  dev: { server: { port: 3100 } },
  manifest: ({ browser }) => ({
    name: 'PodNoms',
    description: 'Send audio and video from any page to your PodNoms shows.',
    // storage: settings. All sites: finding media on any page, and talking to
    // whichever PodNoms server is configured (with the user's session cookie).
    permissions: ['storage'],
    host_permissions: ['<all_urls>'],
    // Dark until a page has something to send (see entrypoints/background.ts).
    action: {
      default_icon: {
        16: '/icon/idle-16.png',
        32: '/icon/idle-32.png',
        48: '/icon/idle-48.png',
        96: '/icon/idle-96.png',
        128: '/icon/idle-128.png',
      },
    },
    icons: {
      16: '/icon/16.png',
      32: '/icon/32.png',
      48: '/icon/48.png',
      96: '/icon/96.png',
      128: '/icon/128.png',
    },
    // Firefox's add-on store knows the extension by this ID, so it can't change
    // once published. What it sends PodNoms (the links and details of what the
    // user chooses to send) is declared as the store requires.
    ...(browser === 'firefox' && {
      browser_specific_settings: {
        gecko: {
          id: 'extension@podnoms.com',
          strict_min_version: '140.0',
          data_collection_permissions: { required: ['websiteActivity', 'websiteContent'] },
        },
      },
    }),
  }),
})
