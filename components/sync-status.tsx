'use client'

import { useEffect, useState } from 'react'
import { db } from '@/db'
import type { SyncStatus } from '@/lib/sync'

interface SyncStatusIndicatorProps {
  /** Current sync status. If not provided, derives from sync_queue count. */
  status?: SyncStatus
}

const STATUS_CONFIG: Record<SyncStatus, { label: string; color: string; dot: string }> = {
  synced: { label: 'Synced', color: 'text-green-500', dot: 'bg-green-500' },
  pending: { label: 'Pending sync', color: 'text-yellow-500', dot: 'bg-yellow-500' },
  conflict: { label: 'Conflict', color: 'text-red-500', dot: 'bg-red-500' },
  syncing: { label: 'Syncing…', color: 'text-blue-400', dot: 'bg-blue-400 animate-pulse' },
  error: { label: 'Sync error', color: 'text-red-400', dot: 'bg-red-400' },
}

export function SyncStatusIndicator({ status: propStatus }: SyncStatusIndicatorProps) {
  const [derivedStatus, setDerivedStatus] = useState<SyncStatus>('synced')

  useEffect(() => {
    if (propStatus) return

    async function check() {
      const count = await db.sync_queue.count()
      setDerivedStatus(count > 0 ? 'pending' : 'synced')
    }

    check()
    // Re-check every 30 seconds
    const interval = setInterval(check, 30_000)
    return () => clearInterval(interval)
  }, [propStatus])

  const status = propStatus ?? derivedStatus
  const config = STATUS_CONFIG[status]

  return (
    <div className={`flex items-center gap-1.5 text-xs ${config.color}`} title={config.label}>
      <span className={`h-2 w-2 rounded-full ${config.dot}`} />
      <span>{config.label}</span>
    </div>
  )
}
