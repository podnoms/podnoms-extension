import { useEffect, useMemo, useRef, useState } from 'react'
import type { Podcast } from '@/utils/podnoms'

// Case and accents don't matter when searching.
const fold = (text: string) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

// The shows matching what's typed: those whose title (or a word in it) starts
// with it first, then any containing it.
export function matchShows(podcasts: Podcast[], query: string) {
  const q = fold(query.trim())
  if (!q) return podcasts
  const rank = (title: string) => {
    const folded = fold(title)
    if (folded.startsWith(q)) return 0
    if (folded.split(/\s+/).some((word) => word.startsWith(q))) return 1
    return folded.includes(q) ? 2 : -1
  }
  return podcasts
    .map((podcast) => ({ podcast, rank: rank(podcast.title) }))
    .filter(({ rank }) => rank >= 0)
    .sort((a, b) => a.rank - b.rank)
    .map(({ podcast }) => podcast)
}

// The title with the part matching the search marked.
function Highlighted({ title, query }: { title: string; query: string }) {
  const q = fold(query.trim())
  // Folding can change lengths (é → e + accent removed), so find the match in
  // the folded title character by character.
  const folded = [...title].map((char) => fold(char))
  const start = q ? folded.findIndex((_, i) => folded.slice(i).join('').startsWith(q)) : -1
  if (start < 0) return <>{title}</>
  let end = start
  let length = 0
  while (end < folded.length && length < q.length) length += folded[end++]!.length
  const chars = [...title]
  return (
    <>
      {chars.slice(0, start).join('')}
      <mark>{chars.slice(start, end).join('')}</mark>
      {chars.slice(end).join('')}
    </>
  )
}

function Artwork({ podcast }: { podcast?: Podcast }) {
  return podcast?.imageUrl ? (
    <img className="artwork" src={podcast.imageUrl} alt="" width={20} height={20} />
  ) : (
    <span className="artwork" />
  )
}

interface Props {
  id: string
  podcasts: Podcast[]
  value: string
  onChange: (id: string) => void
}

// A searchable list of the user's shows (a combobox), as a plain select gets
// unwieldy with dozens of them.
export function ShowPicker({ id, podcasts, value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const listRef = useRef<HTMLUListElement>(null)
  const selected = podcasts.find((p) => p.id === value)
  const matches = useMemo(() => matchShows(podcasts, query), [podcasts, query])

  function openList() {
    if (open) return
    setOpen(true)
    setQuery('')
    setActive(Math.max(0, podcasts.findIndex((p) => p.id === value)))
  }

  function choose(podcast: Podcast | undefined) {
    if (podcast) onChange(podcast.id)
    setOpen(false)
    setQuery('')
  }

  useEffect(() => {
    if (open) listRef.current?.children[active]?.scrollIntoView({ block: 'nearest' })
  }, [open, active])

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        event.preventDefault()
        if (!open) return openList()
        const step = event.key === 'ArrowDown' ? 1 : -1
        setActive((i) => (matches.length ? (i + step + matches.length) % matches.length : 0))
        break
      }
      case 'Enter':
        if (open) {
          event.preventDefault()
          choose(matches[active])
        }
        break
      case 'Escape':
        // Closes the list rather than the whole popup.
        if (open) {
          event.preventDefault()
          choose(undefined)
        }
        break
    }
  }

  const listId = `${id}-list`
  return (
    <div className="show-picker">
      <div className="show-input">
        <Artwork podcast={open ? undefined : selected} />
        <input
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && matches[active] ? `${listId}-${matches[active].id}` : undefined}
          autoComplete="off"
          spellCheck={false}
          placeholder={open ? 'Search your shows…' : 'Choose a show'}
          value={open ? query : (selected?.title ?? '')}
          onChange={(event) => {
            setQuery(event.target.value)
            setActive(0)
            setOpen(true)
          }}
          onFocus={(event) => event.target.select()}
          onClick={openList}
          onKeyDown={onKeyDown}
          onBlur={() => choose(undefined)}
        />
        <span className="chevron" aria-hidden>
          ▾
        </span>
      </div>
      {open && (
        <ul id={listId} role="listbox" className="show-list" ref={listRef}>
          {matches.length === 0 && <li className="muted empty">No shows match “{query}”</li>}
          {matches.map((podcast, index) => (
            <li
              key={podcast.id}
              id={`${listId}-${podcast.id}`}
              role="option"
              aria-selected={podcast.id === value}
              className={index === active ? 'active' : undefined}
              // Before the input's blur, which would close the list first.
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setActive(index)}
              onClick={() => choose(podcast)}
            >
              <Artwork podcast={podcast} />
              <span className="show-title">
                <Highlighted title={podcast.title} query={query} />
              </span>
              {podcast.id === value && <span aria-hidden>✓</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
