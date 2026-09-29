export function validCalendarDate(s){if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s)||Number(s.slice(0,4))<1000)return false;const d=new Date(s+'T12:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===s}
export function calendarMonth(date){const [year,month]=date.split('-').map(Number),first=new Date(Date.UTC(year,month-1,1)),days=new Date(Date.UTC(year,month,0)).getUTCDate();return {year,month,offset:(first.getUTCDay()+6)%7,days}}
export function calendarEntries(notes,date,actor,paired){return notes.filter(n=>['calendar','anniversary'].includes(n.kind)&&(n.actor===actor||paired&&n.shared)&&(n.date===date||n.kind==='anniversary'&&n.repeat&&n.date<=date&&n.date.slice(5)===date.slice(5))).sort((a,b)=>a.created-b.created)}

// Letters are derived from saved notes, so offline midnight needs no running browser.
export function calendarLetters(notes,date,actor,paired){return calendarEntries(notes,date,actor,paired).map(n=>({id:n.id+':'+date,title:n.title,body:n.body,anniversary:n.kind==='anniversary',actor:n.actor}))}
