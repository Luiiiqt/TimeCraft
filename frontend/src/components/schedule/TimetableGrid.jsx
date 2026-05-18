import React, { useMemo, useState, useEffect } from 'react'

const DAYS = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY']
const DAY_LABELS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const DAY_SHORT  = ['Mon','Tue','Wed','Thu','Fri','Sat']

const START_HOUR = 7
const START_MIN  = 30
const END_HOUR   = 18
const END_MIN    = 0
const BAND_MIN   = 30
const TOTAL_BANDS = ((END_HOUR * 60 + END_MIN) - (START_HOUR * 60 + START_MIN)) / BAND_MIN
const ROW_H = 52

function timeToBand(t) {
  if (!t) return 0
  const [h, m] = t.split(':').map(Number)
  return Math.round(((h * 60 + m) - (START_HOUR * 60 + START_MIN)) / BAND_MIN)
}

function bandToTime(band) {
  const total = START_HOUR * 60 + START_MIN + band * BAND_MIN
  const h = Math.floor(total / 60)
  const m = total % 60
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12  = ((h % 12) || 12)
  return `${h12}:${String(m).padStart(2,'0')} ${ampm}`
}

function formatTime(t) {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = ((h % 12) || 12)
  return `${h12}:${String(m).padStart(2,'0')} ${ampm}`
}

const PALETTE = [
  { bg:'#E8F5E9', accent:'#2E7D32', text:'#1B5E20' },
  { bg:'#E3F2FD', accent:'#1565C0', text:'#0D47A1' },
  { bg:'#FFF3E0', accent:'#E65100', text:'#BF360C' },
  { bg:'#F3E5F5', accent:'#6A1B9A', text:'#4A148C' },
  { bg:'#E0F7FA', accent:'#00695C', text:'#004D40' },
  { bg:'#FFF8E1', accent:'#F57F17', text:'#E65100' },
  { bg:'#FCE4EC', accent:'#880E4F', text:'#560027' },
  { bg:'#E8EAF6', accent:'#283593', text:'#1A237E' },
]
const colorMap = {}
let colorIdx = 0
function getColor(code) {
  if (!colorMap[code]) colorMap[code] = PALETTE[colorIdx++ % PALETTE.length]
  return colorMap[code]
}

