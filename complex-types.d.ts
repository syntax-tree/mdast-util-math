import type {Literal} from 'mdast'

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
