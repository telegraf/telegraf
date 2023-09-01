interface Entity {
  /** Type of the entity. Currently, can be “mention” (@username), “hashtag” (#hashtag), “cashtag” ($USD), “bot_command” (/start@jobs_bot), “url” (https://telegram.org), “email” (do-not-reply@telegram.org), “phone_number” (+1-212-555-0123), “bold” (bold text), “italic” (italic text), “underline” (underlined text), “strikethrough” (strikethrough text), “spoiler” (spoiler message), “code” (monowidth string), “pre” (monowidth block), “text_link” (for clickable text URLs), “text_mention” (for users without usernames), “custom_emoji” (for inline custom emoji stickers) */
  type: string
  /** Offset in UTF-16 code units to the start of the entity */
  offset: number
  /** Length of the entity in UTF-16 code units */
  length: number
}

const SINGLE_QUOTE = "'"
const DOUBLE_QUOTE = '"'

export function argsParser(
  str: string,
  entities: Entity[] = [],
  entityOffset = 0
) {
  const mentions: { [offset: string]: number } = {}
  for (const entity of entities) // extract all text_mentions into an { offset: length } map
    if (entity.type === 'text_mention' || entity.type === 'text_link')
      mentions[entity.offset - entityOffset] = entity.length

  const args: string[] = []
  let done = 0
  let inside: `'` | `"` | undefined = undefined
  let buf = ''

  function flush(to: number) {
    if (done !== to) args.push(buf + str.slice(done, to)), (inside = undefined)
    buf = ''
    done = to + 1
  }

  for (let i = 0; i < str.length; i++) {
    const char = str[i]
    // quick lookup length of mention starting at i
    const mention = mentions[i]
    if (mention) {
      // if we're inside a quote, eagerly flush existing state
      flush(i)
      // this also consumes current index, so decrement
      done--
      // fast forward to end of mention
      i += mention
      flush(i)
    } else if (char === SINGLE_QUOTE || char === DOUBLE_QUOTE)
      if (inside)
        if (inside === char) flush(i)
        else continue
      else flush(i), (inside = char)
    else if (char === ' ')
      if (inside) continue
      else flush(i)
    else if (char === '\n') flush(i)
    else if (char === '\\')
      (buf += str.slice(done, i)), (done = ++i) // skip parsing the next char
    else continue
  }

  if (done < str.length) flush(str.length)

  return args
}
