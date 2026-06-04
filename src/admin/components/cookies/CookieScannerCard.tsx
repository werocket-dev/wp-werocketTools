import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  IconRadar2, IconLoader2, IconPlayerPlay, IconCircleCheck, IconCircleX,
  IconAlertTriangle, IconCookie, IconHistory, IconDownload,
  IconCircleDashed, IconWorld,
} from '@tabler/icons-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import type {
  CookieService, ScanFinalizeResponse, ScanHistoryItem, ScanProgressItem,
  ScanStartResponse, ScanImportResponse, ScannedCookie,
} from '@/lib/types'

import { runScan } from './scanRunner'

type Props = {
  cookieName: string
  storageMethod: 'cookie' | 'localStorage'
  services: CookieService[]
  onServicesImported: () => void
}

const PURPOSE_LABELS: Record<string, string> = {
  necessary: 'Nécessaire',
  analytics: 'Statistiques',
  marketing: 'Marketing',
  preferences: 'Préférences',
}

const PURPOSE_TONE: Record<string, string> = {
  necessary: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900',
  analytics: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-900',
  marketing: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-900',
  preferences: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900',
}

export function CookieScannerCard({ cookieName, storageMethod, services, onServicesImported }: Props) {
  const defaultUrl = useMemo(() => window.location.origin + '/', [])
  const [urlsText, setUrlsText] = useState(defaultUrl)
  const [scanning, setScanning] = useState(false)
  const [progress, setProgress] = useState<ScanProgressItem[]>([])
  const [result, setResult] = useState<ScanFinalizeResponse | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [history, setHistory] = useState<ScanHistoryItem[]>([])
  const [importing, setImporting] = useState(false)

  useEffect(() => { void loadHistory() }, [])

  async function loadHistory() {
    try {
      const data = await api.get<{ scans: ScanHistoryItem[] }>('/cookies/scan/history')
      setHistory(data.scans)
    } catch { /* silent */ }
  }

  async function handleScan() {
    const urls = urlsText.split('\n').map(u => u.trim()).filter(Boolean)
    if (urls.length === 0) {
      toast.error('Ajoutez au moins une URL à scanner')
      return
    }

    setScanning(true)
    setResult(null)
    setSelected(new Set())
    setProgress(urls.map(url => ({ url, status: 'pending' })))

    try {
      const start = await api.post<ScanStartResponse>('/cookies/scan/start', { urls })

      await runScan({
        scanId: start.id,
        token: start.token,
        urls: start.urls,
        cookieName,
        services,
        storageMethod,
        onProgress: setProgress,
      })

      const final = await api.post<ScanFinalizeResponse>('/cookies/scan/finalize', {
        scan_id: start.id,
        token: start.token,
      })

      setResult(final)
      setSelected(defaultSelection(final.cookies))
      toast.success(`Scan terminé · ${final.summary.cookies_total} cookie(s) détecté(s)`)
      void loadHistory()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur durant le scan')
    } finally {
      setScanning(false)
    }
  }

  async function handleImport() {
    if (!result || selected.size === 0) return
    const serviceIds = uniqueServiceIds(result.cookies, selected)
    if (serviceIds.length === 0) {
      toast.error('Aucun cookie sélectionné n\'est rattaché à un service connu')
      return
    }

    setImporting(true)
    try {
      const res = await api.post<ScanImportResponse>('/cookies/scan/import', { service_ids: serviceIds })
      const total = res.imported.length + res.updated.length
      toast.success(`${total} service(s) ajouté(s) ou mis à jour`)
      onServicesImported()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur durant l\'import')
    } finally {
      setImporting(false)
    }
  }

  const grouped = useMemo(() => result ? groupByService(result.cookies) : [], [result])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="font-bold flex items-center gap-2">
              <IconRadar2 className="size-5" /> Scanner de cookies
            </CardTitle>
            <CardDescription>
              Visite les URLs ci-dessous en arrière-plan et identifie automatiquement les cookies posés.
              Les cookies HTTP-only et les cookies posés sur des pages non scannées resteront invisibles.
            </CardDescription>
          </div>
          <Button onClick={handleScan} disabled={scanning} type="button">
            {scanning ? <IconLoader2 className="size-4 animate-spin" /> : <IconPlayerPlay className="size-4" />}
            {scanning ? 'Scan en cours…' : 'Lancer un scan'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="scan-urls" className="text-xs text-muted-foreground">
            URLs à scanner (une par ligne · même domaine uniquement)
          </Label>
          <Textarea
            id="scan-urls"
            value={urlsText}
            onChange={e => setUrlsText(e.target.value)}
            rows={3}
            disabled={scanning}
            className="font-mono text-xs"
            placeholder={defaultUrl}
          />
        </div>

        {progress.length > 0 && scanning && (
          <ProgressList items={progress} />
        )}

        {result && !scanning && (
          <>
            <Separator />
            <ResultSummary result={result} />

            {grouped.length > 0 && (
              <>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h4 className="text-sm font-semibold">Cookies détectés</h4>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelected(defaultSelection(result.cookies))}
                    >
                      Présélectionner
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelected(new Set())}
                    >
                      Tout désélectionner
                    </Button>
                  </div>
                </div>

                <div className="border rounded-2xl divide-y overflow-hidden">
                  {grouped.map(group => (
                    <ServiceGroup
                      key={group.key}
                      group={group}
                      selected={selected}
                      onToggle={(name) => toggleOne(name, setSelected)}
                      onToggleGroup={(names, checked) => toggleMany(names, checked, setSelected)}
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-muted-foreground">
                    {selectableCount(result.cookies, selected)} cookie(s) prêt(s) à être importé(s) dans vos services.
                  </p>
                  <Button
                    type="button"
                    onClick={handleImport}
                    disabled={importing || selectableCount(result.cookies, selected) === 0}
                  >
                    {importing ? <IconLoader2 className="size-4 animate-spin" /> : <IconDownload className="size-4" />}
                    Importer la sélection
                  </Button>
                </div>
              </>
            )}

            {result.domains.length > 0 && (
              <ThirdPartyDomains result={result} />
            )}
          </>
        )}

        {history.length > 0 && (
          <ScanHistoryList history={history} />
        )}
      </CardContent>
    </Card>
  )
}

