// Choose image button
const user_img = document.getElementById('choose-file');
const user_img_text = document.querySelector('.choose-file');
user_img.addEventListener('change', (event) => {
  const files = event.target.files;
  if (files.length > 0) {
    user_img_text.textContent = 'Изображение выбрано';
  } else {
    user_img_text.textContent = 'Выбрать изображение';
  }
});


// User delete button
const user_delete = document.querySelector('#delete');
const user_delete_block = document.querySelector('.user-delete-block');
const sure_delete = document.querySelector("#sure_delete")
user_delete.addEventListener('click', (event) => {
  event.preventDefault();
  if (user_delete_block.style.display == 'none') {
    user_delete.classList.add("active");
    user_delete_block.style.display = 'block'
  } else {
    user_delete.classList.remove("active");
    user_delete_block.style.display = 'none'
  }
});

// Deleting profile
sure_delete.addEventListener("click", (event) => {
  event.preventDefault();
  const form_data = new FormData();
  form_data.append("type", "delete")
  fetch(window.location.href, {
    method: "POST",
    body: form_data
  })
  window.location.replace(window.location.href.replace("/edit", ""));
})


// User edit buttons
const user_info = document.querySelector('.user-info');
const user_nickname = document.querySelector('.user-nickname');
const user_login = document.querySelector('.user-login');
const user_description = document.querySelector('.user-description');
if (window.innerWidth > 1000) {
  user_nickname.style.width = Math.min(window.innerWidth * 0.8, 1400) - 318 - 52 - 20 + 'px';
  user_login.style.width = Math.min(window.innerWidth * 0.8, 1400) - 318 - 52 - 20 + 'px';
  user_description.style.width = Math.min(window.innerWidth * 0.8, 1400) - 318 - 52 - 20 + 'px';
} else {
  user_nickname.style.width = Math.min(window.innerWidth * 0.8, 1400) - 52  + 'px';
  user_login.style.width = Math.min(window.innerWidth * 0.8, 1400) - 52 + 'px';
  user_description.style.width = Math.min(window.innerWidth * 0.8, 1400) - 52 + 'px';
}


const user_full_information = document.querySelector('.user-full-information');
let failed = document.querySelector(".failed");
// Submitting user edited info
user_info.addEventListener("submit", event => {
  event.preventDefault();
  const form_data = new FormData(user_info);
  form_data.append("type", "edit")
  fetch(window.location.href, {
    method: "POST",
    body: form_data
  }).then(res => res.json())
  .then(res => {
    if (res.status_code === 200) {
      window.location.replace(`${window.location.origin}/profile/${form_data.get("login")}`);
    } else {
      if (failed) {
        failed.textContent = res.message;
      } else {
        user_full_information.insertAdjacentHTML("afterbegin", `<div class="failed">${res.message}</div>`);
      }
      failed = document.querySelector(".failed");
    }
  })
})


// Resizing window
addEventListener("resize", (event) => {
  if (window.innerWidth > 1000) {
    user_nickname.style.width = user_info.offsetWidth - 318 - 52 - 20 + 'px';
    user_login.style.width = user_info.offsetWidth - 318 - 52 - 20 + 'px';
    user_description.style.width = user_info.offsetWidth - 318 - 52 - 20 + 'px';
  } else {
    user_nickname.style.width = user_info.offsetWidth - 52  + 'px';
    user_login.style.width = user_info.offsetWidth - 52 + 'px';
    user_description.style.width = user_info.offsetWidth - 52 + 'px';
  }
});
