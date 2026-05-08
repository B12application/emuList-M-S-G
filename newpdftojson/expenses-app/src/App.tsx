import { useState, useEffect, useMemo } from 'react'
import './index.css'

interface Transaction {
  title: string
  amount: number
  date: string
  direction: 'gelen' | 'giden'
  type: string
  category: string
  source: string
  description: string
  installment?: string
}

const CATEGORY_COLORS: Record<string, string> = {
  'Gelen Transfer': '#00e68a',
  'Giden Transfer': '#ff4d6a',
  'Alışveriş': '#a855f7',
  'Market': '#ff9f43',
  'Yemek': '#f97316',
  'Kafe/Restoran': '#fb923c',
  'Akaryakıt': '#eab308',
  'Kredi Kartı Ödemesi': '#6366f1',
  'İptal/İade': '#22d3ee',
  'Diğer': '#64748b',
  'Seyahat': '#06b6d4',
  'Sigorta/BES': '#8b5cf6',
  'Para Çekme': '#ef4444',
  'Para Yatırma': '#10b981',
  'Sağlık': '#ec4899',
  'Fatura': '#f59e0b',
  'Vergi': '#dc2626',
  'Kripto': '#f59e0b',
  'Dijital Abonelik': '#818cf8',
  'Faiz/BSMV': '#94a3b8',
  'Evcil Hayvan': '#34d399',
  'Döviz': '#fbbf24',
  'Eğitim': '#60a5fa',
  'Araç Bakım': '#a3a3a3',
  'Vergi/Masraf': '#9ca3af',
  'ATM': '#737373',
  'Belediye': '#78716c',
  'Çiçek': '#f472b6',
}

const MONTHS_TR = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara']

