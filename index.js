import {longestStreak} from 'longest-streak'
import safe from 'mdast-util-to-markdown/lib/util/safe.js'

export const mathFromMarkdown = {
  enter: {
    mathFlow: enterMathFlow,
    mathFlowFenceMeta: enterMathFlowMeta,
    mathText: enterMathText
  },
  exit: {
    mathFlow: exitMathFlow,
    mathFlowFence: exitMathFlowFence,
    mathFlowFenceMeta: exitMathFlowMeta,
    mathFlowValue: exitMathData,
    mathText: exitMathText,
    mathTextData: exitMathData
  }
}

export const mathToMarkdown = {
  unsafe: [
    {character: '\r', inConstruct: ['mathFlowMeta']},
    {character: '\r', inConstruct: ['mathFlowMeta']},
    {character: '$', inConstruct: ['mathFlowMeta', 'phrasing']},
    {atBreak: true, character: '$', after: '\\$'}
  ],
  handlers: {math, inlineMath}
}

inlineMath.peek = inlineMathPeek

function enterMathFlow(token) {
  this.enter(
    {
      type: 'math',
      meta: null,
      value: '',
      data: {
        hName: 'div',
        hProperties: {className: ['math', 'math-display']},
        hChildren: [{type: 'text', value: ''}]
      }
    },
    token
  )
}

function enterMathFlowMeta() {
  this.buffer()
}

function exitMathFlowMeta() {
  const data = this.resume()
  this.stack[this.stack.length - 1].meta = data
}

function exitMathFlowFence() {
  // Exit if this is the closing fence.
  if (this.getData('mathFlowInside')) return
  this.buffer()
  this.setData('mathFlowInside', true)
}

function exitMathFlow(token) {
  const data = this.resume().replace(/^(\r?\n|\r)|(\r?\n|\r)$/g, '')
  const node = this.exit(token)
  node.value = data
  node.data.hChildren[0].value = data
  this.setData('mathFlowInside')
}

function enterMathText(token) {
  this.enter(
    {
      type: 'inlineMath',
      value: '',
      data: {
        hName: 'span',
        hProperties: {className: ['math', 'math-inline']},
        hChildren: [{type: 'text', value: ''}]
      }
    },
    token
  )
  this.buffer()
}

function exitMathText(token) {
  const data = this.resume()
  const node = this.exit(token)
  node.value = data
  node.data.hChildren[0].value = data
}

function exitMathData(token) {
  this.config.enter.data.call(this, token)
  this.config.exit.data.call(this, token)
}

function math(node, _, context) {
  const raw = node.value || ''
  const fence = '$'.repeat(Math.max(longestStreak(raw, '$') + 1, 2))
  const exit = context.enter('mathFlow')
  let value = fence
  let subexit

  if (node.meta) {
    subexit = context.enter('mathFlowMeta')
    value += safe(context, node.meta, {before: '$', after: ' ', encode: ['$']})
    subexit()
  }

  value += '\n'

  if (raw) {
    value += raw + '\n'
  }

  value += fence
  exit()
  return value
}

function inlineMath(node) {
  const value = node.value || ''
  let size = 1
  let pad = ''

  // If there is a single dollar sign on its own in the math, use a fence of
  // two.
  // If there are two in a row, use one.
  while (new RegExp('(^|[^$])' + '\\$'.repeat(size) + '([^$]|$)').test(value)) {
    size++
  }

  // If this is not just spaces or eols (tabs don’t count), and either the first
  // or last character are a space, eol, or dollar sign, then pad with spaces.
  if (
    /[^ \r\n]/.test(value) &&
    (/[ \r\n$]/.test(value.charAt(0)) ||
      /[ \r\n$]/.test(value.charAt(value.length - 1)))
  ) {
    pad = ' '
  }

  const sequence = '$'.repeat(size)
  return sequence + pad + value + pad + sequence
}

function inlineMathPeek() {
  return '$'
}
