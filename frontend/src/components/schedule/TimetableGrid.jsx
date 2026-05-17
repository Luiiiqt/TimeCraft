import React from 'react'
import ScheduleSlot from './ScheduleSlot'

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const START_HOUR = 7
const START_MIN = 30
const END_HOUR = 18
const END_MIN = 0
const BAND_MINUTES = 30

function totalBands() {
  const startTotal = START_HOUR * 60 + START_MIN
  const endTotal = END_HOUR * 60 + END_MIN
  return (endTotal - startTotal) / BAND_MINUTES
}

const TOTAL_BANDS = totalBands() // 21

function timeToBand(timeStr) {
  if (!timeStr) return 0
  const [h, m] = timeStr.split(':').map(Number)
  const minutes = h * 60 + m
  const startMinutes = START_HOUR * 60 + START_MIN
  return Math.round((minutes - startMinutes) / BAND_MINUTES)
}

function bandToLabel(band) {
  const minutes = START_HOUR * 60 + START_MIN + band * BAND_MINUTES
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = ((h % 12) || 12)
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

// Deduplicate schedule entries: same subjectCode + day + startTime = same visual block
function deduplicateEntries(items) {
  const seen = new Set()
  return items.filter(item => {
    const key = `${item.entry.subjectCode ?? item.entry.subject?.code}-${item.startBand}-${item.endBand}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// Color palette for subjects — cycles through green-family hues
const SUBJECT_COLORS = [
  { bg: '#C8E6C9', border: '#388E3C', text: '#1B5E20', label: '#2E7D32' },  // green
  { bg: '#FFF9C4', border: '#F9A825', text: '#E65100', label: '#F57F17' },  // yellow
  { bg: '#F8BBD0', border: '#C2185B', text: '#880E4F', label: '#AD1457' },  // pink
  { bg: '#B2EBF2', border: '#0097A7', text: '#004D40', label: '#00838F' },  // teal
  { bg: '#D1C4E9', border: '#7B1FA2', text: '#4A148C', label: '#6A1B9A' },  // purple
  { bg: '#FFE0B2', border: '#EF6C00', text: '#BF360C', label: '#E64A19' },  // orange
  { bg: '#CFD8DC', border: '#546E7A', text: '#263238', label: '#455A64' },  // slate
  { bg: '#DCEDC8', border: '#558B2F', text: '#33691E', label: '#558B2F' },  // lime
]

const subjectColorMap = {}
let colorIdx = 0
function getSubjectColor(code) {
  if (!code) return SUBJECT_COLORS[0]
  if (!subjectColorMap[code]) {
    subjectColorMap[code] = SUBJECT_COLORS[colorIdx % SUBJECT_COLORS.length]
    colorIdx++
  }
  return subjectColorMap[code]
}

const BAND_HEIGHT = 50 // px per 30-min band
const HEADER_HEIGHT = 48
const TIME_COL_WIDTH = 82

export default function TimetableGrid({ schedules = [], onSlotClick, loading = false }) {
  // Reset color map on each render so colors are stable per subject code
  // (do NOT reset colorIdx here — keep it module-level for consistency)

  // Build: day → list of placed entries (NO side-by-side, just stack by start time)
  const dayEntries = {}
  DAYS.forEach(d => { dayEntries[d] = [] })

  schedules.forEach(entry => {
    const day1 = entry.day1?.toUpperCase()
    const day2 = entry.day2?.toUpperCase()
    const ts1Online = entry.isOnlineTs1 === true || entry.onlineTs1 === true
    const ts2Online = entry.isOnlineTs2 === true || entry.onlineTs2 === true

    const place = (day, startStr, endStr, session, forceOnline) => {
      if (!day || !startStr || !endStr || !DAYS.includes(day)) return
      const start = startStr.substring(0, 5)
      const end = endStr.substring(0, 5)
      const startBand = timeToBand(start)
      const endBand = timeToBand(end)
      if (startBand < 0 || endBand > TOTAL_BANDS || startBand >= endBand) return
      dayEntries[day].push({ startBand, endBand, session, entry: { ...entry, _forceOnline: forceOnline } })
    }

    const isOnline = entry.isOnline === true || entry.online === true

    if (isOnline && day1 === 'SATURDAY') {
      if (entry.startTime1) place('SATURDAY', entry.startTime1, entry.endTime1, '1', true)
      if (day2 && entry.startTime2) place(day2, entry.startTime2, entry.endTime2, '2', false)
    } else {
      if (day1 && entry.startTime1) place(day1, entry.startTime1, entry.endTime1, '1', ts1Online)
      if (day2 && entry.startTime2) place(day2, entry.startTime2, entry.endTime2, '2', ts2Online)
    }
  })

  // Deduplicate per day
  DAYS.forEach(day => {
    dayEntries[day] = deduplicateEntries(dayEntries[day])
  })

  const totalHeight = TOTAL_BANDS * BAND_HEIGHT

  return (
    <div style={{ overflowX: 'auto', fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `${TIME_COL_WIDTH}px repeat(6, 1fr)`,
        minWidth: 820,
        border: '2px solid #A5D6A7',
        borderRadius: 14,
        overflow: 'hidden',
        background: '#fff',
        boxShadow: '0 2px 16px rgba(56,142,60,0.08)',
      }}>

        {/* ── Corner cell ── */}
        <div style={styles.cornerCell} />

        {/* ── Day headers ── */}
        {DAY_LABELS.map((label, i) => (
          <div key={label} style={{
            ...styles.dayHeader,
            borderLeft: i === 0 ? '2px solid #A5D6A7' : '1px solid #C8E6C9',
          }}>
            {label.toUpperCase()}
          </div>
        ))}

        {/* ── Time column ── */}
        <div style={{ position: 'relative', height: totalHeight, borderRight: '2px solid #A5D6A7', background: '#F1F8E9' }}>
          {Array.from({ length: TOTAL_BANDS + 1 }, (_, i) => {
            const label = bandToLabel(i)
            return (
              <div key={i} style={{
                position: 'absolute',
                top: i * BAND_HEIGHT,
                right: 0,
                left: 0,
                height: 0,
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'flex-start',
                paddingRight: 6,
                zIndex: 1,
                transform: 'translateY(-50%)',
              }}>
                <span style={{
                  fontSize: 8,
                  fontWeight: 600,
                  color: '#4CAF50',
                  letterSpacing: 0.1,
                  whiteSpace: 'nowrap',
                }}>{label}</span>
              </div>
            )
          })}
          {/* Grid lines in time col */}
          {Array.from({ length: TOTAL_BANDS }, (_, i) => (
            <div key={`tl-${i}`} style={{
              position: 'absolute',
              top: i * BAND_HEIGHT,
              left: 0, right: 0,
              borderTop: '1px solid #C8E6C9',
            }} />
          ))}
        </div>

        {/* ── Day columns ── */}
        {DAYS.map((day, di) => {
          const items = dayEntries[day]

          return (
            <div key={day} style={{
              position: 'relative',
              height: totalHeight,
              borderLeft: di === 0 ? '2px solid #A5D6A7' : '1px solid #C8E6C9',
              background: '#fff',
            }}>
              {/* Grid lines — every 30 min */}
              {Array.from({ length: TOTAL_BANDS }, (_, i) => (
                <div key={`bg-${i}`} style={{
                  position: 'absolute',
                  top: i * BAND_HEIGHT,
                  left: 0, right: 0,
                  height: BAND_HEIGHT,
                  borderTop: '1px solid #E8F5E9',
                  pointerEvents: 'none',
                }} />
              ))}

              {/* Schedule blocks — solid fill, centered, Image-1 style */}
              {!loading && items.map((item, idx) => {
                const spanBands = item.endBand - item.startBand
                const heightPx = spanBands * BAND_HEIGHT - 3
                const topPx = item.startBand * BAND_HEIGHT + 1
                const subjectCode = item.entry.subjectCode ?? item.entry.subject?.code ?? ''
                const color = getSubjectColor(subjectCode)
                const isOnline = item.entry._forceOnline || item.entry.isOnline || item.entry.online
                const isLab = item.entry.sessionType === 'LABORATORY'
                const teacherName = item.entry.teacherName ?? item.entry.teacher?.fullName ?? ''
                const roomName = item.entry.roomName ?? item.entry.room?.roomNumber ?? ''
                const subjectName = item.entry.subjectName ?? item.entry.subject?.name ?? subjectCode
                const blockBg = isOnline ? '#BBDEFB' : color.bg
                const blockText = isOnline ? '#0D47A1' : color.text
                const blockSub = isOnline ? '#1565C0' : color.label

                // Layout tiers — with BAND_HEIGHT=50: 1band=50px, 2bands=100px, 3bands=150px
                const tiny = heightPx < 48       // 1 band: code only
                const compact = heightPx < 96    // 2 bands: code + name + teacher, no room
                // 3+ bands: full content

                return (
                  <div
                    key={`${item.entry.id}-${item.session}-${idx}`}
                    onClick={() => onSlotClick?.(item.entry)}
                    title={`${subjectCode} — ${subjectName}\n${teacherName}\n${roomName}`}
                    style={{
                      position: 'absolute',
                      top: topPx,
                      left: 2,
                      right: 2,
                      height: heightPx,
                      borderRadius: 8,
                      background: blockBg,
                      border: 'none',
                      cursor: onSlotClick ? 'pointer' : 'default',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-start',
                      alignItems: 'stretch',
                      padding: tiny ? '3px 6px' : compact ? '5px 8px' : '7px 10px',
                      boxSizing: 'border-box',
                      zIndex: 2,
                      transition: 'filter 0.15s',
                      gap: 0,
                    }}
                    onMouseEnter={e => e.currentTarget.style.filter = 'brightness(0.93)'}
                    onMouseLeave={e => e.currentTarget.style.filter = 'none'}
                  >
                    {/* Row 1: Subject code + badges */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                      <span style={{
                        fontSize: tiny ? 9 : 11,
                        fontWeight: 800,
                        color: blockText,
                        letterSpacing: 0.3,
                        lineHeight: 1.3,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        flexShrink: 1,
                      }}>{subjectCode}</span>
                      {isLab && (
                        <span style={{ fontSize: 7, fontWeight: 700, color: blockText, background: `${blockText}25`, borderRadius: 3, padding: '1px 4px', letterSpacing: 0.4, flexShrink: 0 }}>LAB</span>
                      )}
                      {isOnline && (
                        <span style={{ fontSize: 7, fontWeight: 700, color: '#0D47A1', background: '#0D47A122', borderRadius: 3, padding: '1px 4px', letterSpacing: 0.4, flexShrink: 0 }}>ONLINE</span>
                      )}
                    </div>

                    {/* Row 2: Subject name — 1 line clamp */}
                    {!tiny && (
                      <div style={{
                        fontSize: 10,
                        color: blockSub,
                        fontWeight: 500,
                        lineHeight: 1.3,
                        marginTop: 2,
                        flexShrink: 0,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        width: '100%',
                      }}>{subjectName}</div>
                    )}

                    {/* Row 3: Teacher */}
                    {!tiny && teacherName && (
                      <div style={{
                        fontSize: 9,
                        color: blockSub,
                        fontWeight: 400,
                        lineHeight: 1.3,
                        marginTop: 3,
                        flexShrink: 0,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        width: '100%',
                        opacity: 0.9,
                      }}>· {teacherName}</div>
                    )}

                    {/* Row 4: Room */}
                    {!tiny && (
                      <div style={{
                        fontSize: 8.5,
                        color: blockSub,
                        fontWeight: 400,
                        lineHeight: 1.3,
                        marginTop: 2,
                        flexShrink: 0,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        width: '100%',
                        opacity: 0.85,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                      }}>
                        □ {isOnline ? 'Online Class' : roomName || '—'}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )
        })}

      </div>
    </div>
  )
}

function badgeStyle(borderColor, bgColor) {
  return {
    fontSize: 7,
    fontWeight: 700,
    color: borderColor,
    background: bgColor,
    border: `1px solid ${borderColor}40`,
    borderRadius: 3,
    padding: '0px 3px',
    letterSpacing: 0.4,
    lineHeight: '12px',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  }
}

const styles = {
  cornerCell: {
    height: HEADER_HEIGHT,
    background: '#F1F8E9',
    borderBottom: '2px solid #A5D6A7',
    borderRight: '2px solid #A5D6A7',
  },
  dayHeader: {
    height: HEADER_HEIGHT,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#F1F8E9',
    borderBottom: '2px solid #A5D6A7',
    fontSize: 11,
    fontWeight: 800,
    color: '#2E7D32',
    letterSpacing: 1,
  },
}