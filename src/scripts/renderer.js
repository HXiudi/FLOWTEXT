const editor = document.getElementById('editor')
const filenameEl = document.getElementById('filename')
const toolbar = document.getElementById('float-toolbar')

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

/* ── 工具栏定位 ── */

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

/* ── 选中文字时显示工具栏 ── */

document.addEventListener('selectionchange', () => {
  if (document.activeElement !== editor) {
    hideToolbar()
    return
  }
  positionToolbar()
})

/* ── 隐藏工具栏：点击外部 / 失焦 ── */

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
  if (!btn) return

  const cmd = btn.dataset.cmd
  const value = btn.dataset.value || undefined

  if (cmd === 'formatBlock') return // handled by change event

  execCmd(cmd, value)
  positionToolbar()
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
    if (target.value) {
      execCmd('formatBlock', `<${target.value}>`)
    }
  }
  positionToolbar()
})

/* ── 键盘快捷键支持 ── */

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
