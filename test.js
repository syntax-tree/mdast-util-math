import assert from 'node:assert/strict'
import test from 'node:test'
import {fromMarkdown} from 'mdast-util-from-markdown'
import {toMarkdown} from 'mdast-util-to-markdown'
import {math} from 'micromark-extension-math'
import {mathFromMarkdown, mathToMarkdown} from './index.js'

test('mathFromMarkdown', () => {
  assert.deepEqual(
    fromMarkdown('a $b$ c', {
      extensions: [math()],
      mdastExtensions: [mathFromMarkdown()]
    }),
    {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'text',
              value: 'a ',
              position: {
                start: {line: 1, column: 1, offset: 0},
                end: {line: 1, column: 3, offset: 2}
              }
            },
            {
              type: 'inlineMath',
              value: 'b',
              data: {
                hName: 'span',
                hProperties: {className: ['math', 'math-inline']},
                hChildren: [{type: 'text', value: 'b'}]
              },
              position: {
                start: {line: 1, column: 3, offset: 2},
                end: {line: 1, column: 6, offset: 5}
              }
            },
            {
              type: 'text',
              value: ' c',
              position: {
                start: {line: 1, column: 6, offset: 5},
                end: {line: 1, column: 8, offset: 7}
              }
            }
          ],
          position: {
            start: {line: 1, column: 1, offset: 0},
            end: {line: 1, column: 8, offset: 7}
          }
        }
      ],
      position: {
        start: {line: 1, column: 1, offset: 0},
        end: {line: 1, column: 8, offset: 7}
      }
    },
    'should support math (text)'
  )

  assert.deepEqual(
    fromMarkdown('$$\na\n$$', {
      extensions: [math()],
      mdastExtensions: [mathFromMarkdown()]
    }).children[0],
    {
      type: 'math',
      meta: null,
      value: 'a',
      data: {
        hName: 'div',
        hProperties: {className: ['math', 'math-display']},
        hChildren: [{type: 'text', value: 'a'}]
      },
      position: {
        start: {line: 1, column: 1, offset: 0},
        end: {line: 3, column: 3, offset: 7}
      }
    },
    'should support math (flow)'
  )

  assert.deepEqual(
    fromMarkdown('$$a&amp;b\\&c\n', {
      extensions: [math()],
      mdastExtensions: [mathFromMarkdown()]
    }).children[0],
    {
      type: 'math',
      meta: 'a&b&c',
      value: '',
      data: {
        hName: 'div',
        hProperties: {className: ['math', 'math-display']},
        hChildren: [{type: 'text', value: ''}]
      },
      position: {
        start: {line: 1, column: 1, offset: 0},
        end: {line: 2, column: 1, offset: 13}
      }
    },
    'should support math (flow) w/ meta'
  )

  assert.deepEqual(
    fromMarkdown('$a\nb\nb$', {
      extensions: [math()],
      mdastExtensions: [mathFromMarkdown()]
    }).children[0],
    {
      type: 'paragraph',
      children: [
        {
          type: 'inlineMath',
          value: 'a\nb\nb',
          data: {
            hName: 'span',
            hProperties: {className: ['math', 'math-inline']},
            hChildren: [{type: 'text', value: 'a\nb\nb'}]
          },
          position: {
            start: {line: 1, column: 1, offset: 0},
            end: {line: 3, column: 3, offset: 7}
          }
        }
      ],
      position: {
        start: {line: 1, column: 1, offset: 0},
        end: {line: 3, column: 3, offset: 7}
      }
    },
    'should support math (text) w/ EOLs'
  )
})

