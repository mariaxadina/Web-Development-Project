const toggle = document.querySelector('#hamburger-id');
    const navigatie = document.querySelector('nav');

    toggle.addEventListener("click", () => {
      navigatie.classList.toggle('extend');
      console.log("deschis");
    });