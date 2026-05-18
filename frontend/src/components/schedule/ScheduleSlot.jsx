const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@500;600&display=swap');

  .tc-slot {
    transition: filter 0.15s, transform 0.12s, box-shadow 0.15s;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }
  .tc-slot:hover {
    filter: brightness(1.06);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }
  .tc-slot:active {
    transform: scale(0.98);
    filter: brightness(0.97);
  }

  /* On small touch screens, disable hover lift to avoid sticky hover */
  @media (hover: none) {
    .tc-slot:hover {
      filter: none;
      transform: none;
      box-shadow: none;
    }
    .tc-slot:active {
      filter: brightness(0.95);
      transform: scale(0.97);
    }
  }

  /* Responsive badge font size adjustments */
  @media (max-width: 480px) {
    .tc-slot-badge { font-size: 7px !important; padding: 1px 3px !important; }
    .tc-slot-code  { font-size: 9px !important; }
    .tc-slot-name  { font-size: 9px !important; }
    .tc-slot-meta  { font-size: 8px !important; }
  }
`;

export default function ScheduleSlot({ schedule, onClick, compact = false }) {
  const {
    subjectCode, subjectName, teacherName, roomName,
    sessionType, subjectType, status, campusCode
  } = schedule;

  const slotDur = schedule._spanBands ? schedule._spanBands * 30 : null;

  const isOnline   = schedule.online ?? schedule.isOnline ?? false;
  const isLab      = sessionType === 'LABORATORY';
  const isConflict = status === 'CONFLICTED';
  const isDraft    = status === 'DRAFT';
  const isMajor    = subjectType === 'MAJOR';

  const accent = isConflict ? '#E24B4A'
    : isLab    ? '#185FA5'
    : isMajor  ? '#BA7517'
    :             '#1A6A2A';

  const bg = isConflict ? 'rgba(226,75,74,0.08)'
    : isLab    ? 'rgba(24,95,165,0.08)'
    : isMajor  ? 'rgba(186,117,23,0.08)'
    :             'rgba(26,106,42,0.07)';

  const sharedStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    width: '100%',
    height: '100%',
    minHeight: 0,
    border: 'none',
    borderRadius: compact ? '5px' : '7px',
    borderLeft: `3px solid ${accent}`,
    background: bg,
    opacity: isDraft ? 0.85 : 1,
    cursor: 'pointer',
    textAlign: 'left',
    overflow: 'hidden',
    fontFamily: "'DM Sans', sans-serif",
    boxSizing: 'border-box',
    WebkitTapHighlightColor: 'transparent',
  };

  // ── Compact card ──
  if (compact) {
    return (
      <>
        <style>{CSS}</style>
        <button
          className="tc-slot"
          onClick={onClick}
          title={`${subjectName} — ${teacherName} — ${roomName}`}
          style={{ ...sharedStyle, gap: '2px', padding: '4px 7px' }}
        >
          {/* Row 1: code + name + badges */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            width: '100%', overflow: 'hidden',
          }}>
            <span className="tc-slot-code" style={{
              fontSize: '10px', fontWeight: '700', color: accent,
              letterSpacing: '0.3px', textTransform: 'uppercase',
              lineHeight: 1, whiteSpace: 'nowrap', flexShrink: 0,
            }}>
              {subjectCode}
            </span>
            <span className="tc-slot-name" style={{
              fontSize: '10px', fontWeight: '500', color: '#112A17',
              lineHeight: 1, overflow: 'hidden', whiteSpace: 'nowrap',
              textOverflow: 'ellipsis', flexGrow: 1,
            }}>
              {subjectName}
            </span>
            <div style={{ display: 'flex', gap: '3px', flexShrink: 0 }}>
              {slotDur && (
                <span className="tc-slot-badge" style={{
                  fontSize: '8px', fontWeight: '600', padding: '1px 4px',
                  borderRadius: '3px',
                  background: slotDur <= 60 ? '#FEF3C7' : '#E8F5E9',
                  color: slotDur <= 60 ? '#92400E' : '#2D6A4F',
                  whiteSpace: 'nowrap',
                }}>
                  {slotDur}m
                </span>
              )}
              {isLab && (
                <span className="tc-slot-badge" style={{
                  fontSize: '8px', fontWeight: '600', padding: '1px 4px',
                  borderRadius: '3px', background: 'rgba(24,95,165,0.12)', color: '#185FA5',
                  whiteSpace: 'nowrap',
                }}>LAB</span>
              )}
              {isOnline && (
                <span className="tc-slot-badge" style={{
                  fontSize: '8px', fontWeight: '600', padding: '1px 4px',
                  borderRadius: '3px', background: 'rgba(99,60,180,0.12)', color: '#6330B4',
                  whiteSpace: 'nowrap',
                }}>ONLINE</span>
              )}
              {isConflict && (
                <span className="tc-slot-badge" style={{
                  fontSize: '8px', fontWeight: '600', padding: '1px 4px',
                  borderRadius: '3px', background: 'rgba(226,75,74,0.15)', color: '#E24B4A',
                  whiteSpace: 'nowrap',
                }}>⚠</span>
              )}
            </div>
          </div>

          {/* Row 2: teacher */}
          {teacherName && (
            <span className="tc-slot-meta" style={{
              fontSize: '9px', color: '#7AAE7A', lineHeight: 1,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              width: '100%',
            }}>
              · {teacherName}
            </span>
          )}

          {/* Row 3: room/online */}
          {isOnline ? (
            <span className="tc-slot-meta" style={{ fontSize: '9px', color: '#6330B4', lineHeight: 1, whiteSpace: 'nowrap' }}>
              ◫ Online Class
            </span>
          ) : roomName ? (
            <span className="tc-slot-meta" style={{
              fontSize: '9px', color: '#7AAE7A', lineHeight: 1,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              width: '100%',
            }}>
              ◫ {roomName}{campusCode ? ` ${campusCode}` : ''}
            </span>
          ) : null}
        </button>
      </>
    );
  }

  // ── Full card ──
  return (
    <>
      <style>{CSS}</style>
      <button
        className="tc-slot"
        onClick={onClick}
        title={`${subjectName} — ${teacherName} — ${roomName}`}
        style={{ ...sharedStyle, gap: '3px', padding: '7px 9px' }}
      >
        <span className="tc-slot-code" style={{
          fontSize: '10.5px', fontWeight: '700', color: accent,
          letterSpacing: '0.3px', textTransform: 'uppercase', lineHeight: 1,
        }}>
          {subjectCode}
        </span>
        <span className="tc-slot-name" style={{
          fontSize: '11px', fontWeight: '500', color: '#112A17', lineHeight: 1.3,
          overflow: 'hidden', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>
          {subjectName}
        </span>
        {teacherName && (
          <span className="tc-slot-meta" style={{
            fontSize: '10px', color: '#7AAE7A',
            display: 'flex', alignItems: 'center', gap: '4px',
            overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
            width: '100%',
          }}>
            <span style={{ color: '#AAC8AA', flexShrink: 0 }}>·</span>
            {teacherName}
          </span>
        )}
        {isOnline ? (
          <span className="tc-slot-meta" style={{ fontSize: '10px', color: '#6330B4', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: '#AAC8AA' }}>◫</span>Online Class
          </span>
        ) : roomName ? (
          <span className="tc-slot-meta" style={{
            fontSize: '10px', color: '#7AAE7A',
            display: 'flex', alignItems: 'center', gap: '4px',
            overflow: 'hidden', whiteSpace: 'nowrap', width: '100%',
          }}>
            <span style={{ color: '#AAC8AA', flexShrink: 0 }}>◫</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {roomName}
              {campusCode && (
                <span style={{
                  fontWeight: '700', fontSize: '9px', color: '#AAC8AA',
                  textTransform: 'uppercase', marginLeft: '2px',
                }}>
                  {campusCode}
                </span>
              )}
            </span>
          </span>
        ) : null}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginTop: '2px' }}>
          {isConflict && (
            <span className="tc-slot-badge" style={{
              fontSize: '9px', fontWeight: '600', padding: '1px 5px', borderRadius: '4px',
              background: 'rgba(226,75,74,0.15)', color: '#E24B4A',
              textTransform: 'uppercase', letterSpacing: '0.3px', whiteSpace: 'nowrap',
            }}>⚠ conflict</span>
          )}
          {isDraft && (
            <span className="tc-slot-badge" style={{
              fontSize: '9px', fontWeight: '600', padding: '1px 5px', borderRadius: '4px',
              background: 'rgba(136,135,128,0.1)', color: '#888780',
              textTransform: 'uppercase', letterSpacing: '0.3px', whiteSpace: 'nowrap',
            }}>draft</span>
          )}
          {slotDur && (
            <span className="tc-slot-badge" style={{
              fontSize: '9px', fontWeight: '600', padding: '1px 5px', borderRadius: '4px',
              background: slotDur <= 60 ? '#FEF3C7' : '#E8F5E9',
              color: slotDur <= 60 ? '#92400E' : '#2D6A4F', whiteSpace: 'nowrap',
            }}>{slotDur} min</span>
          )}
          {isLab && (
            <span className="tc-slot-badge" style={{
              fontSize: '9px', fontWeight: '600', padding: '1px 5px', borderRadius: '4px',
              background: 'rgba(24,95,165,0.12)', color: '#185FA5',
              textTransform: 'uppercase', letterSpacing: '0.3px', whiteSpace: 'nowrap',
            }}>lab</span>
          )}
          {isOnline && (
            <span className="tc-slot-badge" style={{
              fontSize: '9px', fontWeight: '600', padding: '1px 5px', borderRadius: '4px',
              background: 'rgba(99,60,180,0.12)', color: '#6330B4',
              textTransform: 'uppercase', letterSpacing: '0.3px', whiteSpace: 'nowrap',
            }}>🌐 online</span>
          )}
        </div>
      </button>
    </>
  );
}