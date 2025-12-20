// Selecting authorization or registration
const authorization_select = document.querySelector(".authorization-select");
const registration_select = document.querySelector(".registration-select");
const authorization = document.querySelector(".authorization");
const registration = document.querySelector(".registration");
let failed = document.querySelector(".failed");
const select_block = document.querySelector(".select-block");

authorization_select.addEventListener("click", (event) => {
  authorization_select.className = "authorization-select active";
  registration_select.className = "registration-select";
  authorization.style.display = "flex";
  registration.style.display = "none";
  if (failed) {
    failed.style.display = "none";
  }
});
registration_select.addEventListener("click", (event) => {
  authorization_select.className = "authorization-select";
  registration_select.className = "registration-select active";
  authorization.style.display = "none";
  registration.style.display = "flex";
  if (failed) {
    failed.style.display = "none";
  }
});


// Generating password
const password_registration = document.querySelector("#password-registration");
const password_generator_btn = document.querySelector(".password-generation-button");
password_generator_btn.addEventListener("click", (event) => {
  const form_data = new FormData();
  form_data.append("type", "generate-password");
  const data = Object.fromEntries(form_data);
  fetch(window.location.href, {method: "POST",
    headers: {
      "Content-type": "application/json"
    },
    body: JSON.stringify(data)})
  .then((res) => res.json())
  .then((res) => {
    password_registration.value = res.password;
  });
});


// Submitting authorization form
authorization.addEventListener('submit', event => {
  event.preventDefault();
  const form_data = new FormData();
  form_data.append("type", "authorization");
  form_data.append("login", document.querySelector("#login-authorization").value);
  form_data.append("password", document.querySelector("#password-authorization").value);
  if (!form_data.get("login") || !form_data.get("password")) {
    if (failed) {
      failed.textContent = "Неверный логин или пароль";
    } else {
      select_block.insertAdjacentHTML("afterend", `<div class="failed">Неверный логин или пароль</div>`);
    }
    failed = document.querySelector(".failed");
    } else {
      const data = Object.fromEntries(form_data);
    fetch(window.location.href, {
      method: "POST",
      headers: {
        "Content-type": "application/json"
      },
      body: JSON.stringify(data)
    }).then(res => res.json())
    .then(res => {
      if (res.status_code != 200) {
        if (failed) {
          failed.textContent = "Неверный логин или пароль";
        } else {
          select_block.insertAdjacentHTML("afterend", `<div class="failed">Неверный логин или пароль</div>`);
        }
        failed = document.querySelector(".failed");
      } else {
        window.location.replace(`${window.location.origin.replace(/\/?$/, '')}/profile/${form_data.get("login")}`);
      }
    }).catch(() => {
      if (failed) {
          failed.textContent = "Произошла непредвиденная ошибка";
        } else {
          select_block.insertAdjacentHTML("afterend", `<div class="failed">Произошла непредвиденная ошибка</div>`);
        }
        failed = document.querySelector(".failed");
    })
  }
});


// Submitting registration form
registration.addEventListener('submit', event => {
  event.preventDefault();
  const form_data = new FormData();
  form_data.append("type", "registration");
  form_data.append("login", document.querySelector("#login-registration").value);
  form_data.append("email", document.querySelector("#email-registration").value);
  form_data.append("nickname", document.querySelector("#nickname-registration").value);
  form_data.append("password", document.querySelector("#password-registration").value);
  form_data.append("repeat_password", document.querySelector("#repeat-password-registration").value);
  if (!form_data.get("login") || !form_data.get("email") || !form_data.get("nickname") || !form_data.get("password") || !form_data.get("repeat_password")) {
    if (failed) {
      failed.textContent = "Все поля должны быть заполнены";
    } else {
      select_block.insertAdjacentHTML("afterend", `<div class="failed">Все поля должны быть заполнены</div>`);
    }
    failed = document.querySelector(".failed");
  } else if (form_data.get("password") != form_data.get("repeat_password")) {
    if (failed) {
      failed.textContent = "Пароли должны совпадать";
    } else {
      select_block.insertAdjacentHTML("afterend", `<div class="failed">Пароли должны совпадать</div>`);
    }
    failed = document.querySelector(".failed");
  } else {
    const data = Object.fromEntries(form_data);
    fetch(window.location.href, {
      method: "POST",
      headers: {
        "Content-type": "application/json"
      },
      body: JSON.stringify(data)
    }).then(res => res.json())
    .then(res => {
      if (failed) {
        failed.textContent = res.message;
      } else {
        select_block.insertAdjacentHTML("afterend", `<div class="failed">${res.message}</div>`);
      }
      failed = document.querySelector(".failed");
    }).catch(() => {
      if (failed) {
        failed.textContent = "Произошла непредвиденная ошибка";
      } else {
        select_block.insertAdjacentHTML("afterend", `<div class="failed">Произошла непредвиденная ошибка</div>`);
      }
      failed = document.querySelector(".failed");
    })
  }
});
