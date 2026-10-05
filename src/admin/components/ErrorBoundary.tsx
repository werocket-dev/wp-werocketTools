import { Component, type ErrorInfo, type ReactNode } from 'react'
import { IconAlertTriangle } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface Props {
  children: ReactNode
  /** Change de valeur → l'erreur est oubliée (ex : changement d'onglet). */
  resetKey?: unknown
  /**
   * Boundary racine (autour de <App />) : quand il s'affiche, App est démonté
   * et avec lui #werocket-app, qui porte les tokens du thème — on le recrée.
   */
  standalone?: boolean
}

interface State {
  error: Error | null
}

/**
 * Sans boundary, une exception de rendu démonte TOUT l'arbre React : l'admin
 * devenait une page blanche (réglage legacy au mauvais format, réponse REST
 * altérée par un plugin tiers…). On affiche l'erreur à la place, ce qui
 * garde le reste de l'interface utilisable et rend le bug diagnostiquable.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[WeRocketTools] Erreur de rendu', error, info.componentStack)
  }

  componentDidUpdate(prev: Props) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) {
      this.setState({ error: null })
    }
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    const card = (
      <Card className="my-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconAlertTriangle size={20} className="text-destructive" />
            Une erreur empêche l'affichage de cette page
          </CardTitle>
          <CardDescription>
            Le reste du plugin continue de fonctionner. Si le problème persiste,
            transmettez le message ci-dessous au support.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted text-muted-foreground rounded-2xl p-4 text-xs whitespace-pre-wrap break-words">
            {error.message || String(error)}
          </pre>
        </CardContent>
        <CardFooter className="gap-2">
          <Button variant="outline" onClick={() => this.setState({ error: null })}>
            Réessayer
          </Button>
          <Button variant="ghost" onClick={() => window.location.reload()}>
            Recharger la page
          </Button>
        </CardFooter>
      </Card>
    )

    return this.props.standalone
      ? <div id="werocket-app" className="werocket-wrap mr-4">{card}</div>
      : card
  }
}
