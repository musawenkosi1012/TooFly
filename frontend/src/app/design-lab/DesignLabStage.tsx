"use client"

import { useState, useRef, useEffect } from "react"
import { Stage, Layer, Text, Image as KonvaImage, Rect, Transformer } from "react-konva"
import useImage from "use-image"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Type, Image as ImageIcon, Trash2, Undo2, Redo2, 
  Save, Palette, Move, Layers, CheckCircle2,
  ChevronLeft, Loader2, Download
} from "lucide-react"
import { SketchPicker } from "react-color"
import { API_V1, getAuthToken } from "@/lib/api"
import Link from "next/link"

// --- Constants ---
const CANVAS_WIDTH = 500
const CANVAS_HEIGHT = 600
const PRINT_AREA = {
  x: 100,
  y: 120,
  width: 300,
  height: 380
}

interface DesignElement {
  id: string
  type: "text" | "image"
  text?: string
  src?: string
  x: number
  y: number
  fontSize?: number
  color?: string
  scaleX?: number
  scaleY?: number
  rotation?: number
}

// --- Image Component ---
const URLImage = ({ element, isSelected, onSelect, onChange }: any) => {
  const [img] = useImage(element.src, 'Anonymous')
  const shapeRef = useRef<any>()
  const trRef = useRef<any>()

  useEffect(() => {
    if (isSelected) {
      trRef.current.nodes([shapeRef.current])
      trRef.current.getLayer().batchDraw()
    }
  }, [isSelected])

  return (
    <>
      <KonvaImage
        ref={shapeRef}
        image={img}
        {...element}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => {
          onChange({
            ...element,
            x: e.target.x(),
            y: e.target.y(),
          })
        }}
        onTransformEnd={() => {
          const node = shapeRef.current
          onChange({
            ...element,
            x: node.x(),
            y: node.y(),
            scaleX: node.scaleX(),
            scaleY: node.scaleY(),
            rotation: node.rotation(),
          })
        }}
      />
      {isSelected && <Transformer ref={trRef} boundBoxFunc={(oldBox, newBox) => newBox} />}
    </>
  )
}

// --- Text Component ---
const EditableText = ({ element, isSelected, onSelect, onChange }: any) => {
  const shapeRef = useRef<any>()
  const trRef = useRef<any>()

  useEffect(() => {
    if (isSelected) {
      trRef.current.nodes([shapeRef.current])
      trRef.current.getLayer().batchDraw()
    }
  }, [isSelected])

  return (
    <>
      <Text
        ref={shapeRef}
        {...element}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => {
          onChange({
            ...element,
            x: e.target.x(),
            y: e.target.y(),
          })
        }}
        onTransformEnd={() => {
          const node = shapeRef.current
          onChange({
            ...element,
            x: node.x(),
            y: node.y(),
            scaleX: node.scaleX(),
            scaleY: node.scaleY(),
            rotation: node.rotation(),
          })
        }}
      />
      {isSelected && <Transformer ref={trRef} enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']} />}
    </>
  )
}

