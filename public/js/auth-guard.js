/**
 * auth-guard.js
 * Shared client-side auth guard. Import this in every protected page.
 * 
 * Usage:
 *   requireAuth()       — redirect to login if not logged in (any role)
 *   requireAdmin()      — redirect to login if not admin; redirect user to their page
 *   requireUser()       — redirect to login if not logged in; redirect admin away
 *   getUser()           — returns { id, name, role } or null
 *   getToken()          — returns token string or null
 *   getAuthHeader()     — returns { Authorization: 'Bearer ...' }
 *   logout()            — clears storage and redirects to login
 */

function getUser() {
  return JSON.parse(localStorage.getItem('user') || 'null');
}

function getToken() {
  return localStorage.getItem('token');
}

function getAuthHeader() {
  return { 'Authorization': 'Bearer ' + getToken() };
}

function logout() {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  window.location.href = '/login.html';
}

/** Require any logged-in user. If not, go to login */
function requireAuth() {
  const user = getUser();
  const token = getToken();
  if (!user || !token) {
    alert('กรุณาเข้าสู่ระบบก่อนใช้งาน');
    window.location.href = '/login.html';
    return null;
  }
  return user;
}

/** Require admin role. Users get redirected to their own page. */
function requireAdmin() {
  const user = getUser();
  const token = getToken();
  if (!user || !token) {
    alert('กรุณาเข้าสู่ระบบก่อนใช้งาน');
    window.location.href = '/login.html';
    return null;
  }
  if (user.role !== 'admin') {
    alert('⛔ คุณไม่มีสิทธิ์เข้าถึงหน้านี้ (เฉพาะผู้ดูแลระบบ)');
    window.location.href = '/equipment.html';
    return null;
  }
  return user;
}

/** Require normal user. Admins get redirected to dashboard. */
function requireUser() {
  const user = getUser();
  const token = getToken();
  if (!user || !token) {
    alert('กรุณาเข้าสู่ระบบก่อนใช้งาน');
    window.location.href = '/login.html';
    return null;
  }
  if (user.role === 'admin') {
    window.location.href = '/dashboard.html';
    return null;
  }
  return user;
}
