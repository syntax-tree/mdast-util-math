import type {Literal} from 'mdast'

export {mathFromMarkdown, mathToMarkdown} from './lib/index.js'

export type {ToOptions} from './lib/index.js'

/**
 * Math (flow).
 */
export interface Math extends Literal {
  /**
   * Node type.
   */
  type: 'math'

  /**
   * Custom information relating to the node.
   */
  meta?: string | null | undefined
}

/**
 * Math (text).
 */
export interface InlineMath extends Literal {
  /**
   * Node type.
   */
  type: 'inlineMath'
}

// Add custom data tracked to turn markdown into a tree.
declare module 'mdast-util-from-markdown' {
  interface CompileData {
    /**
     * Whether we’re in math (flow).
     */
    mathFlowInside?: boolean | undefined
  }
}

// Add custom data tracked to turn a tree into markdown.
declare module 'mdast-util-to-markdown' {
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
  interface BlockContentMap {
    math: Math
  }

  interface PhrasingContentMap {
    inlineMath: InlineMath
  }

  interface RootContentMap {
    inlineMath: InlineMath
    math: Math
  }
}