test('mathToMarkdown', () => {
  assert.deepEqual(
    toMarkdown(
      {type: 'inlineMath', value: 'a'},
      {extensions: [mathToMarkdown()]}
    ),
    '$a$\n',
    'should serialize math (text)'
  )

  assert.deepEqual(
    toMarkdown(
      {type: 'inlineMath', value: 'a'},
      {extensions: [mathToMarkdown({singleDollarTextMath: false})]}
    ),
    '$$a$$\n',
    'should serialize math (text) with at least 2 dollars w/ `singleDollarTextMath: false`'
  )

  assert.deepEqual(
    // @ts-expect-error: `value` missing.
    toMarkdown({type: 'inlineMath'}, {extensions: [mathToMarkdown()]}),
    '$$\n',
    'should serialize math (text) w/o `value`'
  )

  assert.deepEqual(
    toMarkdown(
      {type: 'inlineMath', value: 'a \\$ b'},
      {extensions: [mathToMarkdown()]}
    ),
    '$$a \\$ b$$\n',
    'should serialize math (text) w/ two dollar signs when including a dollar'
  )

  assert.deepEqual(
    toMarkdown(
      {type: 'inlineMath', value: 'a \\$'},
      {extensions: [mathToMarkdown()]}
    ),
    '$$ a \\$ $$\n',
    'should serialize math (text) w/ padding when ending in a dollar sign'
  )

  assert.deepEqual(
    toMarkdown(
      {type: 'inlineMath', value: '$ a'},
      {extensions: [mathToMarkdown()]}
    ),
    '$$ $ a $$\n',
    'should serialize math (text) w/ padding when starting in a dollar sign'
  )

  assert.equal(
    toMarkdown(
      {type: 'inlineMath', value: ' a '},
      {extensions: [mathToMarkdown()]}
    ),
    '$  a  $\n',
    'should pad w/ a space if the value starts and ends w/ a space'
  )

  assert.equal(
    toMarkdown(
      {type: 'inlineMath', value: ' a'},
      {extensions: [mathToMarkdown()]}
    ),
    '$ a$\n',
    'should not pad w/ spaces if the value ends w/ a non-space'
  )

  assert.equal(
    toMarkdown(
      {type: 'inlineMath', value: 'a '},
      {extensions: [mathToMarkdown()]}
    ),
    '$a $\n',
    'should not pad w/ spaces if the value starts w/ a non-space'
  )

  assert.deepEqual(
    toMarkdown({type: 'math', value: 'a'}, {extensions: [mathToMarkdown()]}),
    '$$\na\n$$\n',
    'should serialize math (flow)'
  )

  assert.deepEqual(
    // @ts-expect-error: `value` missing.
    toMarkdown({type: 'math'}, {extensions: [mathToMarkdown()]}),
    '$$\n$$\n',
    'should serialize math (flow) w/o `value`'
  )

  assert.deepEqual(
    // @ts-expect-error: `value` missing.
    toMarkdown({type: 'math', meta: 'a'}, {extensions: [mathToMarkdown()]}),
    '$$a\n$$\n',
    'should serialize math (flow) w/ `meta`'
  )

  assert.deepEqual(
    toMarkdown({type: 'math', value: '$$'}, {extensions: [mathToMarkdown()]}),
    '$$$\n$$\n$$$\n',
    'should serialize math (flow) w/ more dollars than occur together in `value`'
  )

  assert.deepEqual(
    // @ts-expect-error: `value` missing.
    toMarkdown({type: 'math', meta: 'a'}, {extensions: [mathToMarkdown()]}),
    '$$a\n$$\n',
    'should serialize math (flow) w/ `meta`'
  )

  assert.deepEqual(
    toMarkdown(
      {type: 'paragraph', children: [{type: 'text', value: 'a $ b'}]},
      {extensions: [mathToMarkdown()]}
    ),
    'a \\$ b\n',
    'should escape `$` in phrasing'
  )

  assert.deepEqual(
    toMarkdown(
      {type: 'paragraph', children: [{type: 'text', value: 'a $ b'}]},
      {extensions: [mathToMarkdown({singleDollarTextMath: false})]}
    ),
    'a $ b\n',
    'should not escape a single dollar in phrasing w/ `singleDollarTextMath: false`'
  )

  assert.deepEqual(
    toMarkdown(
      {type: 'paragraph', children: [{type: 'text', value: 'a $$ b'}]},
      {extensions: [mathToMarkdown({singleDollarTextMath: false})]}
    ),
    'a \\$$ b\n',
    'should escape two dollars in phrasing w/ `singleDollarTextMath: false`'
  )

  assert.deepEqual(
    toMarkdown(
      {
        type: 'paragraph',
        children: [
          {type: 'text', value: 'a $'},
          {type: 'inlineMath', value: 'b'},
          {type: 'text', value: '$ c'}
        ]
      },
      {extensions: [mathToMarkdown()]}
    ),
    'a \\$$b$\\$ c\n',
    'should escape `$` around math (text)'
  )

  assert.deepEqual(
    toMarkdown(
      {
        type: 'definition',
        label: 'a',
        identifier: 'a',
        url: 'b',
        title: 'a\n$\nb'
      },
      {extensions: [mathToMarkdown()]}
    ),
    '[a]: b "a\n$\nb"\n',
    'should not escape `$` at the start of a line'
  )

  assert.deepEqual(
    toMarkdown(
      {type: 'math', meta: 'a\rb\nc', value: ''},
      {extensions: [mathToMarkdown()]}
    ),
    '$$a&#xD;b&#xA;c\n$$\n',
    'should escape `\\r`, `\\n` when in `meta` of math (flow)'
  )

  assert.deepEqual(
    toMarkdown(
      {type: 'math', meta: 'a$b', value: ''},
      {extensions: [mathToMarkdown()]}
    ),
    '$$a&#x24;b\n$$\n',
    'should escape `$` when in `meta` of math (flow)'
  )

  assert.equal(
    toMarkdown(
      {type: 'inlineMath', value: 'a\n- b'},
      {extensions: [mathToMarkdown()]}
    ),
    '$a - b$\n',
    'should prevent breaking out of code (-)'
  )

  assert.equal(
    toMarkdown(
      {type: 'inlineMath', value: 'a\n#'},
      {extensions: [mathToMarkdown()]}
    ),
    '$a #$\n',
    'should prevent breaking out of code (#)'
  )

  assert.equal(
    toMarkdown(
      {type: 'inlineMath', value: 'a\n1. '},
      {extensions: [mathToMarkdown()]}
    ),
    '$a 1. $\n',
    'should prevent breaking out of code (\\d\\.)'
  )

  assert.equal(
    toMarkdown(
      {type: 'inlineMath', value: 'a\r- b'},
      {extensions: [mathToMarkdown()]}
    ),
    '$a - b$\n',
    'should prevent breaking out of code (cr)'
  )

  assert.equal(
    toMarkdown(
      {type: 'inlineMath', value: 'a\r\n- b'},
      {extensions: [mathToMarkdown()]}
    ),
    '$a - b$\n',
    'should prevent breaking out of code (crlf)'
  )
})
