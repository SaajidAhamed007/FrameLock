import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Clock, AlertTriangle, CheckCircle2, Play, Loader } from 'lucide-react'

interface Asset {
  id: string
  url: string
  title: string
  addedAt: string
  monitoringFrequency: string | null // '1h', '2h', '6h', '24h', etc.
  lastChecked: string | null
  status: 'active' | 'checking' | 'idle'
}

interface AssetsSectionProps {
  assets: Asset[]
  onAddAsset: (asset: Asset) => void
  onRemoveAsset: (id: string) => void
  onUpdateAsset: (asset: Asset) => void
}

export function AssetsSection({ assets, onAddAsset, onRemoveAsset, onUpdateAsset }: AssetsSectionProps) {
  const [newUrl, setNewUrl] = useState('')
  const [showNotification, setShowNotification] = useState<{ type: string; message: string } | null>(null)
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [isLoadingTitle, setIsLoadingTitle] = useState(false)

  const handleAddAsset = async () => {
    if (!newUrl.trim()) {
      setShowNotification({ type: 'warning', message: 'Please enter a video URL' })
      setTimeout(() => setShowNotification(null), 2000)
      return
    }

    setIsLoadingTitle(true)
    try {
      // Fetch video info from the backend
      const response = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newUrl }),
      })

      if (!response.ok) throw new Error('Failed to fetch video info')
      
      const data = await response.json()
      
      // Extract title from the response
      const title = data.input_video?.title || 'Untitled Video'

      const asset: Asset = {
        id: crypto.randomUUID(),
        url: newUrl,
        title: title,
        addedAt: new Date().toISOString(),
        monitoringFrequency: null,
        lastChecked: null,
        status: 'idle',
      }

      onAddAsset(asset)
      setNewUrl('')
      setShowNotification({ type: 'success', message: `Added "${title}" to monitoring` })
      setTimeout(() => setShowNotification(null), 2000)
    } catch (error) {
      console.error('Error fetching video info:', error)
      setShowNotification({ type: 'warning', message: 'Could not fetch video info. Please check the URL.' })
      setTimeout(() => setShowNotification(null), 2000)
    } finally {
      setIsLoadingTitle(false)
    }
  }

  const handleSetMonitoring = (assetId: string, frequency: string | null) => {
    const asset = assets.find(a => a.id === assetId)
    if (asset) {
      onUpdateAsset({
        ...asset,
        monitoringFrequency: frequency,
        status: frequency ? 'active' : 'idle',
      })
      setShowNotification({
        type: 'info',
        message: frequency ? `Monitoring set to ${frequency}` : 'Monitoring disabled',
      })
      setTimeout(() => setShowNotification(null), 2000)
    }
  }

  const handleCheckNow = (assetId: string) => {
    const asset = assets.find(a => a.id === assetId)
    if (asset) {
      onUpdateAsset({
        ...asset,
        status: 'checking',
      })
      // Simulate checking
      setTimeout(() => {
        onUpdateAsset({
          ...asset,
          status: 'idle',
          lastChecked: new Date().toISOString(),
        })
        setShowNotification({ type: 'success', message: 'Asset check completed' })
        setTimeout(() => setShowNotification(null), 2000)
      }, 2000)
    }
  }

  const getTimeUntilNextCheck = (asset: Asset) => {
    if (!asset.monitoringFrequency || !asset.lastChecked) return 'Never'
    const lastCheck = new Date(asset.lastChecked)
    const frequency = parseInt(asset.monitoringFrequency)
    const nextCheck = new Date(lastCheck.getTime() + frequency * 3600000)
    const now = new Date()
    const diff = nextCheck.getTime() - now.getTime()
    if (diff <= 0) return 'Due now'
    const hours = Math.floor(diff / 3600000)
    const minutes = Math.floor((diff % 3600000) / 60000)
    return `${hours}h ${minutes}m`
  }

  return (
    <section className="h-full flex flex-col gap-5">
      {/* Notification Toast */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="fixed top-4 right-4 px-4 py-3 rounded-xl text-sm font-semibold z-50"
            style={{
              backgroundColor:
                showNotification.type === 'success'
                  ? 'rgba(16,185,129,0.2)'
                  : showNotification.type === 'warning'
                    ? 'rgba(245,158,11,0.2)'
                    : 'rgba(99,102,241,0.2)',
              border:
                showNotification.type === 'success'
                  ? '1px solid rgba(16,185,129,0.4)'
                  : showNotification.type === 'warning'
                    ? '1px solid rgba(245,158,11,0.4)'
                    : '1px solid rgba(99,102,241,0.4)',
              color:
                showNotification.type === 'success'
                  ? '#10B981'
                  : showNotification.type === 'warning'
                    ? '#F59E0B'
                    : '#818CF8',
            }}
          >
            {showNotification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Section Label */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-1 h-5 rounded-full" style={{ backgroundColor: '#6366F1', boxShadow: '0 0 12px #6366F1' }} />
        <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#A1A1AA' }}>
          Monitored Assets
        </h2>
        <span className="ml-auto text-xs text-[#52525B]">{assets.length} videos</span>
      </div>

      <div className="grid grid-cols-3 gap-5 flex-1">
        {/* Add Asset Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-5 flex flex-col gap-4"
          style={{
            background: 'linear-gradient(145deg, #1a1a1f, #16161a)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#52525B' }}>
            Add New Asset
          </p>

          <div className="space-y-3 flex-1">
            <div>
              <label className="text-[10px] font-semibold text-[#A1A1AA] block mb-2">YouTube URL</label>
              <input
                type="text"
                placeholder="https://youtube.com/watch?v=..."
                value={newUrl}
                onChange={e => setNewUrl(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-[#E4E4E7] placeholder-[#52525B] focus:outline-none focus:border-[#6366F1]/50 transition-colors"
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAddAsset}
            disabled={isLoadingTitle}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50"
            style={{ backgroundColor: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)', color: '#818CF8' }}
          >
            {isLoadingTitle ? (
              <>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>
                  <Clock className="w-4 h-4" />
                </motion.div>
                Fetching...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Add Asset
              </>
            )}
          </motion.button>
        </motion.div>

        {/* Assets List */}
        <div className="col-span-2 rounded-2xl p-5 flex flex-col gap-4" style={{ background: 'linear-gradient(145deg, #1a1a1f, #16161a)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#52525B' }}>
              Monitored Videos
            </p>
            <span className="text-xs text-[#6366F1] font-semibold">{assets.filter(a => a.monitoringFrequency).length} Active</span>
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto">
            <AnimatePresence>
              {assets.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center h-32 text-center"
                >
                  <p style={{ color: '#52525B' }} className="text-sm">No assets added yet</p>
                </motion.div>
              ) : (
                assets.map((asset, idx) => (
                  <motion.div
                    key={asset.id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => setSelectedAsset(asset)}
                    className="p-3 rounded-lg cursor-pointer transition-all"
                    style={{
                      backgroundColor: selectedAsset?.id === asset.id ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.02)',
                      border: selectedAsset?.id === asset.id ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#E4E4E7] truncate">{asset.title}</p>
                        <p className="text-[10px] text-[#71717A] truncate mt-1">{asset.url}</p>
                        <div className="flex items-center gap-2 mt-2">
                          {asset.monitoringFrequency && (
                            <>
                              <Clock className="w-3 h-3" style={{ color: '#6366F1' }} />
                              <span className="text-[10px] font-mono text-[#6366F1]">Check every {asset.monitoringFrequency}</span>
                              {asset.lastChecked && (
                                <span className="text-[10px] text-[#52525B]">Next: {getTimeUntilNextCheck(asset)}</span>
                              )}
                            </>
                          )}
                          {!asset.monitoringFrequency && (
                            <span className="text-[10px] text-[#52525B]">Monitoring disabled</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {asset.status === 'checking' && (
                          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>
                            <Clock className="w-4 h-4" style={{ color: '#F59E0B' }} />
                          </motion.div>
                        )}
                        {asset.lastChecked && asset.status === 'idle' && (
                          <CheckCircle2 className="w-4 h-4" style={{ color: '#10B981' }} />
                        )}
                        {!asset.lastChecked && (
                          <AlertTriangle className="w-4 h-4" style={{ color: '#52525B' }} />
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Asset Details Panel */}
      <AnimatePresence>
        {selectedAsset && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-2xl p-5"
            style={{ background: 'linear-gradient(145deg, #1a1a1f, #16161a)', border: '1px solid rgba(99,102,241,0.2)' }}
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#52525B] mb-3">Monitoring Settings</p>
                <div className="space-y-2">
                  {['1h', '2h', '6h', '24h'].map(freq => (
                    <motion.button
                      key={freq}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSetMonitoring(selectedAsset.id, selectedAsset.monitoringFrequency === freq ? null : freq)}
                      className="w-full px-3 py-2 rounded-lg text-sm font-semibold transition-colors text-left"
                      style={{
                        backgroundColor: selectedAsset.monitoringFrequency === freq ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.05)',
                        border: selectedAsset.monitoringFrequency === freq ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.1)',
                        color: selectedAsset.monitoringFrequency === freq ? '#818CF8' : '#A1A1AA',
                      }}
                    >
                      Check every {freq}
                      {selectedAsset.monitoringFrequency === freq && ' ✓'}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#52525B] mb-3">Actions</p>
                <div className="space-y-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleCheckNow(selectedAsset.id)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-semibold text-sm transition-colors"
                    style={{ backgroundColor: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#10B981' }}
                    disabled={selectedAsset.status === 'checking'}
                  >
                    <Play className="w-4 h-4" />
                    {selectedAsset.status === 'checking' ? 'Checking...' : 'Check Now'}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      onRemoveAsset(selectedAsset.id)
                      setSelectedAsset(null)
                      setShowNotification({ type: 'success', message: 'Asset removed' })
                      setTimeout(() => setShowNotification(null), 2000)
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-semibold text-sm transition-colors"
                    style={{ backgroundColor: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444' }}
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove Asset
                  </motion.button>
                </div>
              </div>
            </div>

            {selectedAsset.lastChecked && (
              <div className="mt-4 pt-4 border-t border-white/5">
                <p className="text-[10px] text-[#52525B]">
                  Last checked: {new Date(selectedAsset.lastChecked).toLocaleString()}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
