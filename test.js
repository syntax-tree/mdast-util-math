import assert from 'node:assert/strict'
import test from 'node:test'
import {math} from 'micromark-extension-math'
import {fromMarkdown} from 'mdast-util-from-markdown'
import {mathFromMarkdown, mathToMarkdown} from 'mdast-util-math'
import {toMarkdown} from 'mdast-util-to-markdown'

test('core', async function (t) {
  await t.test('should expose the public api', async function () {
    assert.deepEqual(Object.keys(await import('mdast-util-math')).sort(), [
      'mathFromMarkdown',
      'mathToMarkdown'
    ])
  })
})

test('mathFromMarkdown', async function (t) {
  await t.test('should support math (text)', async function () {
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
      }
    )
  })

  await t.test('should support math (flow)', async function () {
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
      }
    )
  })

  await t.test('should support math (flow) w/ meta', async function () {
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
      }
    )
  })

  await t.test('should support math (text) w/ EOLs', async function () {
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
      }
    )
  })
})

test('mathToMarkdown', async function (t) {
  await t.test('should serialize math (text)', async function () {
    assert.deepEqual(
      toMarkdown(
        {type: 'inlineMath', value: 'a'},
        {extensions: [mathToMarkdown()]}
      ),
      '$a$\n'
    )
  })

  await t.test(
    'should serialize math (text) with at least 2 dollars w/ `singleDollarTextMath: false`',
    async function () {
      assert.deepEqual(
        toMarkdown(
          {type: 'inlineMath', value: 'a'},
          {extensions: [mathToMarkdown({singleDollarTextMath: false})]}
        ),
        '$$a$$\n'
      )
    }
  )

  await t.test('should serialize math (text) w/o `value`', async function () {
    assert.deepEqual(
      toMarkdown(
        // @ts-expect-error: check how runtime handles `value` missing.
        {type: 'inlineMath'},
        {extensions: [mathToMarkdown()]}
      ),
      '$$\n'
    )
  })

  await t.test(
    'should serialize math (text) w/ two dollar signs when including a dollar',
    async function () {
      assert.deepEqual(
        toMarkdown(
          {type: 'inlineMath', value: 'a \\$ b'},
          {extensions: [mathToMarkdown()]}
        ),
        '$$a \\$ b$$\n'
      )
    }
  )

  await t.test(
    'should serialize math (text) w/ padding when ending in a dollar sign',
    async function () {
      assert.deepEqual(
        toMarkdown(
          {type: 'inlineMath', value: 'a \\$'},
          {extensions: [mathToMarkdown()]}
        ),
        '$$ a \\$ $$\n'
      )
    }
  )

  await t.test(
    'should serialize math (text) w/ padding when starting in a dollar sign',
    async function () {
      assert.deepEqual(
        toMarkdown(
          {type: 'inlineMath', value: '$ a'},
          {extensions: [mathToMarkdown()]}
        ),
        '$$ $ a $$\n'
      )
    }
  )

  await t.test(
    'should pad w/ a space if the value starts and ends w/ a space',
    async function () {
      assert.equal(
        toMarkdown(
          {type: 'inlineMath', value: ' a '},
          {extensions: [mathToMarkdown()]}
        ),
        '$  a  $\n'
      )
    }
  )

  await t.test(
    'should not pad w/ spaces if the value ends w/ a non-space',
    async function () {
      assert.equal(
        toMarkdown(
          {type: 'inlineMath', value: ' a'},
          {extensions: [mathToMarkdown()]}
        ),
        '$ a$\n'
      )
    }
  )

  await t.test(
    'should not pad w/ spaces if the value starts w/ a non-space',
    async function () {
      assert.equal(
        toMarkdown(
          {type: 'inlineMath', value: 'a '},
          {extensions: [mathToMarkdown()]}
        ),
        '$a $\n'
      )
    }
  )

  await t.test('should serialize math (flow)', async function () {
    assert.deepEqual(
      toMarkdown({type: 'math', value: 'a'}, {extensions: [mathToMarkdown()]}),
      '$$\na\n$$\n'
    )
  })

  await t.test('should serialize math (flow) w/o `value`', async function () {
    assert.deepEqual(
      toMarkdown(
        // @ts-expect-error: check how runtime handles `value` missing.
        {type: 'math'},
        {extensions: [mathToMarkdown()]}
      ),
      '$$\n$$\n'
    )
  })

  await t.test('should serialize math (flow) w/ `meta`', async function () {
    assert.deepEqual(
      toMarkdown(
        // @ts-expect-error: check how runtime handles `value` missing.
        {type: 'math', meta: 'a'},
        {extensions: [mathToMarkdown()]}
      ),
      '$$a\n$$\n'
    )
  })

  await t.test(
    'should serialize math (flow) w/ more dollars than occur together in `value`',
    async function () {
      assert.deepEqual(
        toMarkdown(
          {type: 'math', value: '$$'},
          {extensions: [mathToMarkdown()]}
        ),
        '$$$\n$$\n$$$\n'
      )
    }
  )

  await t.test('should serialize math (flow) w/ `meta`', async function () {
    assert.deepEqual(
      toMarkdown(
        // @ts-expect-error: check how runtime handles `value` missing.
        {type: 'math', meta: 'a'},
        {extensions: [mathToMarkdown()]}
      ),
      '$$a\n$$\n'
    )
  })

  await t.test('should escape `$` in phrasing', async function () {
    assert.deepEqual(
      toMarkdown(
        {type: 'paragraph', children: [{type: 'text', value: 'a $ b'}]},
        {extensions: [mathToMarkdown()]}
      ),
      'a \\$ b\n'
    )
  })

  await t.test(
    'should not escape a single dollar in phrasing w/ `singleDollarTextMath: false`',
    async function () {
      assert.deepEqual(
        toMarkdown(
          {type: 'paragraph', children: [{type: 'text', value: 'a $ b'}]},
          {extensions: [mathToMarkdown({singleDollarTextMath: false})]}
        ),
        'a $ b\n'
      )
    }
  )

  await t.test(
    'should escape two dollars in phrasing w/ `singleDollarTextMath: false`',
    async function () {
      assert.deepEqual(
        toMarkdown(
          {type: 'paragraph', children: [{type: 'text', value: 'a $$ b'}]},
          {extensions: [mathToMarkdown({singleDollarTextMath: false})]}
        ),
        'a \\$$ b\n'
      )
    }
  )

  await t.test('should escape `$` around math (text)', async function () {
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
      'a \\$$b$\\$ c\n'
    )
  })

  await t.test(
    'should not escape `$` at the start of a line',
    async function () {
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
        '[a]: b "a\n$\nb"\n'
      )
    }
  )

  await t.test(
    'should escape `\\r`, `\\n` when in `meta` of math (flow)',
    async function () {
      assert.deepEqual(
        toMarkdown(
          {type: 'math', meta: 'a\rb\nc', value: ''},
          {extensions: [mathToMarkdown()]}
        ),
        '$$a&#xD;b&#xA;c\n$$\n'
      )
    }
  )

  await t.test(
    'should escape `$` when in `meta` of math (flow)',
    async function () {
      assert.deepEqual(
        toMarkdown(
          {type: 'math', meta: 'a$b', value: ''},
          {extensions: [mathToMarkdown()]}
        ),
        '$$a&#x24;b\n$$\n'
      )
    }
  )

  await t.test('should prevent breaking out of code (-)', async function () {
    assert.equal(
      toMarkdown(
        {type: 'inlineMath', value: 'a\n- b'},
        {extensions: [mathToMarkdown()]}
      ),
      '$a - b$\n'
    )
  })

  await t.test('should prevent breaking out of code (#)', async function () {
    assert.equal(
      toMarkdown(
        {type: 'inlineMath', value: 'a\n#'},
        {extensions: [mathToMarkdown()]}
      ),
      '$a #$\n'
    )
  })

  await t.test(
    'should prevent breaking out of code (\\d\\.)',
    async function () {
      assert.equal(
        toMarkdown(
          {type: 'inlineMath', value: 'a\n1. '},
          {extensions: [mathToMarkdown()]}
        ),
        '$a 1. $\n'
      )
    }
  )

  await t.test('should prevent breaking out of code (cr)', async function () {
    assert.equal(
      toMarkdown(
        {type: 'inlineMath', value: 'a\r- b'},
        {extensions: [mathToMarkdown()]}
      ),
      '$a - b$\n'
    )
  })

  await t.test('should prevent breaking out of code (crlf)', async function () {
    assert.equal(
      toMarkdown(
        {type: 'inlineMath', value: 'a\r\n- b'},
        {extensions: [mathToMarkdown()]}
      ),
      '$a - b$\n'
    )
  })
})
