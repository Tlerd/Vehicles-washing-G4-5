import type { Customer, CustomerTier, Vehicle } from '../../types';

interface FilterInput { customers:Customer[]; vehicles:Vehicle[]; search:string; tier:'ALL'|CustomerTier; sortBy:'createdAt'|'totalSpend'|'points'; }
export function getFilteredCustomers({customers,vehicles,search,tier,sortBy}:FilterInput):Customer[]{
  const term=search.trim().toLowerCase();
  return customers.filter(c=>tier==='ALL'||c.tier===tier).filter(c=>!term||c.name.toLowerCase().includes(term)||c.phone.includes(term)||vehicles.some(v=>v.customerId===c.id&&v.licensePlate.toLowerCase().includes(term))).sort((a,b)=>sortBy==='totalSpend'?b.totalSpend-a.totalSpend:sortBy==='points'?b.accumulatedPoints-a.accumulatedPoints:new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime());
}
export const isValidOptionalEmail=(email:string):boolean=>!email||/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
