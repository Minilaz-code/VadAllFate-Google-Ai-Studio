/** Presentation only. Server commitments/receipts remain authoritative. */
export function commitmentStatus(item:any):string {
 if(!item.job)return 'NOT ACTIVATED';
 if(item.job.kind==='ROUTINE_DEPART'&&item.job.status==='COMPLETED')return item.arrival?.status||'PENDING';
 return item.job.status;
}
