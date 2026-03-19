export function getUserId() {
  let id = null;
  try { id = localStorage.getItem('macau_tea_user_id'); } catch {}
  if (!id) {
    id = 'user_' + Math.random().toString(36).substring(2, 15);
    try { localStorage.setItem('macau_tea_user_id', id); } catch {}
  }
  return id;
}