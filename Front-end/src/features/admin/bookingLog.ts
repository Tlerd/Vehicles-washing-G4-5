import type { Booking, BookingStatus } from '../../types';
interface PageInput { bookings:Booking[]; date:string; status:'ALL'|BookingStatus; sortBy:'time'|'createdAt'; page:number; size:number; }
export function getBookingPage({bookings,date,status,sortBy,page,size}:PageInput){
 const filtered=bookings.filter(b=>b.date===date&&(status==='ALL'||b.status===status)).sort((a,b)=>sortBy==='time'?a.time.localeCompare(b.time):b.createdAt.localeCompare(a.createdAt));
 const start=page*size; return {content:filtered.slice(start,start+size),last:start+size>=filtered.length,totalElements:filtered.length};
}
export function shouldLoadNextPage({scrollHeight,scrollTop,clientHeight,threshold}:{scrollHeight:number;scrollTop:number;clientHeight:number;threshold:number}){return scrollHeight-scrollTop-clientHeight<=threshold;}
