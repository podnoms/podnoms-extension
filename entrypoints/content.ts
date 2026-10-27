import { detectMedia } from '@/utils/media'
import type { Message } from '@/utils/messages'

// Watches the page for media, telling the background how much there is (for
// the icon) and the popup what it is.
export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',
  main(ctx) {
    let lastCount = -1
    let timer: ReturnType<typeof setTimeout> | undefined

    function report() {
      const count = detectMedia(document).length
      if (count === lastCount) return
      lastCount = count
      browser.runtime.sendMessage({ type: 'media-found', count } satisfies Message).catch(() => {})
    }

    // Pages add players and links as they go (and single-page apps change
    // completely), so look again once they settle.
    function scheduleReport() {
      clearTimeout(timer)
      timer = setTimeout(report, 750)
    }

    browser.runtime.onMessage.addListener((message: Message, _sender, sendResponse) => {
      if (message.type !== 'get-media') return
      sendResponse(detectMedia(document))
    })

    const observer = new MutationObserver(scheduleReport)
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src', 'href'],
    })
    ctx.onInvalidated(() => {
      observer.disconnect()
      clearTimeout(timer)
    })
    ctx.addEventListener(window, 'wxt:locationchange', () => {
      lastCount = -1
      scheduleReport()
    })

    report()
  },
})
