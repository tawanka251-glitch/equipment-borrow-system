document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (res.ok) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    alert('เข้าสู่ระบบสำเร็จ');
    if (data.user.role === 'admin') {
      window.location.href = '/dashboard.html';
    } else {
      window.location.href = '/equipment.html';
    }
  } else {
    const message = data.error || 'เข้าสู่ระบบไม่สำเร็จ';
    const detail = data.detail ? ' (' + data.detail + ')' : '';
    alert(message + detail);
  }
});
