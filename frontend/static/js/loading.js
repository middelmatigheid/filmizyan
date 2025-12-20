// Editing searcher link
let header = null;
let searcher = null;
let searcher_link = null;
const loading = document.querySelector(".loading");

setTimeout(() => {
  let loading = document.querySelector(".loading")
  if (loading) loading.style.display = "block";
}, 50);

async function addSearcher() {
  header = document.querySelector("header");
  searcher = document.querySelector(".searcher-input");
  searcher_link = document.querySelector(".searcher-link");

  if (searcher) {
    searcher.addEventListener("keyup", (event) => {
      const search_url = `${window.location.origin}/search/${event.target.value}`;
      searcher_link.setAttribute("href", search_url);
      
      if (event.key === "Enter") {
        window.location.replace(search_url);
      }
    });
  } 
}

async function start() {}
