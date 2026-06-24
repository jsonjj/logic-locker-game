/**
 * [Agent 3] Renders the correct security device for a given lesson step. Uses the
 * step's discriminant so each device gets a precisely-typed step prop.
 */
import type { InteractiveStep, DeviceCallbacks } from './types'
import OverrideConsole from './OverrideConsole'
import EvidenceLocker from './EvidenceLocker'
import DeductionTerminal from './DeductionTerminal'
import LogicGatePanel from './LogicGatePanel'
import WiringSequencePanel from './WiringSequencePanel'

interface Props extends DeviceCallbacks {
  step: InteractiveStep
}

export default function DeviceRenderer({ step, onSolved, onMistake }: Props) {
  switch (step.type) {
    case 'multipleChoice':
    case 'prediction':
    case 'highlightChoice':
    case 'symbolTap':
      return <OverrideConsole step={step} onSolved={onSolved} onMistake={onMistake} />
    case 'clueSort':
      return <EvidenceLocker step={step} onSolved={onSolved} onMistake={onMistake} />
    case 'deductionGrid':
    case 'miniGrid':
    case 'singleCellGrid':
      return <DeductionTerminal step={step} onSolved={onSolved} onMistake={onMistake} />
    case 'logicSwitches':
      return <LogicGatePanel step={step} onSolved={onSolved} onMistake={onMistake} />
    case 'ordering':
      return <WiringSequencePanel step={step} onSolved={onSolved} onMistake={onMistake} />
  }
}
