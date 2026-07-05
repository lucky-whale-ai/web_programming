const productRail = document.querySelector(".product-rail");

if (productRail) {
  const productRailButtons = [...productRail.querySelectorAll("[data-rail-index]")];

  productRailButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const activeIndex = Number(button.dataset.railIndex);

      productRail.style.setProperty("--active-index", activeIndex);

      productRailButtons.forEach((item) => {
        const isActive = item === button;
        item.classList.toggle("is-active", isActive);
        item.setAttribute("aria-pressed", String(isActive));
      });
    });
  });
}
