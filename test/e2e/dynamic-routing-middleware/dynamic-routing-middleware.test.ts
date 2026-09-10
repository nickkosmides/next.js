import { nextTestSetup, isNextDev } from 'e2e-utils'
import { join } from 'path'
import { runTests } from '../dynamic-routing/shared'

// This suite calls next.patchFile() to change fixture files after setup.
// Deployment mode cannot mutate the deployed fixture.
// @force-gate !deploy
describe('Dynamic Routing with Middleware', () => {
  const { next, isTurbopack } = nextTestSetup({
    files: join(__dirname, '../dynamic-routing'),
    skipStart: true,
    disableAutoSkewProtection: true,
  })

  beforeAll(async () => {
    await next.patchFile(
      'middleware.js',
      `
import { NextResponse } from 'next/server'
export default function middleware() {
  return NextResponse.next()
}
`
    )
    await next.start()
  })

  runTests({ next, isNextDev, isTurbopack, middlewareEnabled: true })
})
