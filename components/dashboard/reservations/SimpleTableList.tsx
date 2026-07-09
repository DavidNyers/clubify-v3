'use client'

import { useState, useEffect, useMemo } from 'react'
import { 
  Plus, Trash2, Edit2, Check, X, Users, Hash, 
  RefreshCw, Save, LayoutPanelLeft, Palette, AlertCircle 
} from 'lucide-react'
import { syncVenueTables, getVenueZones, syncVenueZones, updateVenueSettings } from '@/lib/actions/venue/TableActions'
import { useRouter } from 'next/navigation'

interface Zone {
  id: string
  name: string
  color: string
}

interface Table {
  id: string
  label: string
  capacity: number
  zone_id?: string
  is_new?: boolean
}

interface Props {
  venueId: string
  venueType: 'bar' | 'club'
  initialTables: Table[]
}

const PRESET_COLORS = ['#ec4899', '#3b82f6', '#22c55e', '#fbbf24', '#8b5cf6', '#f97316', '#06b6d4']

export default function SimpleTableList({ venueId, venueType, initialTables }: Props) {
  const router = useRouter()
  const [tables, setTables] = useState<Table[]>(initialTables)
  const [zones, setZones] = useState<Zone[]>([])
  const [deletedTableIds, setDeletedTableIds] = useState<string[]>([])
  const [deletedZoneIds, setDeletedZoneIds] = useState<string[]>([])
  
  const [isSaving, setIsSaving] = useState(false)
  const [editingTableId, setEditingTableId] = useState<string | null>(null)
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false)
  const [newZoneName, setNewZoneName] = useState('')

  // Check for unsaved changes
  const hasTableChanges = JSON.stringify(tables) !== JSON.stringify(initialTables)
  const hasChanges = hasTableChanges || deletedTableIds.length > 0 || deletedZoneIds.length > 0

  useEffect(() => {
    async function loadZones() {
      const data = await getVenueZones(venueId)
      // Standardize initial zones if none exist
      if (data.length === 0) {
        const defaultZones = [
          { id: crypto.randomUUID(), name: 'Main', color: '#ec4899' },
          { id: crypto.randomUUID(), name: 'Bar', color: '#3b82f6' }
        ]
        setZones(defaultZones)
      } else {
        setZones(data)
      }
    }
    loadZones()
  }, [venueId])

  const addTable = () => {
    const newId = crypto.randomUUID()
    setTables([...tables, { 
      id: newId, 
      label: `Tisch ${tables.length + 1}`, 
      capacity: 4, 
      zone_id: zones[0]?.id,
      is_new: true 
    }])
    setEditingTableId(newId)
  }

  const removeTable = (id: string, isNew?: boolean) => {
    setTables(tables.filter(t => t.id !== id))
    if (!isNew) setDeletedTableIds([...deletedTableIds, id])
  }

  const addZone = async () => {
    if (!newZoneName.trim()) return
    const newZone: Zone = {
      id: crypto.randomUUID(),
      name: newZoneName.trim(),
      color: PRESET_COLORS[zones.length % PRESET_COLORS.length]
    }
    
    // Immediate save for zones to avoid confusion
    const res = await syncVenueZones(venueId, [newZone], [])
    if (res.success) {
      setZones([...zones, newZone])
      setNewZoneName('')
    } else {
      alert("Bereich konnte nicht gespeichert werden.")
    }
  }

  const removeZone = async (id: string, name: string) => {
    if (confirm(`Möchtest du den Bereich "${name}" wirklich löschen? Alle zugeordneten Tische werden auf "Main" gesetzt.`)) {
      const res = await syncVenueZones(venueId, [], [id])
      if (res.success) {
        setZones(zones.filter(z => z.id !== id))
        const firstOtherZoneId = zones.find(z => z.id !== id)?.id
        setTables(tables.map(t => t.zone_id === id ? { ...t, zone_id: firstOtherZoneId } : t))
      } else {
        alert("Bereich konnte nicht gelöscht werden.")
      }
    }
  }

  const handleSaveAll = async () => {
    setIsSaving(true)
    try {
      // 1. Sync Zones first
      // Sanitize zones: only keep fields that exist in the DB
      const sanitizedZones = zones.map(({ id, name, color }) => ({ id, name, color }))
      const zoneRes = await syncVenueZones(venueId, sanitizedZones, deletedZoneIds)
      
      if (!zoneRes.success) {
        throw new Error(`Fehler beim Speichern der Bereiche: ${JSON.stringify(zoneRes.error)}`)
      }
      
      // 2. Sync Tables
      // Sanitize tables: remove 'is_new' and ensure required fields
      const tablePayload = tables.map(({ id, label, capacity, zone_id }) => ({
        id, 
        label, 
        capacity, 
        zone_id,
        venue_id: venueId,
        venue_type: venueType,
        position_x: 0, 
        position_y: 0, 
        width: 60, 
        height: 60
      }))
      
      const tableRes = await syncVenueTables(venueId, tablePayload, deletedTableIds)
      
      if (!tableRes.success) {
        throw new Error(`Fehler beim Speichern der Tische: ${JSON.stringify(tableRes.error)}`)
      }
      
      setDeletedTableIds([])
      setDeletedZoneIds([])
      setEditingTableId(null)
      alert("Erfolgreich gespeichert!")
      router.refresh()
    } catch (err: any) {
      console.error('Save failed:', err)
      alert(err.message || "Speichern fehlgeschlagen. Bitte prüfe die Datenbank-Verbindung.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="inventory-wrapper">
      <div className="inventory-header">
        <div>
          <h2 className="title">Tisch-Inventar</h2>
          <p className="subtitle">Verwalte deine Sitzplätze und Bereiche</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => setIsZoneModalOpen(true)} className="btn-secondary">
             <Palette size={18} /> Bereiche verwalten
          </button>
          <button onClick={addTable} className="btn-primary">
            <Plus size={18} /> Tisch hinzufügen
          </button>
        </div>
      </div>

      <div className="inventory-grid">
        {tables.map(table => (
          <div key={table.id} className={`table-card ${editingTableId === table.id ? 'editing' : ''}`}>
            {editingTableId === table.id ? (
              <div className="card-edit-form">
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 12 }}>
                  <div className="input-group">
                    <label>Bezeichnung</label>
                    <input 
                      value={table.label} 
                      onChange={e => setTables(tables.map(t => t.id === table.id ? { ...t, label: e.target.value } : t))}
                      autoFocus
                    />
                  </div>
                  <div className="input-group">
                    <label>Plätze</label>
                    <div className="stepper">
                      <button onClick={() => setTables(tables.map(t => t.id === table.id ? { ...t, capacity: Math.max(1, t.capacity - 1) } : t))}>-</button>
                      <span>{table.capacity}</span>
                      <button onClick={() => setTables(tables.map(t => t.id === table.id ? { ...t, capacity: t.capacity + 1 } : t))}>+</button>
                    </div>
                  </div>
                </div>
                <div className="input-group">
                  <label>Bereich / Zone</label>
                  <div className="zone-chips">
                    {zones.map(z => (
                      <button 
                        key={z.id}
                        type="button"
                        onClick={() => setTables(tables.map(t => t.id === table.id ? { ...t, zone_id: z.id } : t))}
                        className={`zone-chip ${table.zone_id === z.id ? 'active' : ''}`}
                        style={{ '--zone-color': z.color } as any}
                      >
                        {z.name}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={() => setEditingTableId(null)} className="btn-done">Fertig</button>
              </div>
            ) : (
              <div className="card-content">
                <div className="card-main">
                  <div className="table-info">
                    <Hash size={14} className="icon-muted" />
                    <span className="label">{table.label}</span>
                    {table.zone_id && (
                      <span className="zone-tag" style={{ 
                        background: (zones.find(z => z.id === table.zone_id)?.color || '#52525b') + '15', 
                        color: zones.find(z => z.id === table.zone_id)?.color || '#52525b' 
                      }}>
                          {zones.find(z => z.id === table.zone_id)?.name || 'Unbekannt'}
                      </span>
                    )}
                  </div>
                  <div className="capacity-info">
                    <Users size={14} />
                    <span>{table.capacity} Plätze</span>
                  </div>
                </div>
                <div className="card-actions">
                  <button onClick={() => setEditingTableId(table.id)} className="action-btn"><Edit2 size={16}/></button>
                  <button onClick={() => removeTable(table.id, table.is_new)} className="action-btn danger"><Trash2 size={16}/></button>
                </div>
              </div>
            )}
          </div>
        ))}

        {tables.length === 0 && (
          <div className="empty-state">
            <AlertCircle size={40} />
            <p>Keine Tische registriert</p>
            <button onClick={addTable} className="btn-link">Jetzt ersten Tisch erstellen</button>
          </div>
        )}
      </div>

      {/* --- FLOATING SAVE BAR --- */}
      {hasChanges && (
        <div className="save-bar-wrapper">
          <div className="save-bar">
             <div className="save-info">
                <RefreshCw size={20} className={isSaving ? 'animate-spin' : ''} />
                <span>{isSaving ? 'Wird gespeichert...' : 'Ungespeicherte Änderungen'}</span>
             </div>
             <button onClick={handleSaveAll} disabled={isSaving} className="btn-save">
                {isSaving ? 'Speichern...' : 'Änderungen übernehmen'}
             </button>
          </div>
        </div>
      )}

      {/* --- ZONE MODAL --- */}
      {isZoneModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
               <h3>Bereiche Verwalten</h3>
               <button onClick={() => setIsZoneModalOpen(false)} className="close-btn"><X/></button>
            </div>
            <div className="modal-body">
               <div className="zone-form">
                  <input 
                    placeholder="Neuer Bereich..." 
                    value={newZoneName}
                    onChange={e => setNewZoneName(e.target.value)}
                  />
                  <button onClick={addZone} className="btn-add">Hinzufügen</button>
               </div>
               <div className="zone-list">
                  {zones.map(z => (
                    <div key={z.id} className="zone-item">
                       <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 12, height: 12, borderRadius: 'full', background: z.color }} />
                          <span style={{ fontWeight: 800 }}>{z.name}</span>
                       </div>
                       <button onClick={() => removeZone(z.id, z.name)} className="btn-del"><Trash2 size={14}/></button>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .inventory-wrapper { display: flex; flex-direction: column; gap: 32px; padding-bottom: 120px; }
        .inventory-header { display: flex; justify-content: space-between; align-items: center; }
        .title { font-size: 1.8rem; font-weight: 950; margin: 0; }
        .subtitle { font-size: 0.8rem; font-weight: 800; color: #ec4899; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 4px; }
        
        .btn-primary { padding: 12px 24px; border-radius: 16px; border: none; background: #ec4899; color: white; fontWeight: 950; fontSize: 0.85rem; cursor: pointer; display: flex; alignItems: center; gap: 10; transition: 0.2s; box-shadow: 0 8px 24px rgba(236,72,153,0.3); }
        .btn-secondary { padding: 12px 24px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.03); color: white; fontWeight: 800; fontSize: 0.85rem; cursor: pointer; display: flex; alignItems: center; gap: 10; transition: 0.2s; }
        .btn-secondary:hover { background: rgba(255,255,255,0.08); }
        
        .inventory-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 24px; }
        .table-card { background: rgba(9, 9, 11, 0.4); border: 1px solid rgba(255, 255, 255, 0.04); border-radius: 28px; padding: 24px; transition: 0.2s; }
        .table-card.editing { border-color: #ec489944; background: rgba(236, 72, 153, 0.03); }
        
        .card-main { flex: 1; }
        .table-info { display: flex; align-items: center; gap: 10; margin-bottom: 12px; }
        .label { font-size: 1.2rem; font-weight: 950; }
        .zone-tag { font-size: 0.65rem; font-weight: 950; padding: 4px 10px; border-radius: 8px; text-transform: uppercase; }
        .capacity-info { display: flex; align-items: center; gap: 8; color: #71717a; font-size: 0.85rem; font-weight: 800; }
        
        .card-content { display: flex; justify-content: space-between; align-items: center; }
        .card-actions { display: flex; gap: 8; }
        .action-btn { width: 38px; height: 38px; border-radius: 12px; border: none; background: rgba(255,255,255,0.03); color: #71717a; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
        .action-btn:hover { background: rgba(255,255,255,0.08); color: white; }
        .action-btn.danger:hover { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
        
        .card-edit-form { display: flex; flex-direction: column; gap: 20px; }
        .input-group label { font-size: 0.65rem; font-weight: 950; color: #ec4899; text-transform: uppercase; display: block; margin-bottom: 8px; letter-spacing: 0.05em; }
        .input-group input { width: 100%; height: 48px; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 0 16px; color: white; font-weight: 800; font-size: 0.95rem; outline: none; transition: 0.2s; }
        .input-group input:focus { border-color: #ec4899; }
        
        .stepper { display: flex; align-items: center; gap: 12px; height: 48px; background: rgba(0,0,0,0.4); padding: 0 12px; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; justify-content: space-between; }
        .stepper button { width: 28px; height: 28px; border-radius: 8px; border: none; background: rgba(255,255,255,0.08); color: white; font-weight: 950; cursor: pointer; }
        .stepper span { font-size: 1.1rem; font-weight: 950; }
        
        .zone-chips { display: flex; flex-wrap: wrap; gap: 8px; }
        .zone-chip { padding: 8px 16px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.04); color: #71717a; font-size: 0.75rem; font-weight: 900; cursor: pointer; transition: 0.2s; }
        .zone-chip.active { background: var(--zone-color); color: white; border-color: transparent; box-shadow: 0 4px 12px var(--zone-color); opacity: 1; }
        .btn-done { width: 100%; height: 48px; background: white; color: black; border: none; border-radius: 14px; font-weight: 950; font-size: 0.9rem; cursor: pointer; transition: 0.2s; }
        .btn-done:hover { transform: translateY(-2px); }

        .save-bar-wrapper { position: fixed; bottom: 32px; left: 0; right: 0; display: flex; justify-content: center; z-index: 1000; padding: 0 24px; pointer-events: none; }
        .save-bar { 
          min-width: 320px; 
          width: 100%;
          max-width: 580px; 
          height: 72px; 
          background: rgba(12,12,14,0.98); 
          backdrop-filter: blur(24px); 
          border: 1px solid rgba(255,255,255,0.12); 
          border-radius: 24px; 
          padding: 0 12px 0 24px; 
          display: flex; 
          align-items: center; 
          justify-content: space-between; 
          gap: 20px; 
          box-shadow: 0 32px 64px rgba(0,0,0,0.6); 
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); 
          pointer-events: auto; 
        }
        .save-info { display: flex; align-items: center; gap: 12px; font-weight: 800; font-size: 0.9rem; white-space: nowrap; color: #a1a1aa; }
        .btn-save { height: 48px; padding: 0 24px; background: #ec4899; color: white; border: none; border-radius: 16px; font-weight: 950; font-size: 0.95rem; cursor: pointer; transition: 0.2s; white-space: nowrap; flex-shrink: 0; }
        .btn-save:hover { transform: scale(1.02); box-shadow: 0 8px 32px rgba(236,72,153,0.4); }

        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); z-index: 2000; display: flex; align-items: center; justify-content: center; animation: fadeIn 0.3s ease-out; }
        .modal-content { width: 420px; background: #0c0c0e; border: 1px solid rgba(255,255,255,0.1); border-radius: 32px; padding: 32px; box-shadow: 0 24px 80px rgba(0,0,0,0.9); }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .modal-header h3 { margin: 0; font-size: 1.2rem; font-weight: 950; }
        .close-btn { background: transparent; border: none; color: #52525b; cursor: pointer; }
        
        .zone-form { display: flex; gap: 8px; margin-bottom: 24px; }
        .zone-form input { flex: 1; height: 44px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 0 16px; color: white; font-weight: 800; }
        .btn-add { padding: 0 16px; background: white; color: black; border-radius: 12px; font-weight: 950; font-size: 0.8rem; border: none; cursor: pointer; }
        
        .zone-list { display: flex; flex-direction: column; gap: 8px; }
        .zone-item { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: rgba(255,255,255,0.03); border-radius: 12px; }
        .btn-del { background: transparent; border: none; color: #52525b; cursor: pointer; transition: 0.2s; }
        .btn-del:hover { color: #ef4444; }

        @keyframes slideUp { from { opacity:0; transform: translateY(40px); } to { opacity:1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        
        .empty-state { padding: 80px; text-align: center; border: 2px dashed rgba(255,255,255,0.05); border-radius: 40px; color: #3f3f46; display: flex; flex-direction: column; align-items: center; gap: 16px; }
        .btn-link { background: transparent; border: none; color: #ec4899; font-weight: 950; cursor: pointer; text-decoration: underline; }
      `}</style>
    </div>
  )
}
