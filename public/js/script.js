let currentCodeDisplay = document.getElementById('current-queue');
let buttonNext = document.querySelector('.next-button');
let buttonNoShow = document.querySelector('.no-show');
let codeUserDisplay = document.querySelector('.show-queue-code');
let category = {
  A: 0,
  B: 0,
  C: 0
};
let code = 1;

let codeCurrent;

let categoryParent = document.querySelector('.category-identifier');

if (categoryParent) {

  let categoryIdentifier = categoryParent.querySelectorAll("button");

  categoryIdentifier.forEach((elem) => {
    elem.addEventListener("click", async (e) => {


      let categCheck = (e.target).id[0];


      console.log(categCheck, category[categCheck]);
      category[categCheck]++;
      const res = await fetch('/api/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: categCheck, queueNumber: category[categCheck] })
      });
      const data = await res.json();
      if (data.success) {
        window.location.href = '';
      }
      else {
        alert(data.error);
      }

      // console.log(codeCurrent);
      // console.log(queue);
      return;
    })
  });
}

if (buttonNext && buttonNext) {
  buttonNoShow.addEventListener("click", () => {
    currentCodeDisplay.textContent = queue[queue.length - 1];
  });

  buttonNext.addEventListener("click", () => {
    currentCodeDisplay.textContent = queue[queue.length - 1];
    console.log(queue);
  });
}

