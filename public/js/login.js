let formLogin = document.getElementById('login-card');

formLogin.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = formLogin.email.value;
  const password = formLogin.password.value;


  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();
  if (data.success) {
    console.log(email, password);
    window.location.href = 'index.html';
  }
  else {
    alert(data.error);
  }
});
