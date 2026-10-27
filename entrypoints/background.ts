import type { GetMediaResponse, Message } from '@/utils/messages'

const iconSizes = [16, 32, 48, 96, 128] as const
const icons = (prefix: string) => Object.fromEntries(iconSizes.map((size) => [size, `/icon/${prefix}${size}.png`]))

// Lights the toolbar icon on tabs with something PodNoms can use, with how
// many things as its badge.
async function showCount(tabId: number, count: number) {
  const action = browser.action ?? browser.browserAction
  await Promise.all([
    action.setIcon({ tabId, path: icons(count > 0 ? '' : 'idle-') }),
    action.setBadgeText({ tabId, text: count > 0 ? (count > 99 ? '99+' : String(count)) : '' }),
  ]).catch(() => {
    // The tab closed meanwhile.
  })
}

export default defineBackground(() => {
  const action = browser.action ?? browser.browserAction
  action.setBadgeBackgroundColor({ color: '#2563eb' })

  browser.runtime.onMessage.addListener((message: Message, sender) => {
    if (message.type === 'media-found' && sender.tab?.id !== undefined) void showCount(sender.tab.id, message.count)
  })

  // A new page starts dark until its content script says otherwise (and pages
  // where none runs, such as the browser's own, stay dark). Once it has
  // loaded, ask again, as the content script only reports changes.
  browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.status === 'loading') void showCount(tabId, 0)
    if (changeInfo.status === 'complete') {
      browser.tabs
        .sendMessage(tabId, { type: 'get-media' } satisfies Message)
        .then((items: GetMediaResponse) => showCount(tabId, items.length))
        .catch(() => {})
    }
  })
})
