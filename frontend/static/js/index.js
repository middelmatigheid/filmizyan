// Editing searcher link
const main_searcher = document.querySelector(".main-searcher-input");
const main_searcher_link = document.querySelector(".main-searcher-link");
main_searcher.addEventListener("keyup", (event) => {
  const main_search_url = `${window.location.origin}/search/${event.target.value}`;
  main_searcher_link.setAttribute("href", main_search_url);
  if (event.key === "Enter") {
      window.location.replace(main_search_url);
  }
});
