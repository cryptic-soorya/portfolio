import { createContext } from 'react'
import type Lenis from 'lenis'

/**
 * Provides the Lenis instance to any client subtree.
 * Defined here (not in SmoothScroll.tsx) so hooks can import the context
 * without creating a circular dependency with the provider.
 */
export const LenisContext = createContext<Lenis | null>(null)