export default function DesignLabStage() {
  const [elements, setElements] = useState<DesignElement[]>([])
  const [history, setHistory] = useState<DesignElement[][]>([[]])
  const [historyStep, setHistoryStep] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle")

  const stageRef = useRef<any>()

  // --- Actions ---
  const addToHistory = (newElements: DesignElement[]) => {
    const newHistory = history.slice(0, historyStep + 1)
    newHistory.push(newElements)
    setHistory(newHistory)
    setHistoryStep(newHistory.length - 1)
  }

  const handleAddText = () => {
    const newEl: DesignElement = {
      id: Math.random().toString(36).substr(2, 9),
      type: "text",
      text: "NEW VIBE",
      x: 200,
      y: 250,
      fontSize: 40,
      color: "#ffffff",
      rotation: 0,
      scaleX: 1,
      scaleY: 1
    }
    const updated = [...elements, newEl]
    setElements(updated)
    addToHistory(updated)
    setSelectedId(newEl.id)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        const newEl: DesignElement = {
          id: Math.random().toString(36).substr(2, 9),
          type: "image",
          src: reader.result as string,
          x: 150,
          y: 200,
          scaleX: 0.5,
          scaleY: 0.5,
          rotation: 0
        }
        const updated = [...elements, newEl]
        setElements(updated)
        addToHistory(updated)
        setSelectedId(newEl.id)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUpdateElement = (updatedEl: DesignElement) => {
    const updated = elements.map(el => el.id === updatedEl.id ? updatedEl : el)
    setElements(updated)
    addToHistory(updated)
  }

  const handleDelete = () => {
    if (selectedId) {
      const updated = elements.filter(el => el.id !== selectedId)
      setElements(updated)
      addToHistory(updated)
      setSelectedId(null)
    }
  }

  const undo = () => {
    if (historyStep > 0) {
      const prev = history[historyStep - 1]
      setElements(prev)
      setHistoryStep(historyStep - 1)
    }
  }

  const redo = () => {
    if (historyStep < history.length - 1) {
      const next = history[historyStep + 1]
      setElements(next)
      setHistoryStep(historyStep + 1)
    }
  }

  const saveDesign = async () => {
    setIsSaving(true)
    const token = getAuthToken()
    if (!token) {
        window.location.href = "/login?redirect=/design-lab"
        return
    }

    try {
        const preview_base64 = stageRef.current.toDataURL()
        
        const res = await fetch(`${API_V1}/designs/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                name: "Custom Drop V1",
                elements: elements,
                preview_base64
            })
        })

        if (res.ok) {
            setSaveStatus("success")
            setTimeout(() => setSaveStatus("idle"), 3000)
        } else {
            setSaveStatus("error")
        }
    } catch (err) {
        setSaveStatus("error")
    } finally {
        setIsSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white pt-24 px-6 overflow-hidden">
      <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 h-[calc(100vh-120px)]">
        
        {/* --- Toolbar (Left) --- */}
        <div className="lg:col-span-3 flex flex-col gap-6">
            <div className="flex items-center gap-4 mb-4">
                <Link href="/catalogue" className="p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-all">
                    <ChevronLeft size={20} />
                </Link>
                <h1 className="text-3xl font-black uppercase italic tracking-tighter">Design Lab</h1>
            </div>

            <div className="glass p-8 rounded-[2.5rem] space-y-8">
                <div>
                    <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500 mb-6 block">Creator Tools</label>
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={handleAddText} className="flex flex-col items-center gap-3 p-6 bg-white/5 rounded-3xl hover:bg-accent hover:text-white transition-all group">
                            <Type size={24} className="group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Add Text</span>
                        </button>
                        <label className="flex flex-col items-center gap-3 p-6 bg-white/5 rounded-3xl hover:bg-accent hover:text-white transition-all group cursor-pointer">
                            <ImageIcon size={24} className="group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Add Art</span>
                            <input type="file" hidden onChange={handleImageUpload} accept="image/*" />
                        </label>
                    </div>
                </div>

                {selectedId && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pt-6 border-t border-white/5">
                        <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500 block">Element Style</label>
                        <div className="flex gap-4">
                            <button onClick={() => setShowColorPicker(!showColorPicker)} className="p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all flex-1 flex items-center justify-center gap-3">
                                <Palette size={18} />
                                <span className="text-[10px] font-bold">Color</span>
                            </button>
                            <button onClick={handleDelete} className="p-4 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all flex-1 flex items-center justify-center gap-3">
                                <Trash2 size={18} />
                                <span className="text-[10px] font-bold">Purge</span>
                            </button>
                        </div>
                        {showColorPicker && (
                            <div className="absolute z-50 mt-4">
                                <SketchPicker 
                                    color={elements.find(el => el.id === selectedId)?.color || "#fff"}
                                    onChangeComplete={(color: any) => {
                                        const el = elements.find(e => e.id === selectedId)
                                        if (el) handleUpdateElement({ ...el, color: color.hex })
                                    }}
                                />
                            </div>
                        )}
                    </motion.div>
                )}

                <div className="pt-8 border-t border-white/5 flex gap-4">
                    <button onClick={undo} disabled={historyStep === 0} className="p-4 bg-white/5 rounded-2xl hover:bg-white/10 disabled:opacity-30 transition-all flex-1 flex flex-col items-center gap-2">
                        <Undo2 size={18} />
                        <span className="text-[9px] font-bold uppercase tracking-widest">Undo</span>
                    </button>
                    <button onClick={redo} disabled={historyStep === history.length - 1} className="p-4 bg-white/5 rounded-2xl hover:bg-white/10 disabled:opacity-30 transition-all flex-1 flex flex-col items-center gap-2">
                        <Redo2 size={18} />
                        <span className="text-[9px] font-bold uppercase tracking-widest">Redo</span>
                    </button>
                </div>
            </div>

            <button 
                onClick={saveDesign}
                disabled={isSaving}
                className="mt-4 w-full py-6 bg-accent text-white rounded-[2rem] font-black uppercase tracking-[0.3em] text-[11px] flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-2xl shadow-accent/20"
            >
                {isSaving ? <Loader2 className="animate-spin" size={20} /> : (
                    saveStatus === "success" ? <CheckCircle2 size={20} /> : <Save size={20} />
                )}
                {saveStatus === "success" ? "SYNCHRONIZED" : (isSaving ? "STAGING..." : "COMMIT TO VAULT")}
            </button>
        </div>

        {/* --- Canvas Area --- */}
        <div className="lg:col-span-6 flex items-center justify-center relative bg-black/40 rounded-[4rem] border border-white/5 overflow-hidden shadow-inner">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.4)_100%)] pointer-events-none" />
            <div className="relative">
                <Stage
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                    ref={stageRef}
                    onMouseDown={(e: any) => {
                        if (e.target === e.target.getStage()) setSelectedId(null)
                    }}
                >
                    <Layer>
                        <Rect x={PRINT_AREA.x} y={PRINT_AREA.y} width={PRINT_AREA.width} height={PRINT_AREA.height} stroke="#555" strokeWidth={1} dash={[5, 10]} opacity={0.3} />
                        {elements.map((el) => el.type === "text" ? (
                            <EditableText key={el.id} element={el} isSelected={el.id === selectedId} onSelect={() => setSelectedId(el.id)} onChange={handleUpdateElement} />
                        ) : (
                            <URLImage key={el.id} element={el} isSelected={el.id === selectedId} onSelect={() => setSelectedId(el.id)} onChange={handleUpdateElement} />
                        ))}
                    </Layer>
                </Stage>
            </div>
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-6 glass px-8 py-3 rounded-full opacity-60">
                <div className="flex items-center gap-2">
                    <Move size={12} className="text-accent" />
                    <span className="text-[10px] font-bold tracking-widest">ARTBOARD {CANVAS_WIDTH}x{CANVAS_HEIGHT}</span>
                </div>
            </div>
        </div>

        {/* --- Hierarchy (Right) --- */}
        <div className="lg:col-span-3 flex flex-col gap-6">
            <div className="glass p-8 rounded-[2.5rem] flex-1">
                <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500 mb-8 block">Project Hierarchy</label>
                <div className="space-y-3">
                    {elements.length === 0 ? <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-600 text-center py-12">Void</p> : 
                        [...elements].reverse().map((el) => (
                            <button key={el.id} onClick={() => setSelectedId(el.id)} className={`w-full p-4 rounded-2xl flex items-center justify-between border transition-all ${selectedId === el.id ? "bg-accent border-accent text-white" : "bg-white/5 border-transparent text-gray-400"}`}>
                                <div className="flex items-center gap-4">
                                    {el.type === "text" ? <Type size={14} /> : <ImageIcon size={14} />}
                                    <span className="text-[10px] font-bold uppercase tracking-widest truncate max-w-[120px]">{el.type === "text" ? el.text : "Visual.png"}</span>
                                </div>
                            </button>
                        ))}
                </div>
            </div>
            <div className="glass p-8 rounded-[2.5rem] bg-accent/5">
                <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] mb-4 flex items-center gap-3">
                    <Download size={14} className="text-accent" /> Production Engine
                </h4>
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-500 leading-relaxed">System renders at <span className="text-accent">300 DPI</span> for professional production output.</p>
            </div>
        </div>
      </div>
    </main>
  )
}
