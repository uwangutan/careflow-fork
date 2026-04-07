let currentCodeDisplay = document.getElementById('current-queue');
let button = document.querySelector('.next-button');
let formLogin = document.getElementById('login-card');
let category;
let code = 1;
let codeCurrent = (category + code);


formLogin.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = formLogin.email.value;
  const password = formLogin.password.value;

  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  await res.json();
  console.log(email, password);
});

button.addEventListener("click", () => {
  currentCodeDisplay.textContent = code;
  code++;
});