// ──────────────────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────────────────

function ProgressList({ items }: { items: ScanProgressItem[] }) {
  return (
    <div className="space-y-1.5">
      {items.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <StatusIcon status={p.status} />
          <span className="flex-1 truncate font-mono text-muted-foreground">{p.url}</span>
          {p.status === 'done' && (
            <Badge variant="outline" className="font-normal">
              {p.cookies_found ?? 0} cookie(s)
            </Badge>
          )}
          {p.status === 'error' && (
            <span className="text-destructive">{p.error ?? 'erreur'}</span>
          )}
        </div>
      ))}
    </div>
  )
}

function StatusIcon({ status }: { status: ScanProgressItem['status'] }) {
  switch (status) {
    case 'visiting': return <IconLoader2 className="size-3.5 animate-spin text-primary" />
    case 'done':     return <IconCircleCheck className="size-3.5 text-emerald-600" />
    case 'error':    return <IconCircleX className="size-3.5 text-destructive" />
    default:         return <IconCircleDashed className="size-3.5 text-muted-foreground" />
  }
}

function ResultSummary({ result }: { result: ScanFinalizeResponse }) {
  const s = result.summary
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Stat label="Cookies détectés" value={s.cookies_total} />
      <Stat label="Nouveaux" value={s.cookies_new} accent={s.cookies_new > 0} />
      <Stat label="Inconnus" value={s.cookies_unknown} warning={s.cookies_unknown > 0} />
      <Stat label="Services identifiés" value={s.services_found} />
    </div>
  )
}

function Stat({ label, value, accent, warning }: { label: string; value: number; accent?: boolean; warning?: boolean }) {
  return (
    <div className={cn(
      'rounded-2xl border bg-card p-3',
      accent && 'border-primary/40 bg-primary/5',
      warning && 'border-amber-300/60 bg-amber-50/50 dark:bg-amber-950/30 dark:border-amber-900',
    )}>
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </div>
  )
}

interface CookieGroup {
  key: string
  serviceId: string | null
  serviceTitle: string
  provider: string | null
  purpose: string | null
  classified: boolean
  cookies: ScannedCookie[]
  importable: boolean
}

function ServiceGroup({
  group, selected, onToggle, onToggleGroup,
}: {
  group: CookieGroup
  selected: Set<string>
  onToggle: (name: string) => void
  onToggleGroup: (names: string[], checked: boolean) => void
}) {
  const names = group.cookies.map(c => c.name)
  const selectedInGroup = names.filter(n => selected.has(n)).length
  const allSelected = selectedInGroup === names.length && names.length > 0
  const someSelected = selectedInGroup > 0 && !allSelected

  return (
    <div className="bg-card">
      <div className="flex items-center gap-3 px-4 py-3 bg-muted/30">
        <Checkbox
          checked={allSelected ? true : someSelected ? 'indeterminate' : false}
          onCheckedChange={(c) => onToggleGroup(names, c === true)}
          disabled={!group.importable}
          aria-label={`Sélectionner ${group.serviceTitle}`}
        />
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm flex items-center gap-2 flex-wrap">
            {group.serviceTitle}
            {group.purpose && (
              <span className={cn('text-[10px] uppercase tracking-wide font-semibold px-1.5 py-0.5 rounded border', PURPOSE_TONE[group.purpose] ?? '')}>
                {PURPOSE_LABELS[group.purpose] ?? group.purpose}
              </span>
            )}
            {!group.classified && (
              <Badge variant="outline" className="font-normal flex items-center gap-1">
                <IconAlertTriangle className="size-3" /> Inconnu
              </Badge>
            )}
          </div>
          {group.provider && (
            <div className="text-xs text-muted-foreground truncate">{group.provider}</div>
          )}
        </div>
        <Badge variant="secondary" className="font-normal">{names.length}</Badge>
      </div>

      <ul className="divide-y">
        {group.cookies.map(c => (
          <li key={c.name} className="flex items-center gap-3 px-4 py-2 pl-12">
            <Checkbox
              checked={selected.has(c.name)}
              onCheckedChange={() => onToggle(c.name)}
              disabled={!group.importable}
            />
            <IconCookie className="size-3.5 text-muted-foreground shrink-0" />
            <code className="text-xs font-mono flex-1 truncate">{c.name}</code>
            {c.is_new && <Badge className="font-normal">Nouveau</Badge>}
            {c.in_settings && <Badge variant="outline" className="font-normal">Déjà configuré</Badge>}
          </li>
        ))}
      </ul>
    </div>
  )
}

