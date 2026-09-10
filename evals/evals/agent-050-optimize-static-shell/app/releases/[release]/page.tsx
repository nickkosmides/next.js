import {
  getLaunchChecklist,
  getLiveRollout,
  isKnownRelease,
} from '@/lib/releases'
import { LaunchChecklist, LiveRollout } from './release-panels'
import { notFound } from 'next/navigation'
import { addLaunchCheck } from './actions'

export const instant = false

export default async function ReleasePage({
  params,
}: PageProps<'/releases/[release]'>) {
  const { release } = await params

  if (!isKnownRelease(release)) {
    notFound()
  }

  const [checklist, rollout] = await Promise.all([
    getLaunchChecklist(),
    getLiveRollout(release),
  ])

  return (
    <main>
      <h1 data-testid="release-heading">Release operations</h1>
      <LaunchChecklist checklist={checklist} />
      <form action={addLaunchCheck}>
        <label htmlFor="check-item">New launch check</label>
        <input id="check-item" name="item" required />
        <button type="submit">Add check</button>
      </form>
      <LiveRollout rollout={rollout} />
    </main>
  )
}
