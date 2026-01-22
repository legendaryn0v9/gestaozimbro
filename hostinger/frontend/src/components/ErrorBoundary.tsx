import React from 'react';

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
};

/**
 * Evita tela totalmente “em branco” quando ocorre um erro JS.
 * Obs.: não impede crash do WebView do iOS, mas melhora muito a recuperação.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    // Log para debug (aparece no console do navegador)
    console.error('Erro não tratado (ErrorBoundary):', error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center p-6">
        <div className="glass rounded-2xl p-6 max-w-md w-full text-center space-y-4">
          <h1 className="text-xl font-display font-bold text-foreground">Algo deu errado</h1>
          <p className="text-sm text-muted-foreground">
            Se a tela ficou vazia/travou, toque em “Recarregar”.
          </p>
          <div className="flex gap-2 justify-center">
            <button
              type="button"
              className="h-11 px-4 rounded-xl bg-gradient-amber text-primary-foreground font-semibold"
              onClick={() => window.location.reload()}
            >
              Recarregar
            </button>
            <button
              type="button"
              className="h-11 px-4 rounded-xl bg-secondary text-secondary-foreground border border-border"
              onClick={() => (window.location.href = '/auth')}
            >
              Ir para login
            </button>
          </div>
        </div>
      </div>
    );
  }
}
