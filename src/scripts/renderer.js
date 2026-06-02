const editor = document.getElementById('editor')
const filenameEl = document.getElementById('filename')
const toolbar = document.getElementById('float-toolbar')
const fileInput = document.getElementById('image-file-input')

let currentFile = null
let isModified = false
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
  if (isModified) {
    const ok = await window.electronAPI?.showConfirm?.()
  }
  editor.innerHTML = '<p><br></p>'
  currentFile = null
  isModified = false
  updateFilename()
}

async function openFile() {
  const result = await window.electronAPI?.openFile()
  if (!result) return

  currentFile = result.filepath
  setContent(result.content)
  isModified = false
  updateFilename()
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
}

async function handleImageFile(file) {
  const reader = new FileReader()
  reader.onload = async (e) => {
    let src = e.target.result
    if (window.electronAPI?.saveImage) {
      const filepath = await window.electronAPI.saveImage(src)
      if (filepath) src = `file:///${filepath.replace(/\\/g, '/')}`
    }
    insertImage(src)
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

/* ── 初始内容 ── */

editor.innerHTML = '<p>欢迎使用 FLOWTEXT — 开始书写...</p>'
updateFilename()
