import type { Booking, PointsTransaction } from '../../types';
export function getRevenueSummary({bookings,period,anchorDate,branch}:{bookings:Booking[];period:'day'|'month'|'year';anchorDate:string;branch:'ALL'|string}){
 const key=period==='day'?anchorDate:period==='month'?anchorDate.slice(0,7):anchorDate.slice(0,4); const rows=bookings.filter(b=>b.status==='COMPLETED'&&(branch==='ALL'||b.branchId===branch)&&(period==='day'?b.date===key:b.date.startsWith(key))); const revenue=rows.reduce((n,b)=>n+b.totalPrice,0);return {revenue,completedWashes:rows.length,averageTicket:rows.length?Math.floor(revenue/rows.length):0};
}
export function getPointAuditRows(rows:PointsTransaction[],type:'ALL'|PointsTransaction['type']){return rows.filter(r=>type==='ALL'||r.type===type).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));}
