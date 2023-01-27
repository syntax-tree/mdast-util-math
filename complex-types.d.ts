import type {Literal} from 'mdast'

declare module 'mdast-util-from-markdown' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface CompileData {
    /**
     * Whether we’re in math (flow).
     */
    mathFlowInside?: boolean | undefined
  }
}

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

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface Math extends Literal {
  type: 'math'
  meta?: string | null
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface InlineMath extends Literal {
  type: 'inlineMath'
}

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
