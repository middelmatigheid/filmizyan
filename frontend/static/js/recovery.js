// Generating password
const password = document.querySelector("#password");
const password_generator_btn = document.querySelector(".password-generation-button");
if (password_generator_btn) {
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
      password.value = res.password;
    });
  });
}

const form_title = document.querySelector(".title");
let failed = document.querySelector(".failed");
const form_login = document.querySelector(".form.login");
const form_password = document.querySelector(".form.password");
if (form_login) {
  // Submitting login form
  form_login.addEventListener("submit", event => {
    event.preventDefault();
    const form_data = new FormData(form_login);
    form_data.append("type", "login");
    if (!form_data.get("login")) {
      if (failed) {
        failed.textContent = "Заполните все поля";
      } else {
        form_title.insertAdjacentHTML("afterend", `<div class="failed">Заполните все поля</div>`);
      }
      failed = document.querySelector(".failed");
    } else {
      const data = Object.fromEntries(form_data);
      fetch(`${window.location.origin.replace(/\/?$/, '')}/recovery`, {
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
          form_title.insertAdjacentHTML("afterend", `<div class="failed">${res.message}</div>`);
        }
        failed = document.querySelector(".failed");
      }).catch(() => {
        window.location.replace(`${window.location.origin.replace(/\/?$/, '')}/login`);
      })
    }
  });
} else {
  // Submitting password form
  form_password.addEventListener("submit", event => {
    event.preventDefault();
    const form_data = new FormData(form_password);
    form_data.append("type", "password");
    if (!form_data.get("password") || !form_data.get("repeat-password")) {
      if (failed) {
        failed.textContent = "Заполните все поля";
      } else {
        form_title.insertAdjacentHTML("afterend", `<div class="failed">Заполните все поля</div>`);
      }
      failed = document.querySelector(".failed");
    } else if (form_data.get("password") != form_data.get("repeat-password")) {
      if (failed) {
        failed.textContent = "Пароли должны совпадать";
      } else {
        form_title.insertAdjacentHTML("afterend", `<div class="failed">Пароли должны совпадать</div>`);
      }
      failed = document.querySelector(".failed");
    } else {
      const data = Object.fromEntries(form_data);
      fetch(`${window.location.origin.replace(/\/?$/, '')}/recovery`, {
        method: "POST",
        headers: {
          "Content-type": "application/json"
        },
        body: JSON.stringify(data)
      }).then(res => res.json())
      .then(res => {
        if (res.status_code != 200) {
          if (failed) {
            failed.textContent = res.message;
          } else {
            form_title.insertAdjacentHTML("afterend", `<div class="failed">${res.message}</div>`);
          }
          failed = document.querySelector(".failed");
        } else {
          window.location.replace(`${window.location.origin.replace(/\/?$/, '')}/login`);
        }
      }).catch(() => {
        window.location.replace(`${window.location.origin.replace(/\/?$/, '')}/login`);
      })
    }
  });
}
