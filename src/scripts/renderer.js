const editor = document.getElementById('editor')
const filenameEl = document.getElementById('filename')

let currentFile = null
let isRendering = false

/* ── Cursor position helpers ── */

function getCursorOffset() {
  const sel = window.getSelection()
  if (!sel.rangeCount) return 0
  const range = sel.getRangeAt(0)
  const pre = document.createRange()
  pre.selectNodeContents(editor)
  pre.setEnd(range.startContainer, range.startOffset)
  return pre.toString().length
}

function setCursorOffset(offset) {
  const total = editor.textContent.length
  if (offset > total) offset = total
  let count = 0
  const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT, null, false)
  let node
  while (node = walker.nextNode()) {
    const len = node.textContent.length
    if (count + len >= offset) {
      const sel = window.getSelection()
      const r = document.createRange()
      r.setStart(node, offset - count)
      r.collapse(true)
      sel.removeAllRanges()
      sel.addRange(r)
      return
    }
    count += len
  }
}

/* ── Markdown rendering ── */

function renderMarkdown() {
  if (isRendering) return
  isRendering = true

  const offset = getCursorOffset()
  const raw = editor.innerText
  const html = marked.parse(raw)
  editor.innerHTML = html

  requestAnimationFrame(() => {
    setCursorOffset(offset)
    isRendering = false
  })
}

/* ── Debounced input ── */

let renderTimer = null
editor.addEventListener('input', () => {
  clearTimeout(renderTimer)
  renderTimer = setTimeout(renderMarkdown, 400)
})

/* ── Enter key: insert new block ── */

editor.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    clearTimeout(renderTimer)
    renderMarkdown()
  }
})

/* ── Initial render ── */

editor.innerHTML = '<p>欢迎使用 FLOWTEXT — 开始书写...</p>'
