'use server'

import { appendLaunchChecklistItem } from '@/lib/releases'

export async function addLaunchCheck(formData: FormData) {
  const item = formData.get('item')
  if (typeof item !== 'string' || item.trim() === '') return

  await appendLaunchChecklistItem(item.trim())
}
