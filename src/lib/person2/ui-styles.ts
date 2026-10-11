export const btnPrimary = 'h-[38px] px-4 bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white font-medium text-xs rounded-[7px] transition-colors';
export const btnPrimaryCompact = 'px-2.5 py-1 bg-blue-700 hover:bg-blue-800 text-white font-medium text-[11px] rounded transition-colors';
export const btnSecondary = 'h-[38px] px-4 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-medium text-xs rounded-[7px] transition-colors';
export const btnSecondaryCompact = 'px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-medium text-[11px] rounded transition-colors';
export const btnEdit = 'px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-medium text-[11px] rounded transition-colors';
export const btnDelete = 'px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-medium text-[11px] rounded transition-colors';
export const btnDestructivePrimary = 'h-[38px] px-4 bg-rose-700 hover:bg-rose-800 text-white font-medium text-xs rounded-[7px] transition-colors';

export function getOrderStatusBadgeClass(status: string): string {
  return ({ Completed: 'bg-emerald-100 text-emerald-800 border-emerald-300', 'In Production': 'bg-blue-100 text-blue-800 border-blue-300', 'Quality Check': 'bg-indigo-100 text-indigo-800 border-indigo-300', 'Rework Required': 'bg-amber-100 text-amber-800 border-amber-300', Rejected: 'bg-rose-100 text-rose-800 border-rose-300', Cancelled: 'bg-slate-200 text-slate-700 border-slate-300', Pending: 'bg-slate-100 text-slate-700 border-slate-300' }[status] ?? 'bg-slate-100 text-slate-700 border-slate-300');
}
export function getQualityResultBadgeClass(result: string): string {
  return ({ Passed: 'bg-emerald-100 text-emerald-800 border-emerald-300', Failed: 'bg-rose-100 text-rose-800 border-rose-300', 'Rework Required': 'bg-amber-100 text-amber-800 border-amber-300' }[result] ?? 'bg-slate-100 text-slate-700 border-slate-300');
}
