const editor = document.getElementById('editor')
const filenameEl = document.getElementById('filename')
const toolbar = document.getElementById('float-toolbar')
const fileInput = document.getElementById('image-file-input')
const statusWords = document.getElementById('status-words')
const statusLine = document.getElementById('status-line')

let currentFile = null
let isModified = false
let isDarkMode = false
let hideToolbarTimer = null

/* ── Turndown 设置 ── */

const turndownService = new TurndownService({
  headingStyle: 'atx',
  hr: '---',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
  strongDelimiter: '**'
})

/* ── 文件名显示 ── */

function updateFilename() {
  if (!currentFile) {
    filenameEl.textContent = '未命名文档' + (isModified ? ' ●' : '')
    return
  }
  const name = currentFile.split(/[/\\]/).pop()
  filenameEl.textContent = name + (isModified ? ' ●' : '')
}

/* ── 状态栏 ── */

function updateStatusbar() {
  const text = editor.innerText || ''
  const wordCount = text.replace(/\s/g, '').length
  const lineCount = (text.match(/\n/g) || []).length + 1
  statusWords.textContent = `${wordCount} 字`
  statusLine.textContent = `${lineCount} 行`
}

/* ── 编辑器内容 ↔ Markdown ── */

function getMarkdown() {
  return turndownService.turndown(editor.innerHTML)
}

function setContent(markdown) {
  const html = marked.parse(markdown)
  editor.innerHTML = html
}

/* ── 文件操作 ── */

async function newFile() {
  editor.innerHTML = '<p><br></p>'
  currentFile = null
  isModified = false
  updateFilename()
  updateStatusbar()
}

async function openFile() {
  const result = await window.electronAPI?.openFile()
  if (!result) return

  currentFile = result.filepath
  setContent(result.content)
  isModified = false
  updateFilename()
  updateStatusbar()
}

async function saveFile() {
  const markdown = getMarkdown()
  const filepath = await window.electronAPI?.saveFile(markdown, currentFile)
  if (!filepath) return false

  currentFile = filepath
  isModified = false
  updateFilename()
  return true
}

async function saveFileAs() {
  const markdown = getMarkdown()
  const filepath = await window.electronAPI?.saveFileAs(markdown)
  if (!filepath) return false

  currentFile = filepath
  isModified = false
  updateFilename()
  return true
}

/* ── 编辑状态跟踪 ── */

editor.addEventListener('input', () => {
  if (!isModified) {
    isModified = true
    updateFilename()
  }
  updateStatusbar()
})

/* ── 导出 ── */

const EXPORT_CSS = `
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #fff; color: #1D1D1F; font-size: 16px; line-height: 1.6; -webkit-font-smoothing: antialiased; max-width: 720px; margin: 0 auto; padding: 40px 32px; }
h1 { font-size: 32px; font-weight: 700; margin: 24px 0 8px; }
h2 { font-size: 24px; font-weight: 700; margin: 20px 0 6px; }
h3 { font-size: 20px; font-weight: 600; margin: 18px 0 4px; }
h4 { font-size: 18px; font-weight: 600; margin: 16px 0 4px; }
h5 { font-size: 16px; font-weight: 600; margin: 14px 0 4px; }
h6 { font-size: 14px; font-weight: 600; margin: 12px 0 4px; color: #86868B; }
p { margin: 0 0 12px; }
strong { font-weight: 700; }
em { font-style: italic; }
s { text-decoration: line-through; }
blockquote { border-left: 4px solid #007AFF; padding: 8px 16px; margin: 12px 0; background: #F5F5F7; color: #515154; }
code { font-family: "SF Mono", Consolas, monospace; background: #F0F0F2; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }
pre { background: #F5F5F7; padding: 16px; border-radius: 8px; overflow-x: auto; margin: 12px 0; }
pre code { background: none; padding: 0; }
ul, ol { padding-left: 24px; margin: 8px 0; }
li { margin: 4px 0; }
table { border-collapse: collapse; width: 100%; margin: 12px 0; }
th, td { border: 1px solid #D2D2D7; padding: 8px 12px; text-align: left; }
th { background: #F5F5F7; font-weight: 600; }
hr { border: none; border-top: 1px solid #D2D2D7; margin: 24px 0; }
a { color: #007AFF; text-decoration: none; }
img { max-width: 100%; border-radius: 8px; margin: 12px 0; }
`

