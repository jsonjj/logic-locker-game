import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from '../../context/AuthContext'
import { GEAR, STARTER_WEAPON, type GearItem } from '../systems/gear'

interface EquippedState {
  weapon: string
  armor: string | null
  utility: string | null
}

interface Persisted {
  owned: string[]
  equipped: EquippedState
}

interface InventoryValue {
  owned: string[]
  equipped: EquippedState
  /** Returns true if the item was newly added. */
  addItem: (id: string) => boolean
  equip: (id: string) => void
  isOwned: (id: string) => boolean
  weapon: GearItem
  bonusLives: number
  speedMult: number
}

const DEFAULT: Persisted = {
  owned: [STARTER_WEAPON],
  equipped: { weapon: STARTER_WEAPON, armor: null, utility: null },
}

const InventoryContext = createContext<InventoryValue | undefined>(undefined)

function storageKey(uid: string | undefined) {
  return `ll-inv-${uid ?? 'anon'}`
}

function load(uid: string | undefined): Persisted {
  try {
    const raw = localStorage.getItem(storageKey(uid))
    if (!raw) return DEFAULT
    const parsed = JSON.parse(raw) as Persisted
    const owned = Array.from(new Set([STARTER_WEAPON, ...(parsed.owned ?? [])])).filter((id) => GEAR[id])
    const eq = parsed.equipped ?? DEFAULT.equipped
    return {
      owned,
      equipped: {
        weapon: GEAR[eq.weapon] ? eq.weapon : STARTER_WEAPON,
        armor: eq.armor && GEAR[eq.armor] ? eq.armor : null,
        utility: eq.utility && GEAR[eq.utility] ? eq.utility : null,
      },
    }
  } catch {
    return DEFAULT
  }
}

export function InventoryProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const uid = user?.uid
  const [owned, setOwned] = useState<string[]>(DEFAULT.owned)
  const [equipped, setEquipped] = useState<EquippedState>(DEFAULT.equipped)
  const loadedFor = useRef<string | undefined>(undefined)

  // (Re)load when the signed-in user changes.
  useEffect(() => {
    const data = load(uid)
    setOwned(data.owned)
    setEquipped(data.equipped)
    loadedFor.current = uid
  }, [uid])

  // Persist on change (only after the initial load for this uid).
  useEffect(() => {
    if (loadedFor.current !== uid) return
    try {
      localStorage.setItem(storageKey(uid), JSON.stringify({ owned, equipped }))
    } catch {
      /* ignore quota / privacy-mode errors */
    }
  }, [owned, equipped, uid])

  const addItem = useCallback((id: string): boolean => {
    if (!GEAR[id]) return false
    let added = false
    setOwned((prev) => {
      if (prev.includes(id)) return prev
      added = true
      return [...prev, id]
    })
    return added
  }, [])

  const equip = useCallback((id: string) => {
    const item = GEAR[id]
    if (!item) return
    setEquipped((prev) => ({ ...prev, [item.slot]: id }))
  }, [])

  const isOwned = useCallback((id: string) => owned.includes(id), [owned])

  const value = useMemo<InventoryValue>(() => {
    const weapon = GEAR[equipped.weapon] ?? GEAR[STARTER_WEAPON]
    const armor = equipped.armor ? GEAR[equipped.armor] : undefined
    const utility = equipped.utility ? GEAR[equipped.utility] : undefined
    const bonusLives = (armor?.bonusLives ?? 0) + (utility?.bonusLives ?? 0)
    const speedMult = utility?.speedMult ?? 1
    return { owned, equipped, addItem, equip, isOwned, weapon, bonusLives, speedMult }
  }, [owned, equipped, addItem, equip, isOwned])

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useInventory(): InventoryValue {
  const ctx = useContext(InventoryContext)
  if (!ctx) throw new Error('useInventory must be used within an InventoryProvider')
  return ctx
}
