import { isNextRouterError } from '../../../../client/components/is-next-router-error'
import {
  formatConsoleArgs,
  parseConsoleArgs,
} from '../../../../client/lib/console'
import isError from '../../../../lib/is-error'
import { createConsoleError } from '../../../shared/console-error'
import { coerceError, setOwnerStackIfAvailable } from './stitched-error'
import { forwardUnhandledError, logUnhandledRejection } from '../forward-logs'
import type { RuntimeErrorMetadata } from '../../../../server/dev/hot-reloader-types'
import { isRecoverableError } from '../../../../client/react-client-callbacks/on-recoverable-error'
import { dispatcher } from 'next/dist/compiled/next-devtools'
import { takeRuntimeErrorMetadata } from './runtime-error-metadata'

const queueMicroTask =
  globalThis.queueMicrotask || ((cb: () => void) => Promise.resolve().then(cb))

export function handleConsoleError(
  originError: unknown,
  consoleErrorArgs: any[]
) {
  let error: Error
  const { environmentName } = parseConsoleArgs(consoleErrorArgs)
  if (isError(originError)) {
    error = createConsoleError(originError, environmentName)
  } else {
    error = createConsoleError(
      formatConsoleArgs(consoleErrorArgs),
      environmentName
    )
  }
  setOwnerStackIfAvailable(error)

  queueMicroTask(() => dispatcher.onUnhandledError(error))
}

export function handleClientError(
  error: Error,
  metadata?: RuntimeErrorMetadata
) {
  const occurrence = metadata ?? takeRuntimeErrorMetadata(error)
  // The overlay queues events until its own root mounts. Do not depend on
  // HotReload committing: an initial application failure can prevent that.
  queueMicroTask(() => dispatcher.onUnhandledError(error, occurrence))
}

function onUnhandledError(event: WindowEventMap['error']): void | boolean {
  const thrownValue: unknown = event.error
  if (isNextRouterError(thrownValue)) {
    event.preventDefault()
    return false
  }
  // When there's an error property present, we log the error to error overlay.
  // Otherwise we don't do anything as it's not logging in the console either.
  if (thrownValue) {
    const error = coerceError(thrownValue)
    setOwnerStackIfAvailable(error)
    handleClientError(
      error,
      takeRuntimeErrorMetadata(error) ??
        (isRecoverableError(error) ? undefined : { fatal: false })
    )
    forwardUnhandledError(error)
  }
}

function onUnhandledRejection(ev: WindowEventMap['unhandledrejection']): void {
  const reason: unknown = ev?.reason
  if (isNextRouterError(reason)) {
    ev.preventDefault()
    return
  }

  const error = coerceError(reason)
  setOwnerStackIfAvailable(error)

  dispatcher.onUnhandledRejection(error, { fatal: false })

  logUnhandledRejection(reason)
}

export function handleGlobalErrors() {
  if (typeof window !== 'undefined') {
    try {
      // Increase the number of stack frames on the client
      Error.stackTraceLimit = 50
    } catch {}

    window.addEventListener('error', onUnhandledError)
    window.addEventListener('unhandledrejection', onUnhandledRejection)
  }
}