function buildExportHtml() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="UTF-8"><title>${currentFile ? currentFile.split(/[/\\]/).pop() : 'FLOWTEXT'} 导出</title>
<style>${EXPORT_CSS}</style></head>
<body>${editor.innerHTML}</body>
</html>`
}

async function exportHtml() {
  const html = buildExportHtml()
  await window.electronAPI?.exportHtml(html)
}

async function exportPdf() {
  const html = buildExportHtml()
  await window.electronAPI?.exportPdf(html)
}

/* ── 窗口控制 ── */

document.getElementById('titlebar-dots').addEventListener('click', (e) => {
  const dot = e.target.closest('.dot')
  if (!dot) return
  const action = dot.dataset.action
  if (action === 'close') window.electronAPI?.windowClose()
  else if (action === 'minimize') window.electronAPI?.windowMinimize()
  else if (action === 'maximize') window.electronAPI?.windowMaximize()
})

/* ── 暗色模式 ── */

document.getElementById('btn-darkmode').addEventListener('click', () => {
  isDarkMode = !isDarkMode
  document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light')
  document.getElementById('btn-darkmode').textContent = isDarkMode ? '☀️' : '🌙'
})

/* ── 键盘快捷键 ── */

document.addEventListener('keydown', async (e) => {
  const isCtrl = e.ctrlKey || e.metaKey

  if (isCtrl && e.key === 'n') {
    e.preventDefault()
    await newFile()
  } else if (isCtrl && e.key === 'o') {
    e.preventDefault()
    await openFile()
  } else if (isCtrl && e.key === 's' && e.shiftKey) {
    e.preventDefault()
    await saveFileAs()
  } else if (isCtrl && e.key === 's') {
    e.preventDefault()
    await saveFile()
  } else if (isCtrl && e.key === 'e') {
    e.preventDefault()
    await exportHtml()
  } else if (isCtrl && e.key === 'p') {
    e.preventDefault()
    await exportPdf()
  }
})

/* ── 浮动工具栏：显示 / 隐藏 ── */

function showToolbar() {
  clearTimeout(hideToolbarTimer)
  toolbar.classList.remove('hidden')
}

function hideToolbar() {
  toolbar.classList.add('hidden')
}

function delayHideToolbar() {
  clearTimeout(hideToolbarTimer)
  hideToolbarTimer = setTimeout(hideToolbar, 200)
}

function positionToolbar() {
  const sel = window.getSelection()
  if (!sel.rangeCount || sel.isCollapsed) {
    hideToolbar()
    return
  }

  const range = sel.getRangeAt(0)
  const rect = range.getBoundingClientRect()
  if (!rect || rect.width === 0) {
    hideToolbar()
    return
  }

  const tbWidth = toolbar.offsetWidth
  let left = rect.left + rect.width / 2 - tbWidth / 2
  if (left < 12) left = 12
  if (left + tbWidth > window.innerWidth - 12) left = window.innerWidth - tbWidth - 12

  const top = rect.top - toolbar.offsetHeight - 10
  toolbar.style.left = `${left}px`
  toolbar.style.top = `${top >= 0 ? top : rect.bottom + 10}px`
  showToolbar()
}

document.addEventListener('selectionchange', () => {
  if (document.activeElement !== editor) {
    hideToolbar()
    return
  }
  positionToolbar()
})

editor.addEventListener('blur', (e) => {
  if (toolbar.contains(e.relatedTarget)) return
  delayHideToolbar()
})

toolbar.addEventListener('mouseenter', () => clearTimeout(hideToolbarTimer))
toolbar.addEventListener('mouseleave', delayHideToolbar)

/* ── 格式按钮处理 ── */

function execCmd(cmd, value = null) {
  editor.focus()
  document.execCommand(cmd, false, value)
  editor.focus()
}

toolbar.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-cmd]')
  if (btn) {
    const cmd = btn.dataset.cmd
    const value = btn.dataset.value || undefined
    if (cmd === 'formatBlock') return
    execCmd(cmd, value)
    positionToolbar()
    return
  }

  if (e.target.closest('#btn-insert-image')) {
    fileInput.click()
  }
})

toolbar.addEventListener('change', (e) => {
  const target = e.target
  if (target.dataset.cmd === 'foreColor') {
    execCmd('foreColor', target.value)
  } else if (target.dataset.cmd === 'hiliteColor') {
    execCmd('hiliteColor', target.value)
  } else if (target.dataset.cmd === 'fontSize') {
    execCmd('fontSize', target.value)
  } else if (target.dataset.cmd === 'formatBlock') {
    if (target.value) execCmd('formatBlock', `<${target.value}>`)
  }
  positionToolbar()
})

/* ── 图片插入 ── */

function insertImage(src) {
  editor.focus()
  const sel = window.getSelection()
  if (sel.rangeCount) {
    const range = sel.getRangeAt(0)
    range.deleteContents()
    const img = document.createElement('img')
    img.src = src
    img.alt = 'image'
    img.draggable = false
    range.insertNode(img)
    range.setStartAfter(img)
    range.collapse(true)
    sel.removeAllRanges()
    sel.addRange(range)
  } else {
    editor.innerHTML += `<img src="${src}" alt="image">`
  }
  updateStatusbar()
}

async function handleImageFile(file) {
  const reader = new FileReader()
  reader.onload = (e) => {
    insertImage(e.target.result)
  }
  reader.readAsDataURL(file)
}

fileInput.addEventListener('change', () => {
  for (const file of fileInput.files) {
    handleImageFile(file)
  }
  fileInput.value = ''
})

editor.addEventListener('dragover', (e) => {
  e.preventDefault()
  e.dataTransfer.dropEffect = 'copy'
})

editor.addEventListener('drop', (e) => {
  e.preventDefault()
  for (const file of e.dataTransfer.files) {
    if (file.type.startsWith('image/')) {
      handleImageFile(file)
    }
  }
})

editor.addEventListener('paste', (e) => {
  const items = e.clipboardData?.items
  if (!items) return

  for (const item of items) {
    if (item.type.startsWith('image/')) {
      e.preventDefault()
      const file = item.getAsFile()
      if (file) handleImageFile(file)
      return
    }
  }
})

editor.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    const sel = window.getSelection()
    if (sel.rangeCount) {
      const node = sel.getRangeAt(0).startContainer
      if (node.nodeType === 3) {
        const parent = node.parentElement
        if (parent && ['LI'].includes(parent.tagName)) return
      }
    }
  }
})

/* ── 平台检测 ── */

if (window.electronAPI?.platform === 'win32') {
  document.getElementById('titlebar-dots').classList.add('hidden')
}

/* ── 初始内容 ── */

editor.innerHTML = '<p>欢迎使用 FLOWTEXT — 开始书写...</p>'
updateFilename()
updateStatusbar()
