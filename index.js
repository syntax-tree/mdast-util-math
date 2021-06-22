/**
 * @typedef {import('mdast').Literal} Literal
 * @typedef {import('mdast-util-from-markdown').Extension} FromMarkdownExtension
 * @typedef {import('mdast-util-from-markdown').Handle} FromMarkdownHandle
 * @typedef {import('mdast-util-to-markdown').Options} ToMarkdownExtension
 * @typedef {import('mdast-util-to-markdown').Handle} ToMarkdownHandle
 *
 * @typedef {Literal & {type: 'math', lang?: string|null, meta?: string|null}} Math
 * @typedef {Literal & {type: 'inlineMath'}} InlineMath
 */

import {longestStreak} from 'longest-streak'
import {safe} from 'mdast-util-to-markdown/lib/util/safe.js'

/** @type {FromMarkdownExtension} */
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

/** @type {ToMarkdownExtension} */
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

/** @type {FromMarkdownHandle} */
function enterMathFlow(token) {
  /** @type {Math} */
  const node = {
    type: 'math',
    meta: null,
    value: '',
    data: {
      hName: 'div',
      hProperties: {className: ['math', 'math-display']},
      hChildren: [{type: 'text', value: ''}]
    }
  }
  // @ts-expect-error: custom node.
  this.enter(node, token)
}

/** @type {FromMarkdownHandle} */
function enterMathFlowMeta() {
  this.buffer()
}

/** @type {FromMarkdownHandle} */
function exitMathFlowMeta() {
  const data = this.resume()
  this.stack[this.stack.length - 1].meta = data
}

/** @type {FromMarkdownHandle} */
function exitMathFlowFence() {
  // Exit if this is the closing fence.
  if (this.getData('mathFlowInside')) return
  this.buffer()
  this.setData('mathFlowInside', true)
}

/** @type {FromMarkdownHandle} */
function exitMathFlow(token) {
  const data = this.resume().replace(/^(\r?\n|\r)|(\r?\n|\r)$/g, '')
  const node = this.exit(token)
  node.value = data
  // @ts-expect-error: we defined it.
  node.data.hChildren[0].value = data
  this.setData('mathFlowInside')
}

/** @type {FromMarkdownHandle} */
function enterMathText(token) {
  /** @type {InlineMath} */
  const node = {
    type: 'inlineMath',
    value: '',
    data: {
      hName: 'span',
      hProperties: {className: ['math', 'math-inline']},
      hChildren: [{type: 'text', value: ''}]
    }
  }
  // @ts-expect-error: custom node.
  this.enter(node, token)
  this.buffer()
}

/** @type {FromMarkdownHandle} */
function exitMathText(token) {
  const data = this.resume()
  const node = this.exit(token)
  node.value = data
  // @ts-expect-error: we defined it.
  node.data.hChildren[0].value = data
}

/** @type {FromMarkdownHandle} */
function exitMathData(token) {
  this.config.enter.data.call(this, token)
  this.config.exit.data.call(this, token)
}

/**
 * @type {ToMarkdownHandle}
 * @param {Math} node
 */
function math(node, _, context) {
  const raw = node.value || ''
  const fence = '$'.repeat(Math.max(longestStreak(raw, '$') + 1, 2))
  const exit = context.enter('mathFlow')
  let value = fence
  /** @type {ReturnType<context['enter']>} */
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

/**
 * @type {ToMarkdownHandle}
 * @param {InlineMath} node
 */
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

/** @type {ToMarkdownHandle} */
function inlineMathPeek() {
  return '$'
}
