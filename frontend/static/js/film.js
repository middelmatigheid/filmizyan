start = async function() {
  // Watch later button
  const watch_later_button = document.querySelector('.watch-later-button');
  if (watch_later_button) {
    watch_later_button.addEventListener('click', (event) => {
      if (watch_later_button.classList.contains('active')) {
        fetch(window.location.href, {method: "POST", body: JSON.stringify({type: "delete-watch-later"})}).then(res => res.json())
        .then(res => {
          if (res.status_code != 200) {
           window.location.replace(`${window.location.origin}/login`);
          }
        });

      } else {
        fetch(window.location.href, {method: "POST", body: JSON.stringify({type: "add-watch-later"})}).then(res => res.json())
        .then(res => {
          if (res.status_code != 200) {
            window.location.replace(`${window.location.origin}/login`);
          }
        });
      }
      watch_later_button.classList.toggle('active');
    });
  }

  let film_width = Math.min(Math.round(window.innerWidth * 0.8), 1400) - 50;

  // Trailers
  const trailers_overflow = document.querySelector('.trailers-overflow');
  const trailers_slider = document.querySelector('.trailers-slider');
  const trailers = document.querySelectorAll('.trailer');
  const trailers_imgs = document.querySelectorAll('.trailer-img');
  const trailers_button_prev = document.querySelector('.trailers-button-prev img');
  const trailers_button_next = document.querySelector('.trailers-button-next img');
  let trailers_num = 4;
  if (trailers.length != 0) {
    // Number of trailers to show
    trailers_num = trailers.length - 4
    if (window.innerWidth <= 750 || trailers.length - 4 < 0) {
      trailers_num = 1;
    } else if (window.innerWidth <= 1100 && trailers.length - 4 > 2) {
      trailers_num = 2;
    } else if (window.innerWidth <= 1400 && trailers.length - 4 > 3) {
      trailers_num = 3;
    } else if (trailers.length - 4 > 4){
      trailers_num = 4;
    }
    // Buttons aren't needed
    if (trailers.length - 4 <= trailers_num) {
      trailers_button_prev.style.display = 'none';
      trailers_button_next.style.display = 'none';
    }
    // Resizing trailers
    let trailer_width = Math.min(Math.floor(((film_width - 40 - 80) - 20 * (trailers_num - 1)) / trailers_num), 400);
    for (let i = 0; i < trailers_imgs.length; i++) {
      trailers[i].style.minWidth = trailer_width + 'px';
      trailers[i].style.maxWidth = trailer_width + 'px';
      trailers_imgs[i].style.height = (trailer_width - 32) * 9 / 16 + 'px';
    }
    trailers_overflow.style.minWidth = trailer_width * trailers_num + (trailers_num - 1) * 20 + 'px';
    trailers_overflow.style.maxWidth = trailer_width * trailers_num + (trailers_num - 1) * 20 + 'px';

    // Trailers slider
    trailers_slider.style.transition = 'none';
    trailers_slider.style.transform = 'translate(' + (trailer_width + 20) * (-1 * 2) + 'px, 0)';
    setTimeout((event) => {
      trailers_slider.style.transition = 'all 0.25s ease-in-out';
    }, 250);

    // Prev button
    trailers_button_prev.addEventListener('click', (event) => {
      trailer_width = Math.min(Math.floor(((film_width - 40 - 80) - 20 * (trailers_num - 1)) / trailers_num), 400);
      trailers_slider.style.transform = 'translate(' + (Number(trailers_slider.style.transform.split('px')[0].split('translate(')[1]) + trailer_width + 20) + 'px, 0)';
      // User has reached the start
      if (Number(trailers_slider.style.transform.split('px')[0].split('translate(')[1]) == 0) {
        trailers_button_prev.style.pointerEvents = 'none';
        trailers_button_next.style.pointerEvents = 'none';
        setTimeout((event) => {
          trailers_slider.style.transition = 'none';
          trailers_slider.style.transform = 'translate(' + (trailer_width + 20) * (-1 * (trailers.length - 4)) + 'px, 0)';
          setTimeout((event) => {
            trailers_slider.style.transition = 'all 0.25s ease-in-out';
            trailers_button_prev.style.pointerEvents = 'auto';
            trailers_button_next.style.pointerEvents = 'auto';
          }, 50);
        }, 300);
      };
    });
    // Next button
    trailers_button_next.addEventListener('click', (event) => {
      trailer_width = Math.min(Math.floor(((film_width - 40 - 80) - 20 * (trailers_num - 1)) / trailers_num), 400);
      trailers_slider.style.transform = 'translate(' + (Number(trailers_slider.style.transform.split('px')[0].split('translate(')[1]) - trailer_width - 20) + 'px, 0)';
      // User has reached the end
      if (Number(trailers_slider.style.transform.split('px')[0].split('translate(')[1]) == (trailer_width + 20) * (-1 * (trailers_imgs.length - 3))) {
        trailers_button_prev.style.pointerEvents = 'none';
        trailers_button_next.style.pointerEvents = 'none';
        setTimeout((event) => {
          trailers_slider.style.transition = 'none';
          trailers_slider.style.transform = 'translate(' + -1 * (trailer_width + 20) + 'px, 0)';
          setTimeout((event) => {
            trailers_slider.style.transition = 'all 0.25s ease-in-out';
            trailers_button_prev.style.pointerEvents = 'auto';
            trailers_button_next.style.pointerEvents = 'auto';
          }, 50);
        }, 300);
      };
    });
  }


  // Similar movies
  const similars_overflow = document.querySelector('.similars-overflow');
  const similars_slider = document.querySelector('.similars-slider');
  const similars = document.querySelectorAll('.similar');
  const similars_imgs = document.querySelectorAll('.similar-img');
  const similars_button_prev = document.querySelector('.similars-button-prev img');
  const similars_button_next = document.querySelector('.similars-button-next img');
  let similars_num = 4;
  if (similars.length != 0) {
    // Number of similar movies to show
    similars_num = similars.length - 4
    if (window.innerWidth <= 750 || similars.length - 4 < 0) {
      similars_num = 1;
    } else if (window.innerWidth <= 1000 && similars.length - 4 > 2) {
      similars_num = 2;
    } else if (window.innerWidth <= 1300 && similars.length - 4 > 3) {
      similars_num = 3;
    } else if (similars.length - 4 > 4){
      similars_num = 4;
    }
    // Buttons aren't needed
    if (similars.length - 4 <= similars_num) {
      similars_button_prev.style.display = 'none';
      similars_button_next.style.display = 'none';
    }
    // Resizing similar movies
    let similar_width = Math.min(Math.floor(((film_width - 40 - 80) - 20 * (similars_num - 1)) / similars_num), 400);
    for (let i = 0; i < similars_imgs.length; i++) {
      similars[i].style.minWidth = similar_width + 'px';
      similars[i].style.maxWidth = similar_width + 'px';
      similars_imgs[i].style.height = (similar_width - 32) * 3 / 2 + 'px';
    }
    similars_overflow.style.minWidth = similar_width * similars_num + (similars_num - 1) * 20 + 'px';
    similars_overflow.style.maxWidth = similar_width * similars_num + (similars_num - 1) * 20 + 'px';

    // Similar movies slider
    similars_slider.style.transition = 'none';
    similars_slider.style.transform = 'translate(' + (similar_width + 20) * (-1 * 2) + 'px, 0)';
    setTimeout((event) => {
      similars_slider.style.transition = 'all 0.25s ease-in-out';
    }, 250);

    // Prev button
    similars_button_prev.addEventListener('click', (event) => {
      similar_width = Math.min(Math.floor(((film_width - 40 - 80) - 20 * (similars_num - 1)) / similars_num), 400);
      similars_slider.style.transform = 'translate(' + (Number(similars_slider.style.transform.split('px')[0].split('translate(')[1]) + similar_width + 20) + 'px, 0)';
      // User has reached the start
      if (Number(similars_slider.style.transform.split('px')[0].split('translate(')[1]) == 0) {
        similars_button_prev.style.pointerEvents = 'none';
        similars_button_next.style.pointerEvents = 'none';
        setTimeout((event) => {
          similars_slider.style.transition = 'none';
          similars_slider.style.transform = 'translate(' + (similar_width + 20) * (-1 * (similars.length - 4)) + 'px, 0)';
          setTimeout((event) => {
            similars_slider.style.transition = 'all 0.25s ease-in-out';
            similars_button_prev.style.pointerEvents = 'auto';
            similars_button_next.style.pointerEvents = 'auto';
          }, 50);
        }, 300);
      };
    });
    // Next button
    similars_button_next.addEventListener('click', (event) => {
      similar_width = Math.min(Math.floor(((film_width - 40 - 80) - 20 * (similars_num - 1)) / similars_num), 400);
      similars_slider.style.transform = 'translate(' + (Number(similars_slider.style.transform.split('px')[0].split('translate(')[1]) - similar_width - 20) + 'px, 0)';
      // User has reached the end
      if (Number(similars_slider.style.transform.split('px')[0].split('translate(')[1]) == (similar_width + 20) * (-1 * (similars_imgs.length - 3))) {
        similars_button_prev.style.pointerEvents = 'none';
        similars_button_next.style.pointerEvents = 'none';
        setTimeout((event) => {
          similars_slider.style.transition = 'none';
          similars_slider.style.transform = 'translate(' + -1 * (similar_width + 20) + 'px, 0)';
          setTimeout((event) => {
            similars_slider.style.transition = 'all 0.25s ease-in-out';
            similars_button_prev.style.pointerEvents = 'auto';
            similars_button_next.style.pointerEvents = 'auto';
          }, 50);
        }, 300);
      };
    });
  }


  // Sequels
  const sequels_overflow = document.querySelector('.sequels-overflow');
  const sequels_slider = document.querySelector('.sequels-slider');
  const sequels = document.querySelectorAll('.sequel');
  const sequels_imgs = document.querySelectorAll('.sequel-img');
  const sequels_button_prev = document.querySelector('.sequels-button-prev img');
  const sequels_button_next = document.querySelector('.sequels-button-next img');
  let sequels_num = 4;
  if (sequels.length != 0) {
    // Number of sequels to show
    sequels_num = sequels.length - 4
    if (window.innerWidth <= 750 || sequels.length - 4 < 0) {
      sequels_num = 1;
    } else if (window.innerWidth <= 1000 && sequels.length - 4 > 2) {
      sequels_num = 2;
    } else if (window.innerWidth <= 1300 && sequels.length - 4 > 3) {
      sequels_num = 3;
    } else if (sequels.length - 4 > 4){
      sequels_num = 4;
    }
    // Buttons aren't needed
    if (sequels.length - 4 <= sequels_num) {
      sequels_button_prev.style.display = 'none';
      sequels_button_next.style.display = 'none';
    }
    // Resizing sequels
    let sequel_width = Math.min(Math.floor(((film_width - 40 - 80) - 20 * (sequels_num - 1)) / sequels_num), 400);
    for (let i = 0; i < sequels_imgs.length; i++) {
      sequels[i].style.minWidth = sequel_width + 'px';
      sequels[i].style.maxWidth = sequel_width + 'px';
      sequels_imgs[i].style.height = (sequel_width - 32) * 3 / 2 + 'px';
    }
    sequels_overflow.style.minWidth = sequel_width * sequels_num + (sequels_num - 1) * 20 + 'px';
    sequels_overflow.style.maxWidth = sequel_width * sequels_num + (sequels_num - 1) * 20 + 'px';

    // Sequels slider
    sequels_slider.style.transition = 'none';
    sequels_slider.style.transform = 'translate(' + (sequel_width + 20) * (-1 * 2) + 'px, 0)';
    setTimeout((event) => {
      sequels_slider.style.transition = 'all 0.25s ease-in-out';
    }, 250);

    // Prev button
    sequels_button_prev.addEventListener('click', (event) => {
      sequel_width = Math.min(Math.floor(((film_width - 40 - 80) - 20 * (sequels_num - 1)) / sequels_num), 400);
      sequels_slider.style.transform = 'translate(' + (Number(sequels_slider.style.transform.split('px')[0].split('translate(')[1]) + sequel_width + 20) + 'px, 0)';
      // User has reached the start
      if (Number(sequels_slider.style.transform.split('px')[0].split('translate(')[1]) == 0) {
        sequels_button_prev.style.pointerEvents = 'none';
        sequels_button_next.style.pointerEvents = 'none';
        setTimeout((event) => {
          sequels_slider.style.transition = 'none';
          sequels_slider.style.transform = 'translate(' + (sequel_width + 20) * (-1 * (sequels.length - 4)) + 'px, 0)';
          setTimeout((event) => {
            sequels_slider.style.transition = 'all 0.25s ease-in-out';
            sequels_button_prev.style.pointerEvents = 'auto';
            sequels_button_next.style.pointerEvents = 'auto';
          }, 50);
        }, 300);
      };
    });
    // Next button
    sequels_button_next.addEventListener('click', (event) => {
      sequel_width = Math.min(Math.floor(((film_width - 40 - 80) - 20 * (sequels_num - 1)) / sequels_num), 400);
      sequels_slider.style.transform = 'translate(' + (Number(sequels_slider.style.transform.split('px')[0].split('translate(')[1]) - sequel_width - 20) + 'px, 0)';
      // User has reached the end
      if (Number(sequels_slider.style.transform.split('px')[0].split('translate(')[1]) == (sequels_width + 20) * (-1 * (sequels_imgs.length - 3))) {
        sequels_button_prev.style.pointerEvents = 'none';
        sequels_button_next.style.pointerEvents = 'none';
        setTimeout((event) => {
          sequels_slider.style.transition = 'none';
          sequels_slider.style.transform = 'translate(' + -1 * (sequel_width + 20) + 'px, 0)';
          setTimeout((event) => {
            sequels_slider.style.transition = 'all 0.25s ease-in-out';
            sequels_button_prev.style.pointerEvents = 'auto';
            sequels_button_next.style.pointerEvents = 'auto';
          }, 50);
        }, 300);
      };
    });
  }


  // Posters
  const posters_overflow = document.querySelector('.posters-overflow');
  const posters_slider = document.querySelector('.posters-slider');
  const posters = document.querySelectorAll('.poster');
  const posters_imgs = document.querySelectorAll('.poster-img');
  const posters_button_prev = document.querySelector('.posters-button-prev img');
  const posters_button_next = document.querySelector('.posters-button-next img');
  let posters_num = 4;
  if (posters.length != 0) {
    // Number of posters to show
    posters_num = posters.length - 4
    if (window.innerWidth <= 750 || posters.length - 4 < 0) {
      posters_num = 1;
    } else if (window.innerWidth <= 1100 && posters.length - 4 > 2) {
      posters_num = 2;
    } else if (window.innerWidth <= 1400 && posters.length - 4 > 3) {
      posters_num = 3;
    } else if (posters.length - 4 > 4){
      posters_num = 4;
    }
    // Buttons aren't needed
    if (posters.length - 4 <= posters_num) {
      posters_button_prev.style.display = 'none';
      posters_button_next.style.display = 'none';
    }
    // Resizing posters
    let poster_width = Math.min(Math.floor(((film_width - 40 - 80) - 20 * (posters_num - 1)) / posters_num), 400);
    for (let i = 0; i < posters_imgs.length; i++) {
      posters[i].style.minWidth = poster_width + 'px';
      posters[i].style.maxWidth = poster_width + 'px';
      posters_imgs[i].style.height = (poster_width - 32) * 9 / 16 + 'px';
      posters_imgs[i].addEventListener('click', (event) => {
        document.querySelector('body').insertAdjacentHTML('afterbegin', `<div class="poster-active">
                                                                            <div class="poster-active-inner">
                                                                              <div class="poster-active-bg"></div>
                                                                              <img class="poster-active-img" src="${posters_imgs[i].style.background.split('") center')[0].split('url("')[1]}">
                                                                            </div>
                                                                          </div>`)
        document.querySelector('.poster-active-bg').addEventListener('click', (event) => {
          document.querySelector('.poster-active').remove();
        })
      });
    }
    posters_overflow.style.minWidth = poster_width * posters_num + (posters_num - 1) * 20 + 'px';
    posters_overflow.style.maxWidth = poster_width * posters_num + (posters_num - 1) * 20 + 'px';

    // Posters slider
    posters_slider.style.transition = 'none';
    posters_slider.style.transform = 'translate(' + (poster_width + 20) * (-1 * 2) + 'px, 0)';
    setTimeout((event) => {
      posters_slider.style.transition = 'all 0.25s ease-in-out';
    }, 250);

    // Prev button
    posters_button_prev.addEventListener('click', (event) => {
      poster_width = Math.min(Math.floor(((film_width - 40 - 80) - 20 * (posters_num - 1)) / posters_num), 400);
      posters_slider.style.transform = 'translate(' + (Number(posters_slider.style.transform.split('px')[0].split('translate(')[1]) + poster_width + 20) + 'px, 0)';
      // User has reached the start
      if (Number(posters_slider.style.transform.split('px')[0].split('translate(')[1]) == 0) {
        posters_button_prev.style.pointerEvents = 'none';
        posters_button_next.style.pointerEvents = 'none';
        setTimeout((event) => {
          posters_slider.style.transition = 'none';
          posters_slider.style.transform = 'translate(' + (poster_width + 20) * (-1 * (posters.length - 4)) + 'px, 0)';
          setTimeout((event) => {
            posters_slider.style.transition = 'all 0.25s ease-in-out';
            posters_button_prev.style.pointerEvents = 'auto';
            posters_button_next.style.pointerEvents = 'auto';
          }, 50);
        }, 300);
      };
    });
    // Next button
    posters_button_next.addEventListener('click', (event) => {
      poster_width = Math.min(Math.floor(((film_width - 40 - 80) - 20 * (posters_num - 1)) / posters_num), 400);
      posters_slider.style.transform = 'translate(' + (Number(posters_slider.style.transform.split('px')[0].split('translate(')[1]) - poster_width - 20) + 'px, 0)';
      // User has reached the end
      if (Number(posters_slider.style.transform.split('px')[0].split('translate(')[1]) == (poster_width + 20) * (-1 * (posters_imgs.length - 3))) {
        posters_button_prev.style.pointerEvents = 'none';
        posters_button_next.style.pointerEvents = 'none';
        setTimeout((event) => {
          posters_slider.style.transition = 'none';
          posters_slider.style.transform = 'translate(' + -1 * (poster_width + 20) + 'px, 0)';
          setTimeout((event) => {
            posters_slider.style.transition = 'all 0.25s ease-in-out';
            posters_button_prev.style.pointerEvents = 'auto';
            posters_button_next.style.pointerEvents = 'auto';
          }, 50);
        }, 300);
      };
    });
  }


  // Reviews
  const reviews = document.querySelectorAll('.review');
  const review_likes = document.querySelectorAll('.review-like-button');
  const review_likes_img = document.querySelectorAll('.review-like-button-img');
  const review_likes_img_active = document.querySelectorAll('.review-like-button-img-active');
  const review_likes_count = document.querySelectorAll('.review-like-count');
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
        fetch(window.location.href, {method: "POST", 
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
        fetch(window.location.href, {method: "POST", 
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


  const new_review = document.querySelector(".new-review")
  let failed = document.querySelector(".failed");
  const new_review_title = document.querySelector(".new-review-title")
  if (new_review) {
    new_review.addEventListener("submit", event => {
      event.preventDefault();
      const form_data = new FormData(new_review);
      form_data.append("type", "add-review")
      if (form_data.get("rating") == "None") {
        if (failed) {
          failed.textContent = "Выберите оценку";
        } else {
          new_review_title.insertAdjacentHTML("afterend", `<div class="failed">Выберите оценку</div>`);
        }
        failed = document.querySelector(".failed");
      } else if ((form_data.get("title") && !form_data.get("text")) || (!form_data.get("title") && form_data.get("text"))) {
        if (failed) {
          failed.textContent = "Заполните все поля";
        } else {
          new_review_title.insertAdjacentHTML("afterend", `<div class="failed">Заполните все поля</div>`);
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
          if (res.status_code == 200) {
            window.location.reload();
          } else {
            if (failed) {
              failed.textContent = res.message;
            } else {
              new_review_title.insertAdjacentHTML("afterend", `<div class="failed">${res.message}</div>`);
            }
            failed = document.querySelector(".failed");
          }
        })
        .catch(err => {
          if (failed) {
            failed.textContent = "Произошла непредвиденная ошибка";
          } else {
            new_review_title.insertAdjacentHTML("afterend", `<div class="failed">Произошла непредвиденная ошибка</div>`);
          }
          failed = document.querySelector(".failed");
        })
      }
    });
  }


  const review_delete = document.querySelector(".review-delete-button");
  if (review_delete) {
    review_delete.addEventListener("click", event => {
      event.preventDefault();
      fetch(window.location.href, {
        method: "POST",
        headers: {
          "Content-type": "application/json"
        },
        body: JSON.stringify({type: "delete-review"})
      }).then(() => {
        setTimeout(() => {window.location.reload();}, 100);
      });
    });
  }


  // Window is being resized
  addEventListener('resize', (event) => {
    film_width = Math.min(Math.round(window.innerWidth * 0.8), 1400) - 50;

    // Trailers
    if (trailers.length != 0) {
      // Number of trailers to show
      trailers_num = trailers.length - 4
      if (window.innerWidth <= 750 || trailers.length - 4 < 0) {
        trailers_num = 1;
      } else if (window.innerWidth <= 1100 && trailers.length - 4 > 2) {
        trailers_num = 2;
      } else if (window.innerWidth <= 1400 && trailers.length - 4 > 3) {
        trailers_num = 3;
      } else if (trailers.length - 4 > 4){
        trailers_num = 4;
      }
      // If buttons are needed
      if (trailers.length - 4 > trailers_num) {
        trailers_button_prev.style.display = 'block';
        trailers_button_next.style.display = 'block';
      } else {
        trailers_button_prev.style.display = 'none';
        trailers_button_next.style.display = 'none';
      }
      // Resizing trailers
      trailer_width = Math.min(Math.floor(((film_width - 40 - 80) - 20 * (trailers_num - 1)) / trailers_num), 400);
      for (let i = 0; i < trailers_imgs.length; i++) {
        trailers[i].style.minWidth = trailer_width + 'px';
        trailers[i].style.maxWidth = trailer_width + 'px';
        trailers_imgs[i].style.height = (trailer_width - 32) * 9 / 16 + 'px';
      }
      trailers_overflow.style.minWidth = trailer_width * trailers_num + (trailers_num - 1) * 20 + 'px';
      trailers_overflow.style.maxWidth = trailer_width * trailers_num + (trailers_num - 1) * 20 + 'px';
      // Translating slider
      let trailers_position = Math.round(Number(trailers_slider.style.transform.split('px')[0].split('translate(')[1]) / (trailer_width + 20))
      trailers_slider.style.transition = 'none';
      trailers_slider.style.transform = 'translate(' + (trailer_width + 20) * trailers_position + 'px, 0)';
      setTimeout((event) => {trailers_slider.style.transition = 'all 0.25s ease-in-out';}, 50);
    }

    // Similar movies
    if (similars.length != 0) {
      // Number of similar movies to show
      similars_num = similars.length - 4
      if (window.innerWidth <= 750 || similars.length - 4 < 0) {
        similars_num = 1;
      } else if (window.innerWidth <= 1000 && similars.length - 4 > 2) {
        similars_num = 2;
      } else if (window.innerWidth <= 1300 && similars.length - 4 > 3) {
        similars_num = 3;
      } else if (similars.length - 4 > 4){
        similars_num = 4;
      }
      // If buttons are needed
      if (similars.length - 4 > similars_num) {
        similars_button_prev.style.display = 'block';
        similars_button_next.style.display = 'block';
      } else {
        similars_button_prev.style.display = 'none';
        similars_button_next.style.display = 'none';
      }
      // Resizing similar movies
      similar_width = Math.min(Math.floor(((film_width - 40 - 80) - 20 * (similars_num - 1)) / similars_num), 400);
      for (let i = 0; i < similars_imgs.length; i++) {
        similars[i].style.minWidth = similar_width + 'px';
        similars[i].style.maxWidth = similar_width + 'px';
        similars_imgs[i].style.height = (similar_width - 32) * 3 / 2 + 'px';
      }
      similars_overflow.style.minWidth = similar_width * similars_num + (similars_num - 1) * 20 + 'px';
      similars_overflow.style.maxWidth = similar_width * similars_num + (similars_num - 1) * 20 + 'px';
      // Translating slider
      let similars_position = Math.round(Number(similars_slider.style.transform.split('px')[0].split('translate(')[1]) / (similar_width + 20))
      similars_slider.style.transition = 'none';
      similars_slider.style.transform = 'translate(' + (similar_width + 20) * similars_position + 'px, 0)';
      setTimeout((event) => {similars_slider.style.transition = 'all 0.25s ease-in-out';}, 50);
    }

    // Sequels
    if (sequels.length != 0) {
      // Number of sequels to show
      sequels_num = sequels.length - 4
      if (window.innerWidth <= 750 || sequels.length - 4 < 0) {
        sequels_num = 1;
      } else if (window.innerWidth <= 1000 && sequels.length - 4 > 2) {
        sequels_num = 2;
      } else if (window.innerWidth <= 1300 && sequels.length - 4 > 3) {
        sequels_num = 3;
      } else if (sequels.length - 4 > 4){
        sequels_num = 4;
      }
      // If buttons are needed
      if (sequels.length - 4 > sequels_num) {
        sequels_button_prev.style.display = 'block';
        sequels_button_next.style.display = 'block';
      } else {
        sequels_button_prev.style.display = 'none';
        sequels_button_next.style.display = 'none';
      }
      // Resizing sequels
      sequel_width = Math.min(Math.floor(((film_width - 40 - 80) - 20 * (sequels_num - 1)) / sequels_num), 400);
      for (let i = 0; i < sequels_imgs.length; i++) {
        sequels[i].style.minWidth = sequel_width + 'px';
        sequels[i].style.maxWidth = sequel_width + 'px';
        sequels_imgs[i].style.height = (sequel_width - 32) * 3 / 2 + 'px';
      }
      sequels_overflow.style.minWidth = sequel_width * sequels_num + (sequels_num - 1) * 20 + 'px';
      sequels_overflow.style.maxWidth = sequel_width * sequels_num + (sequels_num - 1) * 20 + 'px';
      // Translating slider
      let sequels_position = Math.round(Number(sequels_slider.style.transform.split('px')[0].split('translate(')[1]) / (sequel_width + 20))
      sequels_slider.style.transition = 'none';
      sequels_slider.style.transform = 'translate(' + (sequel_width + 20) * sequels_position + 'px, 0)';
      setTimeout((event) => {sequels_slider.style.transition = 'all 0.25s ease-in-out';}, 50);
    }

    // Posters
    if (posters.length != 0) {
      // Number of posters to show
      posters_num = posters.length - 4
      if (window.innerWidth <= 750 || posters.length - 4 < 0) {
        posters_num = 1;
      } else if (window.innerWidth <= 1100 && posters.length - 4 > 2) {
        posters_num = 2;
      } else if (window.innerWidth <= 1400 && posters.length - 4 > 3) {
        posters_num = 3;
      } else if (posters.length - 4 > 4){
        posters_num = 4;
      }
      // If buttons are needed
      if (posters.length - 4 > trailers_num) {
        posters_button_prev.style.display = 'block';
        posters_button_next.style.display = 'block';
      } else {
        posters_button_prev.style.display = 'none';
        posters_button_next.style.display = 'none';
      }
      // Resizing posters
      poster_width = Math.min(Math.floor(((film_width - 40 - 80) - 20 * (posters_num - 1)) / posters_num), 400);
      for (let i = 0; i < posters_imgs.length; i++) {
        posters[i].style.minWidth = poster_width + 'px';
        posters[i].style.maxWidth = poster_width + 'px';
        posters_imgs[i].style.height = (poster_width - 32) * 9 / 16 + 'px';
      }
      posters_overflow.style.minWidth = poster_width * posters_num + (posters_num - 1) * 20 + 'px';
      posters_overflow.style.maxWidth = poster_width * posters_num + (posters_num - 1) * 20 + 'px';
      // Translating slider
      let posters_position = Math.round(Number(posters_slider.style.transform.split('px')[0].split('translate(')[1]) / (poster_width + 20))
      posters_slider.style.transition = 'none';
      posters_slider.style.transform = 'translate(' + (poster_width + 20) * posters_position + 'px, 0)';
      setTimeout((event) => {posters_slider.style.transition = 'all 0.25s ease-in-out';}, 50);
    }
  });
}