var test = require('tape')
var fromMarkdown = require('mdast-util-from-markdown')
var toMarkdown = require('mdast-util-to-markdown')
var syntax = require('micromark-extension-math')
var math = require('.')

test('markdown -> mdast', function (t) {
  t.deepEqual(
    fromMarkdown('a $b$ c', {
      extensions: [syntax],
      mdastExtensions: [math.fromMarkdown]
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

  t.deepEqual(
    fromMarkdown('$$\na\n$$', {
      extensions: [syntax],
      mdastExtensions: [math.fromMarkdown]
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

  t.deepEqual(
    fromMarkdown('$$a&amp;b\\&c\n', {
      extensions: [syntax],
      mdastExtensions: [math.fromMarkdown]
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

  t.deepEqual(
    fromMarkdown('$a\nb\nb$', {
      extensions: [syntax],
      mdastExtensions: [math.fromMarkdown]
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

  t.end()
})

test('mdast -> markdown', function (t) {
  t.deepEqual(
    toMarkdown(
      {type: 'inlineMath', value: 'a'},
      {extensions: [math.toMarkdown]}
    ),
    '$a$\n',
    'should serialize math (text)'
  )

  t.deepEqual(
    toMarkdown({type: 'inlineMath'}, {extensions: [math.toMarkdown]}),
    '$$\n',
    'should serialize math (text) w/o `value`'
  )

  t.deepEqual(
    toMarkdown(
      {type: 'inlineMath', value: 'a \\$ b'},
      {extensions: [math.toMarkdown]}
    ),
    '$$a \\$ b$$\n',
    'should serialize math (text) w/ two dollar signs when including a dollar'
  )

  t.deepEqual(
    toMarkdown(
      {type: 'inlineMath', value: 'a \\$'},
      {extensions: [math.toMarkdown]}
    ),
    '$$ a \\$ $$\n',
    'should serialize math (text) w/ padding when ending in a dollar sign'
  )

  t.deepEqual(
    toMarkdown(
      {type: 'inlineMath', value: '$ a'},
      {extensions: [math.toMarkdown]}
    ),
    '$$ $ a $$\n',
    'should serialize math (text) w/ padding when starting in a dollar sign'
  )

  t.deepEqual(
    toMarkdown({type: 'math', value: 'a'}, {extensions: [math.toMarkdown]}),
    '$$\na\n$$\n',
    'should serialize math (flow)'
  )

  t.deepEqual(
    toMarkdown({type: 'math'}, {extensions: [math.toMarkdown]}),
    '$$\n$$\n',
    'should serialize math (flow) w/o `value`'
  )

  t.deepEqual(
    toMarkdown({type: 'math', meta: 'a'}, {extensions: [math.toMarkdown]}),
    '$$a\n$$\n',
    'should serialize math (flow) w/ `meta`'
  )

  t.deepEqual(
    toMarkdown({type: 'math', value: '$$'}, {extensions: [math.toMarkdown]}),
    '$$$\n$$\n$$$\n',
    'should serialize math (flow) w/ more dollars than occur together in `value`'
  )

  t.deepEqual(
    toMarkdown({type: 'math', meta: 'a'}, {extensions: [math.toMarkdown]}),
    '$$a\n$$\n',
    'should serialize math (flow) w/ `meta`'
  )

  t.deepEqual(
    toMarkdown(
      {type: 'paragraph', children: [{type: 'text', value: 'a $ b'}]},
      {extensions: [math.toMarkdown]}
    ),
    'a \\$ b\n',
    'should escape `$` in phrasing'
  )

  t.deepEqual(
    toMarkdown(
      {
        type: 'paragraph',
        children: [
          {type: 'text', value: 'a $'},
          {type: 'inlineMath', value: 'b'},
          {type: 'text', value: '$ c'}
        ]
      },
      {extensions: [math.toMarkdown]}
    ),
    'a \\$$b$\\$ c\n',
    'should escape `$` around math (text)'
  )

  t.deepEqual(
    toMarkdown(
      {type: 'definition', label: 'a', url: 'b', title: 'a\n$\nb'},
      {extensions: [math.toMarkdown]}
    ),
    '[a]: b "a\n$\nb"\n',
    'should not escape `$` at the start of a line'
  )

  t.deepEqual(
    toMarkdown(
      {type: 'math', meta: 'a\rb\nc'},
      {extensions: [math.toMarkdown]}
    ),
    '$$a&#xD;b\nc\n$$\n',
    'should escape `\\r`, `\\n` when in `meta` of math (flow)'
  )

  t.deepEqual(
    toMarkdown({type: 'math', meta: 'a$b'}, {extensions: [math.toMarkdown]}),
    '$$a&#x24;b\n$$\n',
    'should escape `$` when in `meta` of math (flow)'
  )

  t.end()
})