// ── Mobile card for a single schedule entry ──
function MobileCard({ entry, onSlotClick }) {
  const code    = entry.subjectCode ?? entry.subject?.code ?? ''
  const name    = entry.subjectName ?? entry.subject?.name ?? code
  const teacher = entry.teacherName ?? entry.teacher?.fullName ?? ''
  const isLab   = entry.sessionType === 'LABORATORY'
  const isOnline= entry.isOnline || entry.online
  const isConflict = entry.status === 'CONFLICTED'
  const col = isOnline
    ? { bg:'#EFF6FF', accent:'#2563EB', text:'#1D4ED8' }
    : isLab
    ? { bg:'#FFFBEB', accent:'#D97706', text:'#92400E' }
    : getColor(code)

  const sessions = []
  if (entry.day1 && entry.startTime1 && entry.endTime1) {
    sessions.push({
      day: entry.day1,
      start: formatTime(entry.startTime1.substring(0,5)),
      end: formatTime(entry.endTime1.substring(0,5)),
      room: entry.roomName ?? entry.room?.name ?? entry.room?.roomNumber ?? '',
      online: entry.isOnlineTs1 || entry.onlineTs1 || isOnline,
    })
  }
  if (entry.day2 && entry.startTime2 && entry.endTime2) {
    sessions.push({
      day: entry.day2,
      start: formatTime(entry.startTime2.substring(0,5)),
      end: formatTime(entry.endTime2.substring(0,5)),
      room: entry.roomName ?? entry.room?.name ?? entry.room?.roomNumber ?? '',
      online: entry.isOnlineTs2 || entry.onlineTs2,
    })
  }

  return (
    <div
      onClick={() => onSlotClick?.(entry)}
      style={{
        background: col.bg,
        borderRadius: 12,
        borderLeft: `4px solid ${col.accent}`,
        padding: '12px 14px',
        cursor: 'pointer',
        transition: 'transform 0.12s, box-shadow 0.12s',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        WebkitTapHighlightColor: 'transparent',
      }}
      onTouchStart={e => e.currentTarget.style.transform = 'scale(0.985)'}
      onTouchEnd={e => e.currentTarget.style.transform = ''}
    >
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8, marginBottom:6 }}>
        <div style={{ minWidth:0 }}>
          <div style={{
            fontSize:13, fontWeight:700, color:col.text,
            fontFamily:"'JetBrains Mono',monospace",
            letterSpacing:'0.03em', marginBottom:2,
          }}>{code}</div>
          <div style={{
            fontSize:13, fontWeight:600, color:col.text, opacity:0.85,
            lineHeight:1.35,
          }}>{name !== code ? name : ''}</div>
        </div>
        <div style={{ display:'flex', gap:4, flexShrink:0, flexWrap:'wrap', justifyContent:'flex-end' }}>
          {isConflict && <Chip label="⚠ Conflict" bg="rgba(226,75,74,0.15)" color="#E24B4A"/>}
          {isLab && <Chip label="LAB" bg="#FEF3C7" color="#92400E"/>}
          {isOnline && <Chip label="Online" bg="#DBEAFE" color="#1D4ED8"/>}
        </div>
      </div>

      {/* Teacher */}
      {teacher && (
        <div style={{ fontSize:12, color:col.text, opacity:0.65, marginBottom:6, display:'flex', alignItems:'center', gap:5 }}>
          <span style={{ fontSize:11 }}>👤</span> {teacher}
        </div>
      )}

      {/* Sessions */}
      {sessions.map((s, i) => (
        <div key={i} style={{
          display:'flex', alignItems:'center', gap:6, marginTop:4,
          padding:'6px 10px', borderRadius:7,
          background:'rgba(0,0,0,0.04)',
          fontSize:12, fontWeight:500, color:col.text,
        }}>
          <span style={{ fontWeight:700, minWidth:28, flexShrink:0, opacity:0.7 }}>
            {s.day.substring(0,3)}
          </span>
          <span style={{ opacity:0.55 }}>·</span>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11 }}>
            {s.start} – {s.end}
          </span>
          {!s.online && s.room && (
            <>
              <span style={{ opacity:0.4 }}>·</span>
              <span style={{ fontSize:11, opacity:0.7, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {s.room}
              </span>
            </>
          )}
          {s.online && (
            <span style={{ fontSize:10, color:'#2563EB', fontWeight:600 }}>🌐 Online</span>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Day group for mobile (groups schedules by day) ──
function MobileDayGroup({ day, label, schedules, onSlotClick, isToday }) {
  const daySchedules = schedules.filter(e => {
    const d = day.toUpperCase()
    return (e.day1?.toUpperCase() === d) || (e.day2?.toUpperCase() === d)
  })

  return (
    <div style={{ marginBottom:16 }}>
      <div style={{
        display:'flex', alignItems:'center', gap:8, marginBottom:10,
        paddingBottom:6, borderBottom:'2px solid',
        borderColor: isToday ? '#2563EB' : '#E2E8F0',
      }}>
        <span style={{
          fontSize:13, fontWeight:700,
          color: isToday ? '#1D4ED8' : '#475569',
          letterSpacing:'0.04em',
        }}>{label}</span>
        {isToday && (
          <span style={{
            fontSize:10, fontWeight:700, background:'#DBEAFE', color:'#1D4ED8',
            borderRadius:20, padding:'2px 8px',
          }}>Today</span>
        )}
        <span style={{
          marginLeft:'auto', fontSize:11, color:'#94A3B8',
        }}>{daySchedules.length} class{daySchedules.length !== 1 ? 'es' : ''}</span>
      </div>
      {daySchedules.length === 0 ? (
        <div style={{
          textAlign:'center', padding:'14px 0',
          color:'#CBD5E1', fontSize:12, fontStyle:'italic',
        }}>No classes</div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {daySchedules.map((e, i) => (
            <MobileCard key={i} entry={e} onSlotClick={onSlotClick}/>
          ))}
        </div>
      )}
    </div>
  )
}

function Chip({ label, bg, color }) {
  return (
    <span style={{
      fontSize:10, fontWeight:700,
      background:bg, color,
      border:`1px solid ${color}40`,
      borderRadius:4, padding:'2px 6px',
      letterSpacing:'0.05em',
      fontFamily:"'JetBrains Mono',monospace",
      flexShrink:0, whiteSpace:'nowrap',
    }}>{label}</span>
  )
}

const thTime = {
  height:60, padding:'0 14px',
  textAlign:'left',
  background:'#F8FAFC',
  borderBottom:'3px solid transparent',
  borderRight:'2px solid #E2E8F0',
  verticalAlign:'middle',
}

const thDay = {
  height:60, padding:'10px 12px',
  textAlign:'center',
  borderLeft:'1px solid #E2E8F0',
  verticalAlign:'middle',
}

export default function TimetableGrid({ schedules = [], onSlotClick, loading = false }) {

  const [isMobile, setIsMobile] = useState(false)
  const [activeDay, setActiveDay] = useState(null)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const handle = (e) => setIsMobile(e.matches)
    setIsMobile(mq.matches)
    mq.addEventListener('change', handle)
    return () => mq.removeEventListener('change', handle)
  }, [])

  const now = new Date()
  const nowMins = now.getHours()*60+now.getMinutes()
  const nowBand = Math.floor((nowMins-(START_HOUR*60+START_MIN))/BAND_MIN)
  const todayKey = now.toLocaleDateString('en-US',{weekday:'long'}).toUpperCase()

  // Set active day to today on mount (mobile)
  useEffect(() => {
    if (DAYS.includes(todayKey)) setActiveDay(todayKey)
    else setActiveDay(DAYS[0])
  }, [todayKey])

  const bandMap = useMemo(() => {
    const map = {}
    for (let i = 0; i < TOTAL_BANDS; i++) map[i] = {}
    schedules.forEach(entry => {
      const place = (day, s, e, online) => {
        if (!day || !s || !e) return
        const d = day.toUpperCase()
        if (!DAYS.includes(d)) return
        const sb = timeToBand(s.substring(0,5))
        const eb = timeToBand(e.substring(0,5))
        if (sb < 0 || eb > TOTAL_BANDS || sb >= eb) return
        for (let b = sb; b < eb; b++) {
          if (!map[b][d]) map[b][d] = { entry, startBand:sb, endBand:eb, span:eb-sb, isFirst:b===sb, online }
        }
      }
      const ol = entry.isOnline || entry.online
      place(entry.day1, entry.startTime1, entry.endTime1, entry.isOnlineTs1 || entry.onlineTs1 || ol)
      if (entry.day2) place(entry.day2, entry.startTime2, entry.endTime2, entry.isOnlineTs2 || entry.onlineTs2)
    })
    return map
  }, [schedules])

  const allBands = Array.from({length:TOTAL_BANDS},(_,i)=>i)

  // ── Mobile view ──
  if (isMobile) {
    return (
      <div style={{ fontFamily:"'Inter', sans-serif", background:'#F8FAFC', minHeight:'100vh', padding:0 }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600&display=swap');
          .tg-day-tab { transition: all 0.18s; -webkit-tap-highlight-color: transparent; }
          .tg-day-tab:active { transform: scale(0.94); }
        `}</style>

        {loading ? (
          <div style={{ padding:'60px 16px', textAlign:'center', color:'#94A3B8', fontSize:14 }}>
            Loading schedule…
          </div>
        ) : schedules.length === 0 ? (
          <div style={{ padding:'60px 16px', textAlign:'center', color:'#CBD5E1', fontSize:14 }}>
            No schedule found for this term.
          </div>
        ) : (
          <>
            {/* Day selector tabs */}
            <div style={{
              display:'flex', gap:0, overflowX:'auto',
              background:'#fff',
              borderBottom:'1px solid #E2E8F0',
              scrollbarWidth:'none',
              WebkitOverflowScrolling:'touch',
              position:'sticky', top:60, zIndex:50,
            }}>
              {DAYS.map((d, i) => {
                const isToday = d === todayKey
                const isActive = d === activeDay
                const count = schedules.filter(e =>
                  e.day1?.toUpperCase() === d || e.day2?.toUpperCase() === d
                ).length
                return (
                  <button
                    key={d}
                    className="tg-day-tab"
                    onClick={() => setActiveDay(d)}
                    style={{
                      flex:'0 0 auto',
                      display:'flex', flexDirection:'column', alignItems:'center',
                      padding:'10px 14px', border:'none', cursor:'pointer',
                      background:'transparent',
                      borderBottom: isActive
                        ? `3px solid ${isToday ? '#2563EB' : '#475569'}`
                        : '3px solid transparent',
                      color: isActive ? (isToday ? '#1D4ED8' : '#1E293B') : '#94A3B8',
                      fontFamily:"'Inter',sans-serif",
                      minWidth:52,
                    }}
                  >
                    <span style={{ fontSize:13, fontWeight:700 }}>{DAY_SHORT[i]}</span>
                    {count > 0 && (
                      <span style={{
                        marginTop:3, fontSize:9, fontWeight:700,
                        background: isToday && isActive ? '#DBEAFE' : '#F1F5F9',
                        color: isToday && isActive ? '#1D4ED8' : '#64748B',
                        borderRadius:10, padding:'1px 5px',
                      }}>{count}</span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Active day content */}
            <div style={{ padding:'16px 14px' }}>
              {activeDay && (
                <MobileDayGroup
                  day={activeDay}
                  label={DAY_LABELS[DAYS.indexOf(activeDay)]}
                  schedules={schedules}
                  onSlotClick={onSlotClick}
                  isToday={activeDay === todayKey}
                />
              )}
            </div>
          </>
        )}
      </div>
    )
  }

  // ── Tablet/Desktop grid view ──
  return (
    <div style={{ fontFamily:"'Segoe UI',system-ui,sans-serif", background:'#F8FAFC', minHeight:'100vh', padding:0 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600&display=swap');
        .tg-root { font-family: 'Inter', sans-serif; }
        .tg-slot { transition: transform 0.1s, box-shadow 0.1s; cursor:pointer; }
        .tg-slot:hover { transform: scale(1.01); box-shadow: 0 4px 16px rgba(0,0,0,0.12); z-index:10; position:relative; }
        .tg-row:hover td.tg-empty { background: rgba(0,0,0,0.015) !important; }

        /* Compact column headers for tablet */
        @media (max-width: 1023px) {
          .tg-day-full { display: none !important; }
          .tg-day-short { display: block !important; }
          .tg-time-col { width: 90px !important; }
        }
        @media (min-width: 1024px) {
          .tg-day-short { display: none !important; }
        }
      `}</style>

      <div style={{ overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
        <table style={{
          width:'100%', borderCollapse:'collapse',
          minWidth:600, tableLayout:'fixed',
          background:'#fff',
          boxShadow:'0 1px 4px rgba(0,0,0,0.08)',
        }}>
          <colgroup>
            <col className="tg-time-col" style={{ width:140 }}/>
            {DAYS.map(d => <col key={d}/>)}
          </colgroup>

          {/* Header */}
          <thead>
            <tr>
              <th style={thTime}>
                <span style={{ fontSize:11, fontWeight:600, color:'#94A3B8', letterSpacing:'0.08em', fontFamily:"'JetBrains Mono',monospace" }}>TIME</span>
              </th>
              {DAYS.map((d, i) => {
                const isToday = d === todayKey
                return (
                  <th key={d} style={{
                    ...thDay,
                    background: isToday ? '#EFF6FF' : '#F8FAFC',
                    borderBottom: isToday ? '3px solid #2563EB' : '3px solid transparent',
                    color: isToday ? '#1D4ED8' : '#475569',
                  }}>
                    {/* Full label (desktop) */}
                    <div className="tg-day-full">
                      <div style={{ fontSize:13, fontWeight:700, letterSpacing:'0.04em' }}>{DAY_SHORT[i]}</div>
                      <div style={{ fontSize:11, fontWeight:500, color: isToday ? '#3B82F6' : '#94A3B8', marginTop:2, letterSpacing:'0.02em' }}>{DAY_LABELS[i]}</div>
                    </div>
                    {/* Short label (tablet) */}
                    <div className="tg-day-short" style={{ fontSize:12, fontWeight:700 }}>{DAY_SHORT[i]}</div>
                  </th>
                )
              })}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding:80, textAlign:'center', color:'#94A3B8', fontSize:14 }}>Loading schedule…</td></tr>
            ) : schedules.length === 0 ? (
              <tr><td colSpan={7} style={{ padding:80, textAlign:'center', color:'#CBD5E1', fontSize:14 }}>No schedule found for this term.</td></tr>
            ) : allBands.map(band => {
              const bandMins = START_HOUR*60+START_MIN+band*BAND_MIN
              const isHour   = bandMins%60===0
              const isCurrent= band===nowBand
              const timeLabel = bandToTime(band)
              const timeEnd   = bandToTime(band+1)

              return (
                <tr key={band} className="tg-row" style={{ height:ROW_H }}>
                  {/* Time cell */}
                  <td style={{
                    borderTop: isHour ? '1.5px solid #E2E8F0' : '1px dashed #F1F5F9',
                    borderRight:'2px solid #E2E8F0',
                    background: isCurrent ? '#FFFBEB' : isHour ? '#F8FAFC' : '#FAFBFC',
                    verticalAlign:'top',
                    padding:'10px 10px 0',
                    whiteSpace:'nowrap',
                  }}>
                    <div style={{ display:'flex', flexDirection:'column', gap:1 }}>
                      <span style={{
                        fontSize:11, fontWeight:600,
                        color: isCurrent ? '#D97706' : '#334155',
                        fontFamily:"'JetBrains Mono',monospace",
                        letterSpacing:'0.01em',
                      }}>{timeLabel}</span>
                      <span style={{
                        fontSize:11, fontWeight:600,
                        color: isCurrent ? '#FCD34D' : '#94A3B8',
                        fontFamily:"'JetBrains Mono',monospace",
                      }}>{timeEnd}</span>
                      {isCurrent && (
                        <span style={{ fontSize:9, color:'#D97706', fontWeight:600, marginTop:2 }}>● Now</span>
                      )}
                    </div>
                  </td>

                  {/* Day cells */}
                  {DAYS.map(day => {
                    const slot = bandMap[band]?.[day]
                    const isToday = day === todayKey
                    const borderTop = isHour ? '1.5px solid #E2E8F0' : '1px dashed #F1F5F9'

                    if (!slot) return (
                      <td key={day} className="tg-empty" style={{
                        borderTop, borderLeft:'1px solid #F1F5F9',
                        background: isToday ? '#F0F9FF' : 'transparent',
                      }}/>
                    )
                    if (!slot.isFirst) return null

                    const { entry } = slot
                    const code    = entry.subjectCode ?? entry.subject?.code ?? ''
                    const name    = entry.subjectName ?? entry.subject?.name ?? code
                    const teacher = entry.teacherName ?? entry.teacher?.fullName ?? ''
                    const room    = entry.roomName ?? entry.room?.name ?? entry.room?.roomNumber ?? ''
                    const isLab   = entry.sessionType === 'LABORATORY'
                    const isOnline= slot.online || entry.isOnline || entry.online

                    const col = isOnline
                      ? { bg:'#EFF6FF', accent:'#2563EB', text:'#1D4ED8' }
                      : isLab
                      ? { bg:'#FFFBEB', accent:'#D97706', text:'#92400E' }
                      : getColor(code)

                    const heightPx = ROW_H * slot.span
                    const showName    = heightPx >= 80
                    const showTeacher = heightPx >= 80
                    const showRoom    = heightPx >= 100

                    return (
                      <td
                        key={day}
                        rowSpan={slot.span}
                        onClick={() => onSlotClick?.(entry)}
                        className="tg-slot"
                        style={{
                          borderTop,
                          borderLeft:'1px solid #F1F5F9',
                          background: col.bg,
                          verticalAlign:'top',
                          padding:'8px 8px 6px 12px',
                          position:'relative',
                        }}
                      >
                        {/* Left accent bar */}
                        <div style={{
                          position:'absolute', left:0, top:4, bottom:4,
                          width:4, borderRadius:'0 3px 3px 0',
                          background:col.accent,
                        }}/>

                        {/* Code + badges */}
                        <div style={{ display:'flex', alignItems:'center', gap:4, flexWrap:'wrap', marginBottom:3 }}>
                          <span style={{
                            fontSize:12, fontWeight:700,
                            color:col.text,
                            fontFamily:"'JetBrains Mono',monospace",
                            letterSpacing:'0.03em',
                          }}>{code}</span>
                          {isLab && <Chip label="LAB" bg="#FEF3C7" color="#92400E"/>}
                          {isOnline && <Chip label="Online" bg="#DBEAFE" color="#1D4ED8"/>}
                        </div>

                        {showName && name && name !== code && (
                          <div style={{
                            fontSize:11, fontWeight:500,
                            color:col.text, opacity:0.85,
                            lineHeight:1.35, marginBottom:2,
                            overflow:'hidden',
                            display:'-webkit-box',
                            WebkitLineClamp:2,
                            WebkitBoxOrient:'vertical',
                          }}>{name}</div>
                        )}

                        {showTeacher && teacher && (
                          <div style={{
                            fontSize:10, fontWeight:500,
                            color:col.text, opacity:0.6,
                            whiteSpace:'nowrap', overflow:'hidden',
                            textOverflow:'ellipsis', marginBottom:1,
                          }}>{teacher}</div>
                        )}

                        {showRoom && (
                          <div style={{
                            fontSize:10, fontWeight:600,
                            color:col.accent, opacity:0.9,
                            whiteSpace:'nowrap', overflow:'hidden',
                            textOverflow:'ellipsis',
                          }}>{isOnline ? 'Online Class' : room}</div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}