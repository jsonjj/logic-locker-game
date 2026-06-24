import '../../styles/combat.css'

export interface GameOverProps {
  open: boolean
  onRestart: () => void
}

export default function GameOver({ open, onRestart }: GameOverProps) {
  if (!open) return null
  return (
    <div className="gameover-scrim" role="alertdialog" aria-label="Recaptured">
      <div className="gameover-card" data-ui>
        <div className="gameover-kicker">Lives depleted</div>
        <h2 className="gameover-title">Recaptured</h2>
        <p className="gameover-sub">
          The guards dragged you back to the cells. Your unlocked blocks and gear are safe — regroup
          and break out again.
        </p>
        <button type="button" className="btn btn-primary" onClick={onRestart}>
          Restart the run →
        </button>
      </div>
    </div>
  )
}
