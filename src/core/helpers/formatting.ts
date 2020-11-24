import { MessageEntity } from '../../telegram-types'

// functions for HTML tag escaping based on https://stackoverflow.com/a/5499821/
const tagsToEscape = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
}
function escapeTag(tag: string): string {
  return tagsToEscape[tag as '&' | '<' | '>'] ?? tag
}
function escapeHTML(str: string): string {
  return str.replace(/[&<>]/g, escapeTag)
}

export function formatHTML(text = '', entities: MessageEntity[] = []) {
  const chars = text
  const available = [...entities]
  const opened: MessageEntity[] = []
  const result: string[] = []
  for (let offset = 0; offset < chars.length; offset++) {
    let index: number
    while (
      (index = available.findIndex((entity) => entity.offset === offset)) >= 0
    ) {
      const entity = available[index]
      switch (entity.type) {
        case 'bold':
          result.push('<b>')
          break
        case 'italic':
          result.push('<i>')
          break
        case 'code':
          result.push('<code>')
          break
        case 'pre':
          if (entity.language !== undefined) {
            result.push(`<pre><code class="language-${entity.language}">`)
          } else {
            result.push('<pre>')
          }
          break
        case 'strikethrough':
          result.push('<s>')
          break
        case 'underline':
          result.push('<u>')
          break
        case 'text_mention':
          result.push(`<a href="tg://user?id=${entity.user.id}">`)
          break
        case 'text_link':
          result.push(`<a href="${entity.url}">`)
          break
      }
      opened.unshift(entity)
      available.splice(index, 1)
    }

    result.push(escapeHTML(chars[offset]))

    while (
      (index = opened.findIndex(
        (entity) => entity.offset + entity.length - 1 === offset
      )) >= 0
    ) {
      const entity = opened[index]
      switch (entity.type) {
        case 'bold':
          result.push('</b>')
          break
        case 'italic':
          result.push('</i>')
          break
        case 'code':
          result.push('</code>')
          break
        case 'pre':
          if (entity.language !== undefined) {
            result.push('</code></pre>')
          } else {
            result.push('</pre>')
          }
          break
        case 'strikethrough':
          result.push('</s>')
          break
        case 'underline':
          result.push('</u>')
          break
        case 'text_mention':
        case 'text_link':
          result.push('</a>')
          break
      }
      opened.splice(index, 1)
    }
  }
  return result.join('')
}
