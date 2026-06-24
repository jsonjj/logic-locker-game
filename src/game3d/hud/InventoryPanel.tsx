import { GEAR, type GearSlot } from '../systems/gear'
import { useInventory } from '../state/InventoryContext'
import '../../styles/combat.css'

export interface InventoryPanelProps {
  open: boolean
  onClose: () => void
}

const SLOT_LABEL: Record<GearSlot, string> = {
  weapon: 'Weapons',
  armor: 'Armor',
  utility: 'Utility',
}

const SLOT_ORDER: GearSlot[] = ['weapon', 'armor', 'utility']

export default function InventoryPanel({ open, onClose }: InventoryPanelProps) {
  const { owned, equipped, equip } = useInventory()

  if (!open) return null

  return (
    <div className="inv-scrim" role="dialog" aria-modal="true" aria-label="Inventory" onClick={onClose}>
      <div className="inv-card" onClick={(e) => e.stopPropagation()} data-ui>
        <div className="inv-head">
          <h2>Loadout</h2>
          <button type="button" className="inv-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {SLOT_ORDER.map((slot) => {
          const items = owned.map((id) => GEAR[id]).filter((g) => g && g.slot === slot)
          return (
            <section key={slot} className="inv-section">
              <h3 className="inv-section-title">{SLOT_LABEL[slot]}</h3>
              {items.length === 0 ? (
                <p className="inv-empty">Nothing yet — clear rooms and explore to find gear.</p>
              ) : (
                <div className="inv-grid">
                  {items.map((g) => {
                    const isEquipped = equipped[slot] === g.id
                    return (
                      <div key={g.id} className={`inv-item${isEquipped ? ' is-equipped' : ''}`}>
                        <span className="inv-item-icon" style={{ color: g.color }}>
                          {g.icon}
                        </span>
                        <div className="inv-item-body">
                          <div className="inv-item-name">{g.name}</div>
                          <div className="inv-item-desc">{g.desc}</div>
                        </div>
                        <button
                          type="button"
                          className={`inv-equip${isEquipped ? ' is-on' : ''}`}
                          onClick={() => equip(g.id)}
                          disabled={isEquipped}
                        >
                          {isEquipped ? 'Equipped' : 'Equip'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          )
        })}

        <p className="inv-tip">
          Tip: press <b>F</b> (or the FIRE button) to attack guards with your equipped weapon.
        </p>
      </div>
    </div>
  )
}
