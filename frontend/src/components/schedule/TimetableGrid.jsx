import React, { useMemo } from 'react'

const DAYS = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY']
const DAY_LABELS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

const START_HOUR = 7
const START_MIN  = 30
const END_HOUR   = 18
const END_MIN    = 0
const BAND_MIN   = 30

const TOTAL_BANDS = ((END_HOUR * 60 + END_MIN) - (START_HOUR * 60 + START_MIN)) / BAND_MIN

function timeToBand(t) {
  if (!t) return 0
  const [h, m] = t.split(':').map(Number)
  return Math.round(((h * 60 + m) - (START_HOUR * 60 + START_MIN)) / BAND_MIN)
}

function bandToLabel(band) {
  const mins = START_HOUR * 60 + START_MIN + band * BAND_MIN
  const h = Math.floor(mins / 60), m = mins % 60
  const ampm = h >= 12 ? 'pm' : 'am'
  return `${((h % 12) || 12)}:${String(m).padStart(2,'0')} ${ampm}`
}

const SUBJECT_BGS = [
  'rgba(34,197,94,0.12)', 'rgba(16,185,129,0.12)', 'rgba(20,184,166,0.11)',
  'rgba(6,182,212,0.10)', 'rgba(74,222,128,0.09)', 'rgba(52,211,153,0.11)',
  'rgba(34,197,94,0.08)', 'rgba(20,184,166,0.08)',
]
const SUBJECT_ACCENTS = ['#22C55E','#10B981','#14B8A6','#06B6D4','#4ADE80','#34D399','#22C55E','#14B8A6']
const colorMap = {}
let colorIdx = 0
function getSubjectStyle(code) {
  if (!code) return { bg: SUBJECT_BGS[0], accent: SUBJECT_ACCENTS[0] }
  if (!colorMap[code]) {
    const i = colorIdx++ % SUBJECT_BGS.length
    colorMap[code] = { bg: SUBJECT_BGS[i], accent: SUBJECT_ACCENTS[i] }
  }
  return colorMap[code]
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@500;600&display=swap');
  @keyframes tg-in { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
  .tg-root { animation: tg-in 0.3s ease both; }
  .tg-row:hover .tg-td { background-color: rgba(34,197,94,0.035) !important; }
  .tg-slot { transition: filter 0.12s; cursor: pointer; }
  .tg-slot:hover { filter: brightness(1.15); }
`

export default function TimetableGrid({ schedules = [], onSlotClick, loading = false }) {
  const bandMap = useMemo(() => {
    const map = {}
    for (let i = 0; i < TOTAL_BANDS; i++) map[i] = {}

    schedules.forEach(entry => {
      const place = (day, s, e, forceOnline) => {
        if (!day || !s || !e) return
        const d = day.toUpperCase()
        if (!DAYS.includes(d)) return
        const sb = timeToBand(s.substring(0, 5))
        const eb = timeToBand(e.substring(0, 5))
        if (sb < 0 || eb > TOTAL_BANDS || sb >= eb) return
        for (let b = sb; b < eb; b++) {
          if (!map[b]) map[b] = {}
          if (!map[b][d]) {
            map[b][d] = { entry, startBand: sb, endBand: eb, span: eb - sb, isFirst: b === sb, forceOnline }
          }
        }
      }
      const online = entry.isOnline || entry.online
      place(entry.day1, entry.startTime1, entry.endTime1, entry.isOnlineTs1 || entry.onlineTs1 || online)
      if (entry.day2) place(entry.day2, entry.startTime2, entry.endTime2, entry.isOnlineTs2 || entry.onlineTs2)
    })
    return map
  }, [schedules])

  const now = new Date()
  const nowMins = now.getHours() * 60 + now.getMinutes()
  const nowBand = Math.floor((nowMins - (START_HOUR * 60 + START_MIN)) / BAND_MIN)
  const todayKey = now.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()

  // Only show bands that have content or are on-the-hour
  const bands = Array.from({ length: TOTAL_BANDS }, (_, i) => i).filter(i => {
    const mins = START_HOUR * 60 + START_MIN + i * BAND_MIN
    return mins % 60 === 0 || DAYS.some(d => bandMap[i]?.[d])
  })

  const ROW_H = 44

  return (
    <div className="tg-root" style={{ fontFamily: "'DM Sans',sans-serif" }}>
      <style>{CSS}</style>

      <div style={{ overflowX: 'auto', borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(8,16,30,0.8)', backdropFilter: 'blur(20px)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 780, tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: 128 }} />
            {DAYS.map(d => <col key={d} />)}
          </colgroup>

          {/* Header row */}
          <thead>
            <tr>
              <th style={{ ...TH, background: 'rgba(255,255,255,0.025)', borderRight: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.2)', fontSize: 9 }}>
                TIME
              </th>
              {DAY_LABELS.map((label, i) => {
                const isToday = DAYS[i] === todayKey
                return (
                  <th key={label} style={{
                    ...TH,
                    color: isToday ? '#4ADE80' : 'rgba(255,255,255,0.45)',
                    borderLeft: '1px solid rgba(255,255,255,0.06)',
                    background: isToday ? 'rgba(34,197,94,0.07)' : 'rgba(255,255,255,0.015)',
                    borderBottom: isToday ? '2px solid #22C55E' : '1px solid rgba(255,255,255,0.08)',
                    position: 'relative',
                  }}>
                    {label}
                    {isToday && <div style={{ position:'absolute', bottom:0, left:'20%', right:'20%', height:2, background:'#22C55E', borderRadius:2 }} />}
                  </th>
                )
              })}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ padding: 56, textAlign: 'center', color: 'rgba(255,255,255,0.18)', fontFamily: "'DM Mono',monospace", fontSize: 11, letterSpacing: '0.08em' }}>
                  LOADING SCHEDULE…
                </td>
              </tr>
            ) : schedules.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: 72, textAlign: 'center', color: 'rgba(255,255,255,0.12)', fontFamily: "'DM Mono',monospace", fontSize: 11, letterSpacing: '0.08em' }}>
                  NO SCHEDULE FOUND FOR THIS TERM
                </td>
              </tr>
            ) : bands.map((band, ri) => {
              const bandMins = START_HOUR * 60 + START_MIN + band * BAND_MIN
              const isHour = bandMins % 60 === 0
              const isCurrent = band === nowBand
              const timeStr = `${bandToLabel(band)} – ${bandToLabel(band + 1)}`

              return (
                <tr key={band} className="tg-row">
                  {/* Time column */}
                  <td style={{
                    height: ROW_H,
                    padding: '0 14px',
                    borderTop: isHour ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.04)',
                    borderRight: '1px solid rgba(255,255,255,0.08)',
                    background: isCurrent ? 'rgba(34,197,94,0.07)' : 'rgba(255,255,255,0.012)',
                    verticalAlign: 'middle',
                    whiteSpace: 'nowrap',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{
                        fontSize: 10,
                        fontWeight: isHour ? 600 : 400,
                        color: isCurrent ? '#4ADE80' : isHour ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.22)',
                        fontFamily: "'DM Mono',monospace",
                        letterSpacing: '0.02em',
                      }}>{timeStr}</span>
                      {isCurrent && <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#22C55E', flexShrink: 0, boxShadow: '0 0 5px #22C55E' }} />}
                    </div>
                  </td>

                  {/* Day cells */}
                  {DAYS.map(day => {
                    const slot = bandMap[band]?.[day]
                    const isToday = day === todayKey
                    const borderTop = isHour ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(255,255,255,0.03)'

                    if (!slot) {
                      return (
                        <td key={day} className="tg-td" style={{
                          height: ROW_H,
                          borderTop,
                          borderLeft: '1px solid rgba(255,255,255,0.05)',
                          background: isToday ? 'rgba(34,197,94,0.012)' : 'transparent',
                        }} />
                      )
                    }

                    if (!slot.isFirst) return null

                    const { entry } = slot
                    const code    = entry.subjectCode ?? entry.subject?.code ?? ''
                    const name    = entry.subjectName ?? entry.subject?.name ?? code
                    const teacher = entry.teacherName ?? entry.teacher?.fullName ?? ''
                    const room    = entry.roomName ?? entry.room?.roomNumber ?? ''
                    const isLab   = entry.sessionType === 'LABORATORY'
                    const isOnline = slot.forceOnline || entry.isOnline || entry.online
                    const { bg, accent } = getSubjectStyle(code)
                    const textColor = isOnline ? '#93C5FD' : isLab ? '#FCD34D' : accent

                    return (
                      <td
                        key={day}
                        rowSpan={slot.span}
                        onClick={() => onSlotClick?.(entry)}
                        className="tg-slot"
                        style={{
                          height: ROW_H * slot.span,
                          borderTop,
                          borderLeft: '1px solid rgba(255,255,255,0.05)',
                          background: isOnline ? 'rgba(59,130,246,0.1)' : isLab ? 'rgba(245,158,11,0.1)' : bg,
                          verticalAlign: 'top',
                          padding: '7px 10px 7px 13px',
                          position: 'relative',
                        }}
                      >
                        {/* Left accent bar */}
                        <div style={{ position: 'absolute', left: 0, top: 3, bottom: 3, width: 3, borderRadius: '0 2px 2px 0', background: isOnline ? '#3B82F6' : isLab ? '#F59E0B' : accent }} />

                        {/* Subject code + badges */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: textColor, fontFamily: "'DM Mono',monospace", letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{code}</span>
                          {isLab && <Badge label="LAB" color="#F59E0B" />}
                          {isOnline && <Badge label="ONLINE" color="#3B82F6" />}
                        </div>

                        {/* Subject name */}
                        {slot.span >= 2 && name !== code && (
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.4 }}>{name}</div>
                        )}

                        {/* Teacher */}
                        {slot.span >= 2 && teacher && (
                          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {teacher}
                          </div>
                        )}

                        {/* Room */}
                        {slot.span >= 3 && room && (
                          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {isOnline ? 'Online Class' : room}
                          </div>
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

function Badge({ label, color }) {
  return (
    <span style={{
      fontSize: 7, fontWeight: 700, color,
      background: `${color}20`,
      border: `1px solid ${color}40`,
      borderRadius: 3, padding: '1px 4px',
      letterSpacing: '0.06em',
      fontFamily: "'DM Mono',monospace",
      flexShrink: 0,
    }}>{label}</span>
  )
}

const TH = {
  height: 44,
  padding: '0 12px',
  textAlign: 'center',
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: '0.08em',
  fontFamily: "'DM Mono',monospace",
  textTransform: 'uppercase',
  borderBottom: '1px solid rgba(255,255,255,0.08)',
  whiteSpace: 'nowrap',
}