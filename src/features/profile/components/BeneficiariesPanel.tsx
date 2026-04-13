import { useState } from 'react'
import { Plus, Trash2, Edit2 } from 'lucide-react'
import { Button } from '../../../design-system/components/Button'
import { Input } from '../../../design-system/components/Input'
import { Badge } from '../../../design-system/components/Badge'
import { Modal } from '../../../design-system/components/Modal'

interface Beneficiary {
  id: string
  name: string
  relationship: string
  percentage: number
}

const initial: Beneficiary[] = [
  { id: '1', name: 'Jane Doe', relationship: 'Spouse', percentage: 100 },
]

export function BeneficiariesPanel() {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>(initial)
  const [isOpen, setIsOpen] = useState(false)
  const [editing, setEditing] = useState<Beneficiary | null>(null)
  const [form, setForm] = useState({ name: '', relationship: '', percentage: '' })

  const totalPct = beneficiaries.reduce((s, b) => s + b.percentage, 0)

  const openAdd = () => {
    setEditing(null)
    setForm({ name: '', relationship: '', percentage: '' })
    setIsOpen(true)
  }

  const openEdit = (b: Beneficiary) => {
    setEditing(b)
    setForm({ name: b.name, relationship: b.relationship, percentage: String(b.percentage) })
    setIsOpen(true)
  }

  const handleSave = () => {
    const pct = parseInt(form.percentage)
    if (!form.name || !pct) return
    if (editing) {
      setBeneficiaries((prev) =>
        prev.map((b) => b.id === editing.id ? { ...b, ...form, percentage: pct } : b)
      )
    } else {
      setBeneficiaries((prev) => [
        ...prev,
        { id: Date.now().toString(), name: form.name, relationship: form.relationship, percentage: pct },
      ])
    }
    setIsOpen(false)
  }

  const remove = (id: string) => setBeneficiaries((prev) => prev.filter((b) => b.id !== id))

  return (
    <div className="max-w-lg">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-text-muted">Total allocation: <span className={totalPct === 100 ? 'text-status-success font-medium' : 'text-status-danger font-medium'}>{totalPct}%</span></p>
        </div>
        <Button variant="secondary" size="sm" onClick={openAdd}>
          <Plus className="h-4 w-4" /> Add beneficiary
        </Button>
      </div>

      {beneficiaries.length === 0 ? (
        <p className="text-sm text-text-muted py-4">No beneficiaries added yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {beneficiaries.map((b) => (
            <li key={b.id} className="flex items-center justify-between rounded-lg border border-border-default bg-surface-card p-4">
              <div>
                <p className="font-medium text-text-primary">{b.name}</p>
                <p className="text-sm text-text-secondary">{b.relationship}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="default">{b.percentage}%</Badge>
                <button onClick={() => openEdit(b)} className="text-text-muted hover:text-text-primary">
                  <Edit2 className="h-4 w-4" />
                </button>
                <button onClick={() => remove(b.id)} className="text-text-muted hover:text-status-danger">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal open={isOpen} onClose={() => setIsOpen(false)} title={editing ? 'Edit beneficiary' : 'Add beneficiary'} size="sm">
        <div className="flex flex-col gap-4">
          <Input label="Full name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <Input label="Relationship" placeholder="e.g. Spouse, Child" value={form.relationship} onChange={(e) => setForm((f) => ({ ...f, relationship: e.target.value }))} />
          <Input label="Allocation %" type="number" min="1" max="100" value={form.percentage} onChange={(e) => setForm((f) => ({ ...f, percentage: e.target.value }))} />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setIsOpen(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleSave} className="flex-1">Save</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default BeneficiariesPanel
