/**
 * @import {Element as HastElement} from 'hast'
 * @import {
 *   CompileContext,
 *   Extension as FromMarkdownExtension,
 *   Handle as FromMarkdownHandle
 * } from 'mdast-util-from-markdown'
 * @import {
 *   Handle as ToMarkdownHandle,
 *   Options as ToMarkdownExtension
 * } from 'mdast-util-to-markdown'
 * @import {InlineMath, Math} from '../index.js'
 */

/**
 * @typedef ToOptions
 *   Configuration.
 * @property {boolean | null | undefined} [singleDollarTextMath=true]
 *   Whether to support math (text) with a single dollar (default: `true`).
 *
 *   Single dollars work in Pandoc and many other places, but often interfere
 *   with “normal” dollars in text.
 *   If you turn this off, you can still use two or more dollars for text math.
 */

import {ok as assert} from 'devlop'
import {longestStreak} from 'longest-streak'

/**
 * Create an extension for `mdast-util-from-markdown`.
 *
 * @returns {FromMarkdownExtension}
 *   Extension for `mdast-util-from-markdown`.
 */
export function mathFromMarkdown() {
  return {
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

  /**
   * Enter math (flow).
   *
   * @this {CompileContext}
   * @type {FromMarkdownHandle}
   */
  function enterMathFlow(token) {
    /** @type {HastElement} */
    const code = {
      type: 'element',
      tagName: 'code',
      properties: {className: ['language-math', 'math-display']},
      children: []
    }
    this.enter(
      {
        type: 'math',
        meta: null,
        value: '',
        data: {hName: 'pre', hChildren: [code]}
      },
      token
    )
  }

  /**
   * Enter math (flow) meta.
   *
   * @this {CompileContext}
   * @type {FromMarkdownHandle}
   */
  function enterMathFlowMeta() {
    this.buffer()
  }

  /**
   * Exit math (flow) meta.
   *
   * @this {CompileContext}
   * @type {FromMarkdownHandle}
   */
  function exitMathFlowMeta() {
    const data = this.resume()
    const node = this.stack[this.stack.length - 1]
    assert(node.type === 'math')
    node.meta = data
  }

  /**
   * Exit a math (flow) fence.
   *
   * @this {CompileContext}
   * @type {FromMarkdownHandle}
   */
  function exitMathFlowFence() {
    // Exit if this is the closing fence.
    if (this.data.mathFlowInside) return
    this.buffer()
    this.data.mathFlowInside = true
  }

  /**
   * Exit math (flow).
   *
   * @this {CompileContext}
   * @type {FromMarkdownHandle}
   */
  function exitMathFlow(token) {
    const data = this.resume().replace(/^(\r?\n|\r)|(\r?\n|\r)$/g, '')
    const node = this.stack[this.stack.length - 1]
    assert(node.type === 'math')
    this.exit(token)
    node.value = data
    // Defined in `enterMathFlow`.
    assert(node.data)
    assert(node.data.hChildren)
    const code = node.data.hChildren[0]
    assert(code.type === 'element')
    assert(code.tagName === 'code')
    code.children.push({type: 'text', value: data})
    this.data.mathFlowInside = undefined
  }

  /**
   * Enter math (text).
   *
   * @this {CompileContext}
   * @type {FromMarkdownHandle}
   */
  function enterMathText(token) {
    this.enter(
      {
        type: 'inlineMath',
        value: '',
        data: {
          hName: 'code',
          hProperties: {className: ['language-math', 'math-inline']},
          hChildren: []
        }
      },
      token
    )
    this.buffer()
  }

  /**
   * Exit math (text).
   *
   * @this {CompileContext}
   * @type {FromMarkdownHandle}
   */
  function exitMathText(token) {
    const data = this.resume()
    const node = this.stack[this.stack.length - 1]
    assert(node.type === 'inlineMath')
    this.exit(token)
    node.value = data
    // Defined in `enterMathText`.
    assert(node.data)
    assert(node.data.hChildren)
    node.data.hChildren.push({type: 'text', value: data})
  }

  /**
   * Exit math data.
   *
   * @this {CompileContext}
   * @type {FromMarkdownHandle}
   */
  function exitMathData(token) {
    this.config.enter.data.call(this, token)
    this.config.exit.data.call(this, token)
  }
}

/**
 * Create an extension for `mdast-util-to-markdown`.
 *
 * @param {ToOptions | null | undefined} [options]
 *   Configuration (optional).
 * @returns {ToMarkdownExtension}
 *   Extension for `mdast-util-to-markdown`.
 */
export function mathToMarkdown(options) {
  let single = (options || {}).singleDollarTextMath

  single ??= true

  inlineMath.peek = inlineMathPeek

  return {
    unsafe: [
      {character: '\r', inConstruct: 'mathFlowMeta'},
      {character: '\n', inConstruct: 'mathFlowMeta'},
      {
        character: '$',
        after: single ? undefined : '\\$',
        inConstruct: 'phrasing'
      },
      {character: '$', inConstruct: 'mathFlowMeta'},
      {atBreak: true, character: '$', after: '\\$'}
    ],
    handlers: {math, inlineMath}
  }

  /**
   * Serialize math (flow).
   *
   * @type {ToMarkdownHandle}
   * @param {Math} node
   *   Node.
   */
  // Note: fixing this code? Please also fix the similar code for code:
  // <https://github.com/syntax-tree/mdast-util-to-markdown/blob/main/lib/handle/code.js>
  function math(node, _, state, info) {
    const raw = node.value || ''
    const tracker = state.createTracker(info)
    const sequence = '$'.repeat(Math.max(longestStreak(raw, '$') + 1, 2))
    const exit = state.enter('mathFlow')
    let value = tracker.move(sequence)

    if (node.meta) {
      const subexit = state.enter('mathFlowMeta')
      value += tracker.move(
        state.safe(node.meta, {
          after: '\n',
          before: value,
          encode: ['$'],
          ...tracker.current()
        })
      )
      subexit()
    }

    value += tracker.move('\n')

    if (raw) {
      value += tracker.move(raw + '\n')
    }

    value += tracker.move(sequence)
    exit()
    return value
  }

  /**
   * Serialize math (text).
   *
   * @type {ToMarkdownHandle}
   * @param {InlineMath} node
   *   Node.
   */
  // Note: fixing this code? Please also fix the similar code for inline code:
  // <https://github.com/syntax-tree/mdast-util-to-markdown/blob/main/lib/handle/inline-code.js>
  function inlineMath(node, _, state) {
    let value = node.value || ''
    let size = 1

    if (!single) size++

    // If there is a single dollar sign on its own in the math, use a fence of
    // two.
    // If there are two in a row, use one.
    while (
      new RegExp('(^|[^$])' + '\\$'.repeat(size) + '([^$]|$)').test(value)
    ) {
      size++
    }

    const sequence = '$'.repeat(size)

    // If this is not just spaces or eols (tabs don’t count), and either the
    // first and last character are a space or eol, or the first or last
    // character are dollar signs, then pad with spaces.
    if (
      // Contains non-space.
      /[^\n\r ]/.test(value) &&
      // Starts with space and ends with space.
      ((/^[\n\r ]/.test(value) && /[\n\r ]$/.test(value)) ||
        // Starts or ends with dollar.
        /^\$|\$$/.test(value))
    ) {
      value = ' ' + value + ' '
    }

    let index = -1

    // We have a potential problem: certain characters after eols could result in
    // blocks being seen.
    // For example, if someone injected the string `'\n# b'`, then that would
    // result in an ATX heading.
    // We can’t escape characters in `inlineMath`, but because eols are
    // transformed to spaces when going from markdown to HTML anyway, we can swap
    // them out.
    while (++index < state.unsafe.length) {
      const pattern = state.unsafe[index]

      // Only look for `atBreak`s.
      // Btw: note that `atBreak` patterns will always start the regex at LF or
      // CR.
      if (!pattern.atBreak) continue

      const expression = state.compilePattern(pattern)
      /** @type {RegExpExecArray | null} */
      let match

      while ((match = expression.exec(value))) {
        let position = match.index

        // Support CRLF (patterns only look for one of the characters).
        if (
          value.codePointAt(position) === 10 /* `\n` */ &&
          value.codePointAt(position - 1) === 13 /* `\r` */
        ) {
          position--
        }

        value = value.slice(0, position) + ' ' + value.slice(match.index + 1)
      }
    }

    return sequence + value + sequence
  }

  /**
   * Get the character that math (text) starts with.
   *
   * @returns {string}
   *   Character.
   */
  function inlineMathPeek() {
    return '$'
  }
}
