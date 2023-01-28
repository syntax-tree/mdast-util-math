import type {Literal} from 'mdast'

export {mathFromMarkdown, mathToMarkdown} from './lib/index.js'

export type {ToOptions} from './lib/index.js'

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface Math extends Literal {
  type: 'math'
  meta?: string | null
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface InlineMath extends Literal {
  type: 'inlineMath'
}

// Add custom data tracked to turn markdown into a tree.
declare module 'mdast-util-from-markdown' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface CompileData {
    /**
     * Whether we’re in math (flow).
     */
    mathFlowInside?: boolean | undefined
  }
}

// Add custom data tracked to turn a tree into markdown.
declare module 'mdast-util-to-markdown' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface ConstructNameMap {
    /**
     * Math (flow).
     *
     * ```markdown
     * > | $$
     *     ^^
     * > | a
     *     ^
     * > | $$
     *     ^^
     * ```
     */
    mathFlow: 'mathFlow'

    /**
     * Math (flow) meta flag.
     *
     * ```markdown
     * > | $$a
     *       ^
     *   | b
     *   | $$
     * ```
     */
    mathFlowMeta: 'mathFlowMeta'
  }
}

// Add nodes to tree.
declare module 'mdast' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface StaticPhrasingContentMap {
    inlineMath: InlineMath
  }

  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface BlockContentMap {
    math: Math
  }
}
