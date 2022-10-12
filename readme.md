# mdast-util-math

[![Build][build-badge]][build]
[![Coverage][coverage-badge]][coverage]
[![Downloads][downloads-badge]][downloads]
[![Size][size-badge]][size]
[![Sponsors][sponsors-badge]][collective]
[![Backers][backers-badge]][collective]
[![Chat][chat-badge]][chat]

[mdast][] extensions to parse and serialize math (`$C_L$`).

## Contents

*   [What is this?](#what-is-this)
*   [When to use this](#when-to-use-this)
*   [Install](#install)
*   [Use](#use)
*   [API](#api)
    *   [`mathFromMarkdown()`](#mathfrommarkdown)
    *   [`mathToMarkdown(options?)`](#mathtomarkdownoptions)
*   [HTML](#html)
*   [Syntax tree](#syntax-tree)
    *   [Nodes](#nodes)
    *   [Content model](#content-model)
*   [Types](#types)
*   [Compatibility](#compatibility)
*   [Related](#related)
*   [Contribute](#contribute)
*   [License](#license)

## What is this?

This package contains extensions that add support for math to
[`mdast-util-from-markdown`][mdast-util-from-markdown] and
[`mdast-util-to-markdown`][mdast-util-to-markdown].

## When to use this

These tools are all rather low-level.
In most cases, you’d want to use [`remark-math`][remark-math] with remark
instead.

This project is useful when you want to support math in markdown.
Extending markdown with a syntax extension makes the markdown less portable.
LaTeX equations are also quite hard.
But this mechanism works well when you want authors, that have some LaTeX
experience, to be able to embed rich diagrams of math in scientific text.

When working with `mdast-util-from-markdown`, you must combine this package with
[`micromark-extension-math`][extension].

This utility adds [fields on nodes][fields] so that the utility responsible for
turning mdast (markdown) nodes into hast (HTML) nodes,
[`mdast-util-to-hast`][mdast-util-to-hast], turns text (inline) math nodes into
`<span class="math math-inline">…</span>` and flow (block) math nodes into
`<div class="math math-display">…</div>`.

## Install

This package is [ESM only][esm].
In Node.js (version 12.20+, 14.14+, or 16.0+), install with [npm][]:

```sh
npm install mdast-util-math
```

In Deno with [`esm.sh`][esmsh]:

```js
import {mathFromMarkdown, mathToMarkdown} from 'https://esm.sh/mdast-util-math@2'
```

In browsers with [`esm.sh`][esmsh]:

```html
<script type="module">
  import {mathFromMarkdown, mathToMarkdown} from 'https://esm.sh/mdast-util-math@2?bundle'
</script>
```

## Use

Say our document `example.md` contains:

```markdown
Lift($L$) can be determined by Lift Coefficient ($C_L$) like the following equation.

$$
L = \frac{1}{2} \rho v^2 S C_L
$$
```

…and our module `example.js` looks as follows:

```js
import fs from 'node:fs/promises'
import {fromMarkdown} from 'mdast-util-from-markdown'
import {toMarkdown} from 'mdast-util-to-markdown'
import {math} from 'micromark-extension-math'
import {mathFromMarkdown, mathToMarkdown} from 'mdast-util-math'

const doc = await fs.readFile('example.md')

const tree = fromMarkdown(doc, {
  extensions: [math()],
  mdastExtensions: [mathFromMarkdown()]
})

console.log(tree)

const out = toMarkdown(tree, {extensions: [mathToMarkdown()]})

console.log(out)
```

…now running `node example.js` yields (positional info and data removed for
brevity):

```js
{
  type: 'root',
  children: [
    {
      type: 'paragraph',
      children: [
        {type: 'text', value: 'Lift('},
        {type: 'inlineMath', value: 'L', data: {/* … */}},
        {type: 'text', value: ') can be determined by Lift Coefficient ('},
        {type: 'inlineMath', e: 'C_L', data: {/* … */}},
        {type: 'text', value: ') like the following equation.'}
      ]
    },
    {type: 'math', meta: null, value: 'L = \\frac{1}{2} \\rho v^2 S C_L', data: {/* … */}}
  ]
}
```

```markdown
Lift($L$) can be determined by Lift Coefficient ($C_L$) like the following equation.

$$
L = \frac{1}{2} \rho v^2 S C_L
$$
```

## API

This package exports the identifiers `mathFromMarkdown` and `mathToMarkdown`.
There is no default export.

### `mathFromMarkdown()`

Function that can be called to get an extension for
[`mdast-util-from-markdown`][mdast-util-from-markdown].

### `mathToMarkdown(options?)`

Function that can be called to get an extension for
[`mdast-util-to-markdown`][mdast-util-to-markdown].

##### `options`

Configuration (optional).

###### `options.singleDollarTextMath`

Whether to support text math (inline) with a single dollar (`boolean`, default:
`true`).
Single dollars work in Pandoc and many other places, but often interfere with
“normal” dollars in text.

## HTML

This plugin integrates with [`mdast-util-to-hast`][mdast-util-to-hast].
When mdast is turned into hast the math nodes are turned into
`<span class="math math-inline">…</span>` and
`<div class="math math-display">…</div>` elements.

## Syntax tree

The following interfaces are added to **[mdast][]** by this utility.

### Nodes

#### `Math`

```idl
interface Math <: Literal {
  type: "code"
  meta: string?
}
```

**Math** ([**Literal**][dfn-literal]) represents a block of math,
such as LaTeX mathematical expressions.

**Math** can be used where [**flow**][dfn-flow-content] content is expected.
Its content is represented by its `value` field.

This node relates to the [**phrasing**][dfn-phrasing-content] content concept
[**InlineMath**][dfn-inline-math].

A `meta` field can be present.
It represents custom information relating to the node.

For example, the following markdown:

```markdown
$$
L = \frac{1}{2} \rho v^2 S C_L
$$
```

Yields:

```js
{
  type: 'math',
  meta: null,
  value: 'L = \\frac{1}{2} \\rho v^2 S C_L',
  data: {/* … */}
}
```

#### `InlineMath`

```idl
interface InlineMath <: Literal {
  type: "inlineMath"
}
```

**InlineMath** ([**Literal**][dfn-literal]) represents a fragment of computer
code, such as a file name, computer program, or anything a computer could parse.

**InlineMath** can be used where [**phrasing**][dfn-phrasing-content] content
is expected.
Its content is represented by its `value` field.

This node relates to the [**flow**][dfn-flow-content] content concept
[**Math**][dfn-math].

For example, the following markdown:

```markdown
$L$
```

Yields:

```js
{type: 'inlineMath', value: 'L', data: {/* … */}}
```

### Content model

#### `FlowContent` (math)

```idl
type FlowContentMath = Math | FlowContent
```

#### `PhrasingContent` (math)

```idl
type PhrasingMath = InlineMath | PhrasingContent
```

## Types

This package is fully typed with [TypeScript][].
It exports the additional types `Math`, `InlineMath`, and `ToOptions`.

It also registers the node types with `@types/mdast`.
If you’re working with the syntax tree, make sure to import this utility
somewhere in your types, as that registers the new node types in the tree.

```js
/**
 * @typedef {import('mdast-util-math')}
 */

import {visit} from 'unist-util-visit'

/** @type {import('mdast').Root} */
const tree = getMdastNodeSomeHow()

visit(tree, (node) => {
  // `node` can now be one of the nodes for math.
})
```

## Compatibility

Projects maintained by the unified collective are compatible with all maintained
versions of Node.js.
As of now, that is Node.js 12.20+, 14.14+, and 16.0+.
Our projects sometimes work with older versions, but this is not guaranteed.

This plugin works with `mdast-util-from-markdown` version 1+ and
`mdast-util-to-markdown` version 1+.

## Related

*   [`remarkjs/remark-math`][remark-math]
    — remark plugin to support math
*   [`micromark/micromark-extension-math`][extension]
    — micromark extension to parse math

## Contribute

See [`contributing.md`][contributing] in [`syntax-tree/.github`][health] for
ways to get started.
See [`support.md`][support] for ways to get help.

This project has a [code of conduct][coc].
By interacting with this repository, organization, or community you agree to
abide by its terms.

## License

[MIT][license] © [Titus Wormer][author]

<!-- Definitions -->

[build-badge]: https://github.com/syntax-tree/mdast-util-math/workflows/main/badge.svg

[build]: https://github.com/syntax-tree/mdast-util-math/actions

[coverage-badge]: https://img.shields.io/codecov/c/github/syntax-tree/mdast-util-math.svg

[coverage]: https://codecov.io/github/syntax-tree/mdast-util-math

[downloads-badge]: https://img.shields.io/npm/dm/mdast-util-math.svg

[downloads]: https://www.npmjs.com/package/mdast-util-math

[size-badge]: https://img.shields.io/bundlephobia/minzip/mdast-util-math.svg

[size]: https://bundlephobia.com/result?p=mdast-util-math

[sponsors-badge]: https://opencollective.com/unified/sponsors/badge.svg

[backers-badge]: https://opencollective.com/unified/backers/badge.svg

[collective]: https://opencollective.com/unified

[chat-badge]: https://img.shields.io/badge/chat-discussions-success.svg

[chat]: https://github.com/syntax-tree/unist/discussions

[npm]: https://docs.npmjs.com/cli/install

[esm]: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c

[esmsh]: https://esm.sh

[typescript]: https://www.typescriptlang.org

[license]: license

[author]: https://wooorm.com

[health]: https://github.com/syntax-tree/.github

[contributing]: https://github.com/syntax-tree/.github/blob/main/contributing.md

[support]: https://github.com/syntax-tree/.github/blob/main/support.md

[coc]: https://github.com/syntax-tree/.github/blob/main/code-of-conduct.md

[remark-math]: https://github.com/remarkjs/remark-math

[mdast]: https://github.com/syntax-tree/mdast

[mdast-util-from-markdown]: https://github.com/syntax-tree/mdast-util-from-markdown

[mdast-util-to-markdown]: https://github.com/syntax-tree/mdast-util-to-markdown

[mdast-util-to-hast]: https://github.com/syntax-tree/mdast-util-to-hast

[extension]: https://github.com/micromark/micromark-extension-math

[fields]: https://github.com/syntax-tree/mdast-util-to-hast#fields-on-nodes

[dfn-literal]: https://github.com/syntax-tree/mdast#literal

[dfn-flow-content]: #flowcontent-math

[dfn-phrasing-content]: #phrasingcontent-math

[dfn-inline-math]: #inlinemath

[dfn-math]: #math