function ThirdPartyDomains({ result }: { result: ScanFinalizeResponse }) {
  const interesting = result.domains.filter(d => d.classified && !d.cookie_seen)
  if (interesting.length === 0) return null

  return (
    <div className="space-y-2 pt-2">
      <h4 className="text-sm font-semibold flex items-center gap-2">
        <IconWorld className="size-4" /> Services chargés sans cookie posé
      </h4>
      <p className="text-xs text-muted-foreground">
        Ces services tiers ont été détectés mais n'ont pas posé de cookie pendant le scan.
        Probablement parce que le consentement n'était pas accordé ou que le tracker n'a pas encore fait sa requête.
      </p>
      <div className="flex flex-wrap gap-1.5">
        {interesting.map(d => (
          <Badge key={d.domain} variant="outline" className="font-normal">
            {d.service_title ?? d.domain}
          </Badge>
        ))}
      </div>
    </div>
  )
}

function ScanHistoryList({ history }: { history: ScanHistoryItem[] }) {
  return (
    <details className="pt-2">
      <summary className="text-sm font-semibold cursor-pointer flex items-center gap-2 select-none">
        <IconHistory className="size-4" /> Historique ({history.length})
      </summary>
      <ul className="mt-3 space-y-1.5 text-xs">
        {history.slice(0, 10).map(h => (
          <li key={h.id} className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-muted/30">
            <span className="font-mono text-muted-foreground">{formatDate(h.started_at)}</span>
            <span>{h.cookies_count} cookie(s) · {h.new_count} nouveau(x)</span>
            <Badge variant="outline" className="font-normal">{h.status}</Badge>
          </li>
        ))}
      </ul>
    </details>
  )
}

// ──────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────

function groupByService(cookies: ScannedCookie[]): CookieGroup[] {
  const map = new Map<string, CookieGroup>()
  for (const c of cookies) {
    const key = c.service_id ?? `__unknown:${c.name}`
    let g = map.get(key)
    if (!g) {
      g = {
        key,
        serviceId:    c.service_id,
        serviceTitle: c.service_title ?? c.name,
        provider:     c.provider,
        purpose:      c.purpose,
        classified:   c.classified,
        cookies:      [],
        importable:   c.classified && c.service_id !== null,
      }
      map.set(key, g)
    }
    g.cookies.push(c)
  }
  // Classified first, then by service title
  return [...map.values()].sort((a, b) => {
    if (a.classified !== b.classified) return a.classified ? -1 : 1
    return a.serviceTitle.localeCompare(b.serviceTitle)
  })
}

function defaultSelection(cookies: ScannedCookie[]): Set<string> {
  const sel = new Set<string>()
  for (const c of cookies) {
    if (c.classified && c.service_id && !c.in_settings) {
      sel.add(c.name)
    }
  }
  return sel
}

function uniqueServiceIds(cookies: ScannedCookie[], selected: Set<string>): string[] {
  const ids = new Set<string>()
  for (const c of cookies) {
    if (!selected.has(c.name)) continue
    if (c.service_id) ids.add(c.service_id)
  }
  return [...ids]
}

function selectableCount(cookies: ScannedCookie[], selected: Set<string>): number {
  return cookies.filter(c => selected.has(c.name) && c.service_id).length
}

function toggleOne(name: string, setter: (updater: (prev: Set<string>) => Set<string>) => void) {
  setter(prev => {
    const next = new Set(prev)
    if (next.has(name)) next.delete(name)
    else next.add(name)
    return next
  })
}

function toggleMany(
  names: string[],
  checked: boolean,
  setter: (updater: (prev: Set<string>) => Set<string>) => void,
) {
  setter(prev => {
    const next = new Set(prev)
    for (const n of names) {
      if (checked) next.add(n)
      else next.delete(n)
    }
    return next
  })
}

function formatDate(ts: number): string {
  if (!ts) return '—'
  return new Date(ts * 1000).toLocaleString('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}
