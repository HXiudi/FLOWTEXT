const editor = document.getElementById('editor')
const filenameEl = document.getElementById('filename')
const toolbar = document.getElementById('float-toolbar')
const fileInput = document.getElementById('image-file-input')

let currentFile = null
let hideToolbarTimer = null

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

/* ── 文件选择对话框 ── */

fileInput.addEventListener('change', () => {
  for (const file of fileInput.files) {
    handleImageFile(file)
  }
  fileInput.value = ''
})

/* ── 拖拽图片 ── */

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

/* ── 粘贴图片 ── */

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

/* ── 键盘快捷键 ── */

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
