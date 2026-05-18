import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../../services/api";

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const START_HOUR = 7, START_MIN = 30, END_HOUR = 18, END_MIN = 0, BAND_MIN = 30
const TOTAL_BANDS = ((END_HOUR * 60 + END_MIN) - (START_HOUR * 60 + START_MIN)) / BAND_MIN
const ROW_H = 52

function timeToBand(t) {
  if (!t) return 0
  const [h, m] = t.split(':').map(Number)
  return Math.round(((h * 60 + m) - (START_HOUR * 60 + START_MIN)) / BAND_MIN)
}
function bandToTime(band) {
  const total = START_HOUR * 60 + START_MIN + band * BAND_MIN
  const h = Math.floor(total / 60), m = total % 60
  const ampm = h >= 12 ? 'PM' : 'AM', h12 = ((h % 12) || 12)
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

const PALETTE = [
  { bg: '#E8F5E9', accent: '#2E7D32', text: '#1B5E20' },
  { bg: '#E3F2FD', accent: '#1565C0', text: '#0D47A1' },
  { bg: '#FFF3E0', accent: '#E65100', text: '#BF360C' },
  { bg: '#F3E5F5', accent: '#6A1B9A', text: '#4A148C' },
  { bg: '#E0F7FA', accent: '#00695C', text: '#004D40' },
  { bg: '#FFF8E1', accent: '#F57F17', text: '#E65100' },
  { bg: '#FCE4EC', accent: '#880E4F', text: '#560027' },
  { bg: '#E8EAF6', accent: '#283593', text: '#1A237E' },
]
const colorMap = {}; let colorIdx = 0
function getColor(code) {
  if (!colorMap[code]) colorMap[code] = PALETTE[colorIdx++ % PALETTE.length]
  return colorMap[code]
}

function Chip({ label, bg, color }) {
  return (
    <span style={{ fontSize: 10, fontWeight: 700, background: bg, color, border: `1px solid ${color}40`, borderRadius: 4, padding: '2px 6px', letterSpacing: '0.05em', fontFamily: 'monospace', flexShrink: 0 }}>{label}</span>
  )
}

function PrintGrid({ schedules, loading }) {
  const bandMap = useMemo(() => {
    const map = {}
    for (let i = 0; i < TOTAL_BANDS; i++) map[i] = {}
    schedules.forEach(entry => {
      const place = (day, s, e, online) => {
        if (!day || !s || !e) return
        const d = day.toUpperCase()
        if (!DAYS.includes(d)) return
        const sb = timeToBand(s.substring(0, 5)), eb = timeToBand(e.substring(0, 5))
        if (sb < 0 || eb > TOTAL_BANDS || sb >= eb) return
        for (let b = sb; b < eb; b++) {
          if (!map[b][d]) map[b][d] = { entry, startBand: sb, endBand: eb, span: eb - sb, isFirst: b === sb, online }
        }
      }
      const ol = entry.isOnline || entry.online
      place(entry.day1, entry.startTime1, entry.endTime1, entry.isOnlineTs1 || entry.onlineTs1 || ol)
      if (entry.day2) place(entry.day2, entry.startTime2, entry.endTime2, entry.isOnlineTs2 || entry.onlineTs2)
    })
    return map
  }, [schedules])

  const allBands = Array.from({ length: TOTAL_BANDS }, (_, i) => i)

  return (
    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640, tableLayout: 'fixed', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
        <colgroup>
          <col style={{ width: 90 }} />
          {DAYS.map(d => <col key={d} />)}
        </colgroup>
        <thead>
          <tr>
            <th style={{ height: 56, padding: '0 10px', textAlign: 'left', background: '#F8FAFC', borderBottom: '3px solid transparent', borderRight: '2px solid #E2E8F0', verticalAlign: 'middle' }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8', letterSpacing: '0.08em', fontFamily: 'monospace' }}>TIME</span>
            </th>
            {DAYS.map((d, i) => (
              <th key={d} style={{ height: 56, padding: '8px 6px', textAlign: 'center', borderLeft: '1px solid #E2E8F0', verticalAlign: 'middle', background: '#F8FAFC', borderBottom: '3px solid transparent', color: '#475569' }}>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.04em' }}>{DAY_SHORT[i]}</div>
                <div style={{ fontSize: 10, fontWeight: 500, color: '#94A3B8', marginTop: 2, display: 'none' }} className="sp-day-full">{DAY_LABELS[i]}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={7} style={{ padding: 80, textAlign: 'center', color: '#94A3B8', fontSize: 14 }}>Loading schedule…</td></tr>
          ) : schedules.length === 0 ? (
            <tr><td colSpan={7} style={{ padding: 80, textAlign: 'center', color: '#CBD5E1', fontSize: 14 }}>No schedule found.</td></tr>
          ) : allBands.map(band => {
            const bandMins = START_HOUR * 60 + START_MIN + band * BAND_MIN
            const isHour = bandMins % 60 === 0
            return (
              <tr key={band} style={{ height: ROW_H }}>
                <td style={{ borderTop: isHour ? '1.5px solid #E2E8F0' : '1px dashed #F1F5F9', borderRight: '2px solid #E2E8F0', background: isHour ? '#F8FAFC' : '#FAFBFC', verticalAlign: 'top', padding: '8px 8px 0', whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#334155', fontFamily: 'monospace' }}>{bandToTime(band)}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8', fontFamily: 'monospace' }}>{bandToTime(band + 1)}</span>
                  </div>
                </td>
                {DAYS.map(day => {
                  const slot = bandMap[band]?.[day]
                  const borderTop = isHour ? '1.5px solid #E2E8F0' : '1px dashed #F1F5F9'
                  if (!slot) return <td key={day} style={{ borderTop, borderLeft: '1px solid #F1F5F9', background: 'transparent' }} />
                  if (!slot.isFirst) return null
                  const { entry } = slot
                  const code = entry.subjectCode ?? entry.subject?.code ?? ''
                  const name = entry.subjectName ?? entry.subject?.name ?? code
                  const teacher = entry.teacherName ?? entry.teacher?.fullName ?? ''
                  const room = entry.roomName ?? entry.room?.name ?? entry.room?.roomNumber ?? ''
                  const isLab = entry.sessionType === 'LABORATORY'
                  const isOnline = slot.online || entry.isOnline || entry.online
                  const col = isOnline ? { bg: '#EFF6FF', accent: '#2563EB', text: '#1D4ED8' } : isLab ? { bg: '#FFFBEB', accent: '#D97706', text: '#92400E' } : getColor(code)
                  const heightPx = ROW_H * slot.span
                  return (
                    <td key={day} rowSpan={slot.span} style={{ borderTop, borderLeft: '1px solid #F1F5F9', background: col.bg, verticalAlign: 'top', padding: '8px 8px 6px 10px', position: 'relative' }}>
                      <div style={{ position: 'absolute', left: 0, top: 4, bottom: 4, width: 3, borderRadius: '0 3px 3px 0', background: col.accent }} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', marginBottom: 3 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: col.text, fontFamily: 'monospace', letterSpacing: '0.02em' }}>{code}</span>
                        {isLab && <Chip label="LAB" bg="#FEF3C7" color="#92400E" />}
                        {isOnline && <Chip label="Online" bg="#DBEAFE" color="#1D4ED8" />}
                      </div>
                      {heightPx >= 80 && name && name !== code && (
                        <div style={{ fontSize: 11, fontWeight: 500, color: col.text, opacity: 0.85, lineHeight: 1.3, marginBottom: 2, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{name}</div>
                      )}
                      {heightPx >= 80 && teacher && (
                        <div style={{ fontSize: 10, fontWeight: 500, color: col.text, opacity: 0.6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 1 }}>{teacher}</div>
                      )}
                      {heightPx >= 100 && (
                        <div style={{ fontSize: 10, fontWeight: 600, color: col.accent, opacity: 0.9, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{isOnline ? 'Online Class' : room}</div>
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
  )
}

export default function SchedulePrint() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const courseId = params.get("courseId")
  const semester = params.get("semester")
  const schoolYear = params.get("schoolYear")

  const [courses, setCourses] = useState([])
  const [activeCourseId, setActiveCourseId] = useState(courseId ? Number(courseId) : null)
  const [sections, setSections] = useState([])
  const [sectionId, setSectionId] = useState(null)
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [courseName, setCourseName] = useState("")

  useEffect(() => {
    api.get("/dean/my-courses").then(r => {
      const list = r.data?.data ?? []
      setCourses(list)
      if (!activeCourseId && list.length > 0) setActiveCourseId(list[0].id)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!activeCourseId || !semester || !schoolYear) return
    api.get("/sections", { params: { courseId: activeCourseId, semester, schoolYear } }).then(r => {
      const list = r.data?.data ?? []
      setSections(list)
      if (list.length > 0) { setSectionId(list[0].id); setCourseName(list[0].courseName ?? list[0].courseCode ?? "") }
    }).catch(() => setLoading(false))
  }, [activeCourseId, semester, schoolYear])

  useEffect(() => {
    if (!sectionId) return
    setLoading(true)
    api.get(`/schedules/section/${sectionId}`, { params: { semester, schoolYear } })
      .then(r => { setSchedules(r.data?.data ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [sectionId, semester, schoolYear])

  const currentSection = sections.find(s => s.id === sectionId)
  const totalSubjects = new Set(schedules.map(s => s.subjectId)).size
  const conflicts = schedules.filter(s => s.status === "CONFLICTED").length
  const labCount = [...new Set(schedules.filter(s => s.sessionType === "LABORATORY").map(s => s.subjectId))].length
  const semLabel = semester === "FIRST" ? "1st Semester" : semester === "SECOND" ? "2nd Semester" : semester ?? ""

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { font-family: 'Inter', sans-serif; box-sizing: border-box; }

        .sp-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 18px; gap: 12px; flex-wrap: wrap; }
        .sp-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
        .sp-filters { display: flex; gap: 12px; align-items: center; margin-bottom: 18px; flex-wrap: wrap; }
        .sp-stats { display: flex; gap: 8px; flex-wrap: wrap; }
        .sp-stat { background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 6px 12px; text-align: center; min-width: 72px; }
        .sp-filter-group { display: flex; align-items: center; gap: 8px; }
        .sp-btn { padding: 7px 14px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; white-space: nowrap; }

        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          @page { size: landscape; margin: 1cm; }
        }

        @media (max-width: 600px) {
          .sp-header { flex-direction: column; }
          .sp-actions { width: 100%; }
          .sp-actions .sp-btn { flex: 1; text-align: center; }
          .sp-filters { flex-direction: column; align-items: stretch; }
          .sp-filter-group { flex-direction: column; align-items: flex-start; gap: 4px; }
          .sp-filter-group select { width: 100%; }
          .sp-stats { display: grid; grid-template-columns: repeat(3,1fr); }
          .sp-stat { min-width: unset; }
        }
      `}</style>

      <div style={{ padding: 'clamp(1rem,4vw,1.5rem) clamp(1rem,4vw,2rem)', maxWidth: 1300, margin: '0 auto' }}>

        {/* Header */}
        <div className="sp-header">
          <div>
            <h1 style={{ fontSize: 'clamp(18px,4vw,22px)', fontWeight: 700, color: '#111827', margin: 0 }}>Class Timetable</h1>
            <p style={{ color: '#6B7280', fontSize: 13, margin: '4px 0 0', lineHeight: 1.5 }}>
              {courseName} · Year {currentSection?.yearLevel}-{currentSection?.sectionName} · {semLabel} · {schoolYear}
            </p>
          </div>
          <div className="no-print sp-actions">
            <button className="sp-btn" onClick={() => navigate(`/dean/schedule-view?courseId=${activeCourseId}&semester=${semester}&schoolYear=${schoolYear}`)}
              style={{ background: '#fff', color: '#374151', border: '1.5px solid #D1D5DB' }}>
              ← Back
            </button>
            <button className="sp-btn" onClick={() => window.print()} style={{ background: '#1B5E20', color: '#fff', border: 'none' }}>
              🖨 Print
            </button>
            <button className="sp-btn" onClick={() => {
              const el = document.getElementById('print-area');
              import('html2pdf.js').then(m => {
                const h = m.default || m;
                h().set({ margin: 0.4, filename: `Timetable-${courseName}-${currentSection?.yearLevel}-${currentSection?.sectionName}-${semLabel}-${schoolYear}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' } }).from(el).save();
              });
            }} style={{ background: '#1565C0', color: '#fff', border: 'none' }}>
              💾 PDF
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="no-print sp-filters">
          {courses.length > 0 && (
            <div className="sp-filter-group">
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', whiteSpace: 'nowrap' }}>COURSE</label>
              <select value={activeCourseId ?? ""} onChange={e => { setActiveCourseId(Number(e.target.value)); setSectionId(null); }}
                style={{ padding: '6px 10px', borderRadius: 7, border: '1.5px solid #D1D5DB', fontSize: 13 }}>
                {courses.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
              </select>
            </div>
          )}
          <div className="sp-filter-group">
            <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', whiteSpace: 'nowrap' }}>SECTION</label>
            <select value={sectionId ?? ""} onChange={e => setSectionId(Number(e.target.value))}
              style={{ padding: '6px 10px', borderRadius: 7, border: '1.5px solid #D1D5DB', fontSize: 13 }}>
              {sections.map(s => <option key={s.id} value={s.id}>Year {s.yearLevel}-{s.sectionName}</option>)}
            </select>
          </div>
          <div className="sp-stats">
            {[
              { label: 'Subjects', value: totalSubjects, color: '#1B5E20' },
              { label: 'Lab', value: labCount, color: '#E65100' },
              { label: 'Conflicts', value: conflicts, color: conflicts > 0 ? '#B91C1C' : '#6B7280' },
            ].map(({ label, value, color }) => (
              <div key={label} className="sp-stat">
                <div style={{ fontSize: 16, fontWeight: 700, color }}>{value}</div>
                <div style={{ fontSize: 10, color: '#9CA3AF' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div id="print-area">
          <PrintGrid schedules={schedules} loading={loading} />
          <div style={{ display: 'flex', gap: 14, marginTop: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            {[
              { label: 'Laboratory', bg: '#FFFBEB', accent: '#D97706' },
              { label: 'Lecture',    bg: '#E8F5E9', accent: '#2E7D32' },
              { label: 'Online',     bg: '#EFF6FF', accent: '#2563EB' },
            ].map(({ label, bg, accent }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 11, height: 11, borderRadius: 3, background: bg, border: `1.5px solid ${accent}`, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: '#6B7280' }}>{label}</span>
              </div>
            ))}
            {conflicts > 0 && (
              <div style={{ marginLeft: 'auto', fontSize: 11, color: '#B91C1C', fontWeight: 600 }}>
                ⚠ {conflicts} conflict{conflicts > 1 ? 's' : ''} detected
              </div>
            )}
          </div>
          <div style={{ marginTop: 18, fontSize: 10, color: '#9CA3AF', borderTop: '1px solid #F3F4F6', paddingTop: 8 }}>
            Generated by TimeCraft · {courseName} · Year {currentSection?.yearLevel}-{currentSection?.sectionName} · {semLabel} {schoolYear}
          </div>
        </div>
      </div>
    </>
  )
}