// Watch later
const watch_later_inner = document.querySelector('.watch-later-inner');
const watch_later_overflow = document.querySelector('.watch-later-overflow');
const watch_later_slider = document.querySelector('.watch-later-slider');
const watch_later = document.querySelectorAll('.watch-later');
const watch_later_imgs = document.querySelectorAll('.watch-later-img');
const watch_later_button_prev = document.querySelector('.watch-later-button-prev img');
const watch_later_button_next = document.querySelector('.watch-later-button-next img');
let watch_later_num = 4;
if (watch_later.length != 0) {
  // Number of films to show
  watch_later_num = watch_later.length - 4
  if (window.innerWidth <= 750 || watch_later.length - 4 < 0) {
    watch_later_num = 1;
  } else if (window.innerWidth <= 1000 && watch_later.length - 4 > 2) {
    watch_later_num = 2;
  } else if (window.innerWidth <= 1300 && watch_later.length - 4 > 3) {
    watch_later_num = 3;
  } else if (watch_later.length - 4 > 4){
    watch_later_num = 4;
  }
  // Buttons aren't needed
  if (watch_later.length - 4 <= watch_later_num) {
    watch_later_button_prev.style.display = 'none';
    watch_later_button_next.style.display = 'none';
  }
  // Resizing watch ;ater
  let watch_later_width = Math.min(Math.floor(((Math.min(window.innerWidth * 0.8, 1400) - 40 - 80) - 20 * (watch_later_num - 1)) / watch_later_num), 300);
  for (let i = 0; i < watch_later_imgs.length; i++) {
    watch_later_imgs[i].style.minWidth = watch_later_width - 32 + 'px';
    watch_later_imgs[i].style.maxWidth = watch_later_width - 32 + 'px';
    watch_later_imgs[i].style.height = (watch_later_width - 32) * 3 / 2 + 'px';
  }
  watch_later_overflow.style.width = watch_later_width * watch_later_num + (watch_later_num - 1) * 20 + 'px';

  // Watch later slider
  watch_later_slider.style.transition = 'none';
  watch_later_slider.style.transform = 'translate(' + (watch_later_width + 20) * (-1 * 2) + 'px, 0)';
  setTimeout((event) => {
    watch_later_slider.style.transition = 'all 0.25s ease-in-out';
  }, 250);

  // Prev button
  watch_later_button_prev.addEventListener('click', (event) => {
    watch_later_slider.style.transform = 'translate(' + (Number(watch_later_slider.style.transform.split('px')[0].split('translate(')[1]) + watch_later_width + 20) + 'px, 0)';
    // User has reached the start
    if (Number(watch_later_slider.style.transform.split('px')[0].split('translate(')[1]) == 0) {
      watch_later_button_prev.style.pointerEvents = 'none';
      watch_later_button_next.style.pointerEvents = 'none';
      setTimeout((event) => {
        watch_later_slider.style.transition = 'none';
        watch_later_slider.style.transform = 'translate(' + (watch_later_width + 20) * (-1 * (watch_later.length - 4)) + 'px, 0)';
        setTimeout((event) => {
          watch_later_slider.style.transition = 'all 0.25s ease-in-out';
          watch_later_button_prev.style.pointerEvents = 'auto';
          watch_later_button_next.style.pointerEvents = 'auto';
        }, 50);
      }, 300);
    };
  });
  // Next button
  watch_later_button_next.addEventListener('click', (event) => {
    watch_later_slider.style.transform = 'translate(' + (Number(watch_later_slider.style.transform.split('px')[0].split('translate(')[1]) - watch_later_width - 20) + 'px, 0)';
    // User has reached the end
    if (Number(watch_later_slider.style.transform.split('px')[0].split('translate(')[1]) == (watch_later_width + 20) * (-1 * (watch_later_imgs.length - 3))) {
      watch_later_button_prev.style.pointerEvents = 'none';
      watch_later_button_next.style.pointerEvents = 'none';
      setTimeout((event) => {
        watch_later_slider.style.transition = 'none';
        watch_later_slider.style.transform = 'translate(' + -1 * (watch_later_width + 20) + 'px, 0)';
        setTimeout((event) => {
          watch_later_slider.style.transition = 'all 0.25s ease-in-out';
          watch_later_button_prev.style.pointerEvents = 'auto';
          watch_later_button_next.style.pointerEvents = 'auto';
        }, 50);
      }, 300);
    };
  });
}


// Films without reviews
const without_review_inner = document.querySelector('.without-review-inner');
const without_review_overflow = document.querySelector('.without-review-overflow');
const without_review_slider = document.querySelector('.without-review-slider');
const without_review = document.querySelectorAll('.without-review');
const without_review_imgs = document.querySelectorAll('.without-review-img');
const without_review_button_prev = document.querySelector('.without-review-button-prev img');
const without_review_button_next = document.querySelector('.without-review-button-next img');
let without_review_num = 4;
if (without_review.length != 0) {
  // Number of films to show
  without_review_num = without_review.length - 4
  if (window.innerWidth <= 750 || without_review.length - 4 < 0) {
    without_review_num = 1;
  } else if (window.innerWidth <= 1000 && without_review.length - 4 > 2) {
    without_review_num = 2;
  } else if (window.innerWidth <= 1300 && without_review.length - 4 > 3) {
    without_review_num = 3;
  } else if (without_review.length - 4 > 4){
    without_review_num = 4;
  }
  // Buttons aren't needed
  if (without_review.length - 4 <= without_review_num) {
    without_review_button_prev.style.display = 'none';
    without_review_button_next.style.display = 'none';
  }
  // Resizing films without review
  let without_review_width = Math.min(Math.floor(((Math.min(window.innerWidth * 0.8, 1400) - 40 - 80) - 20 * (without_review_num - 1)) / without_review_num), 300);
  for (let i = 0; i < without_review_imgs.length; i++) {
    without_review_imgs[i].style.minWidth = without_review_width - 32 + 'px';
    without_review_imgs[i].style.maxWidth = without_review_width - 32 + 'px';
    without_review_imgs[i].style.height = (without_review_width - 32) * 3 / 2 + 'px';
  }
  without_review_overflow.style.width = without_review_width * without_review_num + (without_review_num - 1) * 20 + 'px';

  // Films without review slider
  without_review_slider.style.transition = 'none';
  without_review_slider.style.transform = 'translate(' + (without_review_width + 20) * (-1 * 2) + 'px, 0)';
  setTimeout((event) => {
    without_review_slider.style.transition = 'all 0.25s ease-in-out';
  }, 250);

  // Prev button
  without_review_button_prev.addEventListener('click', (event) => {
    without_review_slider.style.transform = 'translate(' + (Number(without_review_slider.style.transform.split('px')[0].split('translate(')[1]) + without_review_width + 20) + 'px, 0)';
    // User has reached the start
    if (Number(without_review_slider.style.transform.split('px')[0].split('translate(')[1]) == 0) {
      without_review_button_prev.style.pointerEvents = 'none';
      without_review_button_next.style.pointerEvents = 'none';
      setTimeout((event) => {
        without_review_slider.style.transition = 'none';
        without_review_slider.style.transform = 'translate(' + (without_review_width + 20) * (-1 * (without_review.length - 4)) + 'px, 0)';
        setTimeout((event) => {
          without_review_slider.style.transition = 'all 0.25s ease-in-out';
          without_review_button_prev.style.pointerEvents = 'auto';
          without_review_button_next.style.pointerEvents = 'auto';
        }, 50);
      }, 300);
    };
  });
  // Next button
  without_review_button_next.addEventListener('click', (event) => {
    without_review_slider.style.transform = 'translate(' + (Number(without_review_slider.style.transform.split('px')[0].split('translate(')[1]) - without_review_width - 20) + 'px, 0)';
    // User has reached the end
    if (Number(without_review_slider.style.transform.split('px')[0].split('translate(')[1]) == (without_review_width + 20) * (-1 * (without_review_imgs.length - 3))) {
      without_review_button_prev.style.pointerEvents = 'none';
      without_review_button_next.style.pointerEvents = 'none';
      setTimeout((event) => {
        without_review_slider.style.transition = 'none';
        without_review_slider.style.transform = 'translate(' + -1 * (without_review_width + 20) + 'px, 0)';
        setTimeout((event) => {
          without_review_slider.style.transition = 'all 0.25s ease-in-out';
          without_review_button_prev.style.pointerEvents = 'auto';
          without_review_button_next.style.pointerEvents = 'auto';
        }, 50);
      }, 300);
    };
  });
}


// Resizing films' images
const films = document.querySelectorAll(".films");
const films_imgs = document.querySelectorAll(".film-img");
let film_width = Math.max(Math.min(Math.min(window.innerWidth * 0.8, 1400) - 40 - 80, 400), 360);
if (films.length != 0) {
  for (let i = 0; i < films_imgs.length; i++) {
    films_imgs[i].style.minWidth = film_width - 52 + 'px'; 
    films_imgs[i].style.maxWidth = film_width - 52 + 'px';
    films_imgs[i].style.height = (film_width - 52) * 3 / 2 + 'px';
  }
}


// Reviews
const films_titles = document.querySelectorAll(".film-title");
const reviews = document.querySelectorAll('.film');
const review_likes = document.querySelectorAll('.film-review-like-button');
const review_likes_img = document.querySelectorAll('.film-review-like-button-img');
const review_likes_img_active = document.querySelectorAll('.film-review-like-button-img-active');
const review_likes_count = document.querySelectorAll('.film-review-like-count');
for (let i = 0; i < review_likes.length; i++) {
  review_likes[i].addEventListener('click', (event) => {
    review_likes_img[i].classList.toggle('active');
    review_likes_img_active[i].classList.toggle('active');
    if (review_likes_img[i].classList.contains('active')) {
      review_likes_count[i].innerHTML = Number(review_likes_count[i].innerHTML) - 1;
      const form_data = new FormData();
      form_data.append("type", "delete-review-like")
      form_data.append("review_id", Number(reviews[i].id))
      const data = Object.fromEntries(form_data);
      fetch(`${films_titles[i].href}`, {method: "POST", 
        headers: {
          "Content-type": "application/json"
        },
        body: JSON.stringify(data)})
      .then(res => res.json())
      .then(res => {
        if (res.status_code != 200) {
          window.location.replace(`${window.location.origin}/login`);
        }
      });
    } else {
      review_likes_count[i].innerHTML = Number(review_likes_count[i].innerHTML) + 1;
      const form_data = new FormData();
      form_data.append("type", "add-review-like")
      form_data.append("review_id", Number(reviews[i].id))
      const data = Object.fromEntries(form_data);
      fetch(`${films_titles[i].href}`, {method: "POST", 
        headers: {
          "Content-type": "application/json"
        },
        body: JSON.stringify(data)}).then(res => res.json())
      .then(res => {
        if (res.status_code != 200) {
          window.location.replace(`${window.location.origin}/login`);
        }
      });
    }
  }); 
}


// User not found
const user_not_found = document.querySelector(".user-not-found");
if (user_not_found) {
  user_not_found.style.height = window.innerHeight - header.offsetHeight + "px";
}


// Window is being resized
addEventListener("resize", (event) => {
  // Resizing user not found
  if (user_not_found) {
    user_not_found.style.height = window.innerHeight - header.offsetHeight + "px";
  }

  // Watch later
  if (watch_later.length != 0) {
    // Number of films to show
    watch_later_num = watch_later.length - 4
    if (window.innerWidth <= 750 || watch_later.length - 4 < 0) {
      watch_later_num = 1;
    } else if (window.innerWidth <= 1000 && watch_later.length - 4 > 2) {
      watch_later_num = 2;
    } else if (window.innerWidth <= 1300 && watch_later.length - 4 > 3) {
      watch_later_num = 3;
    } else if (watch_later.length - 4 > 4){
      watch_later_num = 4;
    }
    // If buttons are needed
    if (watch_later.length - 4 > watch_later_num) {
      watch_later_button_prev.style.display = 'block';
      watch_later_button_next.style.display = 'block';
    } else {
      watch_later_button_prev.style.display = 'none';
      watch_later_button_next.style.display = 'none';
    }
    // Resizing films wish list
    watch_later_width = Math.min(Math.floor(((Math.min(window.innerWidth * 0.8, 1400) - 40 - 80) - 20 * (watch_later_num - 1)) / watch_later_num), 300);
    for (let i = 0; i < watch_later_imgs.length; i++) {
      watch_later_imgs[i].style.minWidth = watch_later_width - 32 + 'px';
      watch_later_imgs[i].style.maxWidth = watch_later_width - 32 + 'px';
      watch_later_imgs[i].style.height = (watch_later_width - 32) * 3 / 2 + 'px';
    }
    watch_later_overflow.style.width = watch_later_width * watch_later_num + (watch_later_num - 1) * 20 + 'px';
    // Translating slider
    let watch_later_position = Math.round(Number(watch_later_slider.style.transform.split('px')[0].split('translate(')[1]) / (watch_later_width + 20))
    watch_later_slider.style.transition = 'none';
    watch_later_slider.style.transform = 'translate(' + (watch_later_width + 20) * watch_later_position + 'px, 0)';
    setTimeout((event) => {watch_later_slider.style.transition = 'all 0.25s ease-in-out';}, 50);
  }

  // Films without review
  if (without_review.length != 0) {
    // Number of films to show
    without_review_num = without_review.length - 4
    if (window.innerWidth <= 750 || without_review.length - 4 < 0) {
      without_review_num = 1;
    } else if (window.innerWidth <= 1000 && without_review.length - 4 > 2) {
      without_review_num = 2;
    } else if (window.innerWidth <= 1300 && without_review.length - 4 > 3) {
      without_review_num = 3;
    } else if (without_review.length - 4 > 4){
      without_review_num = 4;
    }
    // If buttons are needed
    if (without_review.length - 4 > without_review_num) {
      without_review_button_prev.style.display = 'block';
      without_review_button_next.style.display = 'block';
    } else {
      without_review_button_prev.style.display = 'none';
      without_review_button_next.style.display = 'none';
    }
    // Resizing films without review
    without_review_width = Math.min(Math.floor(((Math.min(window.innerWidth * 0.8, 1400) - 40 - 80) - 20 * (without_review_num - 1)) / without_review_num), 300);
    for (let i = 0; i < without_review_imgs.length; i++) {
      without_review_imgs[i].style.minWidth = without_review_width - 32 + 'px';
      without_review_imgs[i].style.maxWidth = without_review_width - 32 + 'px';
      without_review_imgs[i].style.height = (without_review_width - 32) * 3 / 2 + 'px';
    }
    without_review_overflow.style.width = without_review_width * without_review_num + (without_review_num - 1) * 20 + 'px';
    // Translating the slider
    let without_review_position = Math.round(Number(without_review_slider.style.transform.split('px')[0].split('translate(')[1]) / (without_review_width + 20))
    without_review_slider.style.transition = 'none';
    without_review_slider.style.transform = 'translate(' + (without_review_width + 20) * without_review_position + 'px, 0)';
    setTimeout((event) => {without_review_slider.style.transition = 'all 0.25s ease-in-out';}, 50);
  }

  // Resizing films' images
  if (films.length != 0) {
    film_width = Math.max(Math.min(Math.min(window.innerWidth * 0.8, 1400) - 40 - 80, 400), 360);
    for (let i = 0; i < films_imgs.length; i++) {
      films_imgs[i].style.minWidth = film_width - 52 + 'px'; 
      films_imgs[i].style.maxWidth = film_width - 52 + 'px';
      films_imgs[i].style.height = (film_width - 52) * 3 / 2 + 'px';
    }
  }
});


