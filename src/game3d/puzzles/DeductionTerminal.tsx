/**
 * [Agent 3] DEDUCTION TERMINAL — maps deductionGrid / miniGrid / singleCellGrid
 * steps onto the records-vault lock terminal. Tap a cell to cycle blank → ✓ → ✕,
 * then run the verify pass. Mismatched cells flash so the player can correct them.
 */
import { useMemo, useState } from 'react'
import type { DeductionGridStep, GridSymbol, SingleCellGridStep } from '../../types'
import { cellKey, checkGrid, wrongCells } from '../../logic/gridCheckers'
import type { DeviceCallbacks } from './types'

interface Props extends DeviceCallbacks {
  step: DeductionGridStep | SingleCellGridStep
}

const NEXT: Record<GridSymbol, GridSymbol> = {
  blank: 'check',
  check: 'X',
  X: 'blank',
}

function glyph(symbol: GridSymbol): string {
  if (symbol === 'check') return '✓'
  if (symbol === 'X') return '✕'
  return ''
}

export default function DeductionTerminal({ step, onSolved, onMistake }: Props) {
  const isSingle = step.type === 'singleCellGrid'
  const [marks, setMarks] = useState<Record<string, GridSymbol>>({})
  const [wrong, setWrong] = useState<string[]>([])
  const [attempts, setAttempts] = useState(0)
  const [solved, setSolved] = useState(false)

  const targetKey = isSingle ? cellKey(step.targetRow, step.targetCol) : null

  const clues = useMemo(() => step.clues ?? [], [step.clues])

  const cycle = (row: string, col: string) => {
    if (solved) return
    const key = cellKey(row, col)
    if (isSingle && key !== targetKey) return
    setMarks((prev) => ({ ...prev, [key]: NEXT[prev[key] ?? 'blank'] }))
    setWrong((w) => w.filter((k) => k !== key))
  }

  const verify = () => {
    if (solved) return
    if (isSingle && targetKey) {
      const value = marks[targetKey] ?? 'blank'
      if (value === step.correctAnswer) {
        setSolved(true)
        onSolved()
      } else {
        setWrong([targetKey])
        setAttempts((a) => a + 1)
        onMistake()
      }
      return
    }
    const grid = step as DeductionGridStep
    if (checkGrid(grid.rows, grid.cols, grid.correctAnswer, marks)) {
      setSolved(true)
      onSolved()
    } else {
      setWrong(wrongCells(grid.rows, grid.cols, grid.correctAnswer, marks))
      setAttempts((a) => a + 1)
      onMistake()
    }
  }

  const feedback = step.feedback
  let message: { tone: 'good' | 'bad'; text: string } | null = null
  if (solved && feedback) {
    message = { tone: 'good', text: feedback.correct }
  } else if (attempts > 0 && feedback) {
    message = { tone: 'bad', text: attempts <= 1 ? feedback.firstWrong : feedback.secondWrong }
  }

  return (
    <div className="p3-device">
      <p className="p3-prompt">{step.prompt}</p>
      {clues.length > 0 && (
        <ul className="p3-clues">
          <li className="p3-clues-title">Clue feed</li>
          {clues.map((clue) => (
            <li key={clue}>{clue}</li>
          ))}
        </ul>
      )}
      <div className="p3-grid-wrap">
        <table className="p3-grid">
          <thead>
            <tr>
              <th aria-hidden="true" />
              {step.cols.map((col) => (
                <th key={col} scope="col">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {step.rows.map((row) => (
              <tr key={row}>
                <th className="row-head" scope="row">
                  {row}
                </th>
                {step.cols.map((col) => {
                  const key = cellKey(row, col)
                  const symbol = marks[key] ?? 'blank'
                  const locked = isSingle && key !== targetKey
                  const isTarget = isSingle && key === targetKey
                  return (
                    <td key={col}>
                      <button
                        type="button"
                        className={[
                          'p3-cell',
                          symbol === 'check' ? 'check' : '',
                          symbol === 'X' ? 'x' : '',
                          isTarget ? 'target' : '',
                          wrong.includes(key) ? 'wrong' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        disabled={solved || locked}
                        aria-label={`${row} / ${col}: ${symbol}`}
                        onClick={() => cycle(row, col)}
                      >
                        {glyph(symbol)}
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {message && <p className={`p3-feedback ${message.tone}`}>{message.text}</p>}
      {!solved && (
        <div>
          <button type="button" className="p3-btn primary" onClick={verify}>
            Run verify pass
          </button>
        </div>
      )}
    </div>
  )
}
