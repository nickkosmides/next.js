import { nextTestSetup, isNextDev, isNextStart } from 'e2e-utils'
import { BUILD_ID_FILE, BUILD_MANIFEST } from 'next/constants'

// This suite inspects the local dist directory and verifies that .next was not created.
// Deployment mode does not expose the generated build directories.
// @force-gate !deploy
describe('distDir', () => {
  const { next } = nextTestSetup({
    files: __dirname,
  })

  it('should render the page', async () => {
    const html = await next.render('/')
    expect(html).toMatch(/Hello World/)
  })

  it('should build the app within the given `dist` directory', async () => {
    if (isNextDev) {
      expect(await next.hasFile(`dist/dev/${BUILD_MANIFEST}`)).toBe(true)
    } else {
      expect(await next.hasFile(`dist/${BUILD_ID_FILE}`)).toBe(true)
    }
  })

  it('should not build the app within the default `.next` directory', async () => {
    expect(await next.hasFile('.next')).toBe(false)
  })
})

if (isNextStart) {
  // This suite runs next.build() to inspect build output or errors.
  // Deploy mode requires a successful deployment and cannot run these local builds.
  // @force-gate !deploy
  describe('distDir config validation', () => {
    const { next } = nextTestSetup({
      files: __dirname,
      skipStart: true,
    })

    it('should throw error with invalid distDir', async () => {
      const origConfig = await next.readFile('next.config.js')
      await next.patchFile('next.config.js', `module.exports = { distDir: '' }`)
      const { cliOutput } = await next.build()
      await next.patchFile('next.config.js', origConfig)

      expect(cliOutput).toContain(
        'Invalid distDir provided, distDir can not be an empty string. Please remove this config or set it to undefined'
      )
    })

    it('should handle undefined distDir', async () => {
      const origConfig = await next.readFile('next.config.js')
      await next.patchFile(
        'next.config.js',
        `module.exports = { distDir: undefined }`
      )
      const { cliOutput } = await next.build()
      await next.patchFile('next.config.js', origConfig)

      expect(cliOutput).not.toContain('Invalid distDir')
    })
  })
}