function formatCurrency(n: number): string {
  return n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatDate(d: string): string {
  const [y, m, day] = d.split('-')
  return `${day}.${m}.${y}`
}

function App() {
  const [data, setData] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dirFilter, setDirFilter] = useState<'all' | 'gelen' | 'giden'>('all')
  const [catFilter, setCatFilter] = useState<string>('all')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date')
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')
  const [visibleCount, setVisibleCount] = useState(30)
  const [monthFilter, setMonthFilter] = useState<string>('all')

  useEffect(() => {
    fetch('/expenses_data.json')
      .then(r => r.json())
      .then((d: Transaction[]) => {
        setData(d)
        setLoading(false)
      })
  }, [])

  const filtered = useMemo(() => {
    let result = [...data]
    if (dirFilter !== 'all') result = result.filter(t => t.direction === dirFilter)
    if (catFilter !== 'all') result = result.filter(t => t.category === catFilter)
    if (sourceFilter !== 'all') result = result.filter(t => t.source === sourceFilter)
    if (monthFilter !== 'all') {
      result = result.filter(t => t.date.substring(0, 7) === monthFilter)
    }
    if (search) {
      const s = search.toLowerCase()
      result = result.filter(t =>
        t.title.toLowerCase().includes(s) ||
        t.category.toLowerCase().includes(s) ||
        t.description.toLowerCase().includes(s)
      )
    }
    result.sort((a, b) => {
      if (sortBy === 'date') {
        const cmp = a.date.localeCompare(b.date)
        return sortOrder === 'desc' ? -cmp : cmp
      }
      return sortOrder === 'desc' ? b.amount - a.amount : a.amount - b.amount
    })
    return result
  }, [data, dirFilter, catFilter, sourceFilter, monthFilter, search, sortBy, sortOrder])

  const stats = useMemo(() => {
    const gelen = filtered.filter(t => t.direction === 'gelen')
    const giden = filtered.filter(t => t.direction === 'giden')
    return {
      totalGelen: gelen.reduce((s, t) => s + t.amount, 0),
      totalGiden: giden.reduce((s, t) => s + t.amount, 0),
      countGelen: gelen.length,
      countGiden: giden.length,
      total: filtered.length,
    }
  }, [filtered])

  const categories = useMemo(() => {
    const cats: Record<string, { count: number; gelen: number; giden: number }> = {}
    data.forEach(t => {
      if (!cats[t.category]) cats[t.category] = { count: 0, gelen: 0, giden: 0 }
      cats[t.category].count++
      if (t.direction === 'gelen') cats[t.category].gelen += t.amount
      else cats[t.category].giden += t.amount
    })
    return Object.entries(cats)
      .map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => b.count - a.count)
  }, [data])

  const months = useMemo(() => {
    const set = new Set<string>()
    data.forEach(t => set.add(t.date.substring(0, 7)))
    return Array.from(set).sort().reverse()
  }, [data])

  const monthlyData = useMemo(() => {
    const map: Record<string, { gelen: number; giden: number; label: string }> = {}
    data.forEach(t => {
      const m = t.date.substring(0, 7)
      if (!map[m]) {
        const [y, mo] = m.split('-')
        map[m] = { gelen: 0, giden: 0, label: `${MONTHS_TR[parseInt(mo) - 1]} ${y.slice(2)}` }
      }
      if (t.direction === 'gelen') map[m].gelen += t.amount
      else map[m].giden += t.amount
    })
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v)
  }, [data])

  // Top categories for pie chart (giden only)
  const topCats = useMemo(() => {
    const gidenCats = categories
      .filter(c => c.giden > 0 && c.name !== 'Giden Transfer' && c.name !== 'Kredi Kartı Ödemesi')
      .sort((a, b) => b.giden - a.giden)
      .slice(0, 8)
    return gidenCats
  }, [categories])

  const visible = filtered.slice(0, visibleCount)

  if (loading) {
    return (
      <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>💳</div>
          <p style={{ color: 'var(--text-muted)' }}>Veriler yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="app-container">
      {/* HEADER */}
      <div className="app-header">
        <div>
          <h1>💰 Finansal Takip</h1>
          <div className="app-header-sub">
            {data.length} işlem · {months[0]} — {months[months.length - 1]}
          </div>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="stats-grid fade-in-up">
        <div className="stat-card green">
          <div className="stat-label">
            <span className="icon green">↓</span>
            GELEN (GELİR)
          </div>
          <div className="stat-value green">{formatCurrency(stats.totalGelen)} ₺</div>
          <div className="stat-sub">{stats.countGelen} işlem</div>
        </div>
        <div className="stat-card red">
          <div className="stat-label">
            <span className="icon red">↑</span>
            GİDEN (GİDER)
          </div>
          <div className="stat-value red">{formatCurrency(stats.totalGiden)} ₺</div>
          <div className="stat-sub">{stats.countGiden} işlem</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-label">
            <span className="icon blue">≡</span>
            NET BAKİYE
          </div>
          <div className={`stat-value ${stats.totalGelen - stats.totalGiden >= 0 ? 'green' : 'red'}`}>
            {stats.totalGelen - stats.totalGiden >= 0 ? '+' : ''}{formatCurrency(stats.totalGelen - stats.totalGiden)} ₺
          </div>
          <div className="stat-sub">{stats.total} toplam işlem</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-label">
            <span className="icon purple">📊</span>
            AYLIK ORTALAMA GİDER
          </div>
          <div className="stat-value purple">
            {formatCurrency(months.length > 0 ? stats.totalGiden / months.length : 0)} ₺
          </div>
          <div className="stat-sub">{months.length} ay verisi</div>
        </div>
      </div>

      {/* CHARTS */}
      <div className="chart-section fade-in-up" style={{ animationDelay: '0.1s' }}>
        <div className="chart-card">
          <div className="chart-title">📈 Aylık Gelen / Giden</div>
          <div className="month-bars">
            {monthlyData.map((m, i) => {
              const maxVal = Math.max(...monthlyData.map(x => Math.max(x.gelen, x.giden)), 1)
              const gelenH = (m.gelen / maxVal) * 100
              const gidenH = (m.giden / maxVal) * 100
              return (
                <div className="month-bar-col" key={i} title={`${m.label}\nGelen: ${formatCurrency(m.gelen)} ₺\nGiden: ${formatCurrency(m.giden)} ₺`}>
                  <div className="month-bar gelen" style={{ height: `${gelenH}%` }} />
                  <div className="month-bar giden" style={{ height: `${gidenH}%` }} />
                  <div className="month-label">{m.label}</div>
                </div>
              )
            })}
          </div>
        </div>
        <div className="chart-card">
          <div className="chart-title">🏷️ Harcama Kategorileri (Gider)</div>
          <div className="donut-legend">
            {topCats.map(c => (
              <div key={c.name} className="donut-legend-item"
                style={{ cursor: 'pointer' }}
                onClick={() => setCatFilter(catFilter === c.name ? 'all' : c.name)}>
                <div className="donut-legend-left">
                  <span className="donut-legend-dot" style={{ background: CATEGORY_COLORS[c.name] || '#64748b' }} />
                  <span className="donut-legend-name">{c.name}</span>
                </div>
                <span className="donut-legend-value">{formatCurrency(c.giden)} ₺</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="filters-bar fade-in-up" style={{ animationDelay: '0.15s' }}>
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            placeholder="İşlem ara... (başlık, kategori, açıklama)"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button
          className={`filter-btn ${dirFilter === 'all' ? 'active' : ''}`}
          onClick={() => setDirFilter('all')}
        >Tümü</button>
        <button
          className={`filter-btn ${dirFilter === 'gelen' ? 'active green' : ''}`}
          onClick={() => setDirFilter(dirFilter === 'gelen' ? 'all' : 'gelen')}
        >↓ Gelen</button>
        <button
          className={`filter-btn ${dirFilter === 'giden' ? 'active red' : ''}`}
          onClick={() => setDirFilter(dirFilter === 'giden' ? 'all' : 'giden')}
        >↑ Giden</button>
        <select
          className="filter-select"
          value={monthFilter}
          onChange={e => setMonthFilter(e.target.value)}
        >
          <option value="all">Tüm Aylar</option>
          {months.map(m => {
            const [y, mo] = m.split('-')
            return <option key={m} value={m}>{MONTHS_TR[parseInt(mo) - 1]} {y}</option>
          })}
        </select>
        <select
          className="filter-select"
          value={sourceFilter}
          onChange={e => setSourceFilter(e.target.value)}
        >
          <option value="all">Tüm Kaynaklar</option>
          <option value="Kredi Kartı">Kredi Kartı</option>
          <option value="Vadesiz Hesap">Vadesiz Hesap</option>
        </select>
        <button
          className="filter-btn"
          onClick={() => {
            setSortBy(sortBy === 'date' ? 'amount' : 'date')
          }}
        >{sortBy === 'date' ? '📅 Tarih' : '💰 Tutar'}</button>
        <button
          className="filter-btn"
          onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
        >{sortOrder === 'desc' ? '↓' : '↑'}</button>
      </div>

      {/* MAIN LAYOUT */}
      <div className="main-layout fade-in-up" style={{ animationDelay: '0.2s' }}>
        {/* SIDEBAR */}
        <div className="sidebar">
          <div className="sidebar-section">
            <div className="sidebar-title">Kategoriler</div>
            <div
              className={`cat-item ${catFilter === 'all' ? 'active' : ''}`}
              onClick={() => setCatFilter('all')}
            >
              <div className="cat-item-left">
                <span className="cat-dot" style={{ background: 'var(--accent-blue)' }} />
                <span className="cat-name">Tümü</span>
              </div>
              <span className="cat-count">{data.length}</span>
            </div>
            {categories.map(c => (
              <div
                key={c.name}
                className={`cat-item ${catFilter === c.name ? 'active' : ''}`}
                onClick={() => setCatFilter(catFilter === c.name ? 'all' : c.name)}
              >
                <div className="cat-item-left">
                  <span className="cat-dot" style={{ background: CATEGORY_COLORS[c.name] || '#64748b' }} />
                  <span className="cat-name">{c.name}</span>
                </div>
                <span className="cat-count">{c.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* TRANSACTIONS */}
        <div>
          <div className="transactions-panel">
            <div className="tx-header">
              <span></span>
              <span>İŞLEM</span>
              <span>KATEGORİ</span>
              <span>TARİH</span>
              <span>KAYNAK</span>
              <span style={{ textAlign: 'right' }}>TUTAR</span>
            </div>
            {visible.map((t, i) => (
              <div className="tx-row" key={i} title={t.description}>
                <div className={`tx-direction ${t.direction}`}>
                  {t.direction === 'gelen' ? '↓' : '↑'}
                </div>
                <div className="tx-info">
                  <div className="tx-title">{t.title}</div>
                  <div className="tx-desc">{t.type}{t.installment ? ` · ${t.installment}` : ''}</div>
                </div>
                <div className="tx-category" style={{
                  background: `${CATEGORY_COLORS[t.category] || '#64748b'}15`,
                  color: CATEGORY_COLORS[t.category] || '#64748b',
                  border: `1px solid ${CATEGORY_COLORS[t.category] || '#64748b'}30`
                }}>
                  {t.category}
                </div>
                <div className="tx-date">{formatDate(t.date)}</div>
                <div className="tx-source">{t.source}</div>
                <div className={`tx-amount ${t.direction}`}>
                  {t.direction === 'gelen' ? '+' : '-'}{formatCurrency(t.amount)} ₺
                </div>
              </div>
            ))}
            {visible.length === 0 && (
              <div className="empty-state">
                <div className="icon">🔍</div>
                <p>Bu kriterlere uygun işlem bulunamadı</p>
              </div>
            )}
            {/* Summary row */}
            {visible.length > 0 && (
              <div className="summary-row">
                <div className="summary-item" style={{ color: 'var(--text-muted)' }}>
                  Gösterilen: {visible.length} / {filtered.length}
                </div>
                <div className="summary-item" style={{ color: 'var(--accent-green)' }}>
                  ↓ +{formatCurrency(filtered.filter(t => t.direction === 'gelen').reduce((s, t) => s + t.amount, 0))} ₺
                </div>
                <div className="summary-item" style={{ color: 'var(--accent-red)' }}>
                  ↑ -{formatCurrency(filtered.filter(t => t.direction === 'giden').reduce((s, t) => s + t.amount, 0))} ₺
                </div>
              </div>
            )}
          </div>
          {visibleCount < filtered.length && (
            <div className="load-more">
              <button className="load-more-btn" onClick={() => setVisibleCount(v => v + 30)}>
                Daha Fazla Göster ({filtered.length - visibleCount} kalan)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
