import { useEffect, useMemo, useState } from 'react';
import { Booking } from '../../types';
import { platformService } from '../../services/platform.service';

const card: React.CSSProperties={background:'#fff',border:'1px solid #e2e8f0',borderRadius:12,padding:16,marginBottom:12};
export function WashingPortal(){
  const[items,setItems]=useState<Booking[]>([]);
  const[date,setDate]=useState(new Date().toISOString().slice(0,10));
  const[query,setQuery]=useState('');
  const[loading,setLoading]=useState(false);
  const load=async()=>{setLoading(true);try{setItems(await platformService.queue(date))}finally{setLoading(false)}};
  useEffect(()=>{void load()},[date]);
  const filtered=useMemo(()=>{const q=query.trim().toLowerCase();return q?items.filter(b=>[b.bookingRef,b.customerName,b.customerPhone,b.licensePlate].some(v=>v?.toLowerCase().includes(q))):items},[items,query]);
  const move=async(id:string,status:Booking['status'])=>{await platformService.status(id,status);await load()};
  return <section>
    <h2>Washing Counter</h2>
    <div style={{display:'flex',gap:12,margin:'16px 0 20px',flexWrap:'wrap'}}>
      <label>Booking date<br/><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label>
      <label>Search booking / phone / plate<br/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="AWP..., 090..., 51A..." style={{minWidth:270}}/></label>
      <button onClick={()=>void load()} style={{alignSelf:'end'}}>Refresh</button>
    </div>
    {loading&&<p>Loading bookings...</p>}
    {!loading&&filtered.length===0&&<p>No bookings found for this date.</p>}
    {filtered.map(b=><div style={card} key={b.id}>
      <div style={{display:'flex',justifyContent:'space-between',gap:16,flexWrap:'wrap'}}>
        <div><b>{b.bookingRef}</b><br/><strong>{b.customerName}</strong> — <a href={`tel:${b.customerPhone}`}>{b.customerPhone}</a></div>
        <div><b>{b.status}</b> — {b.totalPrice.toLocaleString('vi-VN')} VND</div>
      </div>
      <div style={{marginTop:10}}>🚗 {b.vehicleBrand} — <b>{b.licensePlate}</b> — {b.carSize.toUpperCase()}</div>
      <div style={{marginTop:6}}>🧼 {b.services.join(', ')||'No service information'}</div>
      <div style={{marginTop:6}}>🕒 {b.time?.slice(0,5)} – {b.endTime?.slice(0,5)} ({b.durationMinutes} min)</div>
      <div style={{marginTop:12}}>
        {b.status==='PENDING'&&<><button onClick={()=>move(b.id,'CONFIRMED')}>Confirm</button> <button onClick={()=>move(b.id,'CANCELLED')}>Cancel</button></>}
        {b.status==='CONFIRMED'&&<button onClick={()=>move(b.id,'CHECKED_IN')}>Check-in</button>}
        {b.status==='CHECKED_IN'&&<button onClick={()=>move(b.id,'COMPLETED')}>Complete wash & credit points</button>}
        {b.status==='COMPLETED'&&<span>Completed — call customer for vehicle pickup.</span>}
      </div>
    </div>)}
  </section>
}
export function AdminPortal(){const [tab,setTab]=useState('customers');const [data,setData]=useState<unknown>(null);const load=async()=>setData(tab==='customers'?await platformService.customers():tab==='bookings'?await platformService.adminBookings():tab==='revenue'?await platformService.revenue():tab==='audit'?await platformService.audit():await platformService.campaigns());useEffect(()=>{load()},[tab]);const create=async()=>{await platformService.createCampaign({name:'Weekend Double Points',goal:'reward loyal customers on weekends',multiplier:2,targetTier:'ALL',startDate:new Date().toISOString().slice(0,10),endDate:'2026-12-31'});load()};return <section><h2>FR-010–FR-013 Admin Portal</h2><nav style={{display:'flex',gap:8,marginBottom:16}}>{['customers','bookings','revenue','audit','campaigns'].map(x=><button key={x} onClick={()=>setTab(x)}>{x}</button>)}</nav>{tab==='campaigns'&&<button onClick={create}>Generate & publish campaign</button>}<pre style={{...card,whiteSpace:'pre-wrap',maxHeight:600,overflow:'auto'}}>{JSON.stringify(data,null,2)}</pre></section>}
