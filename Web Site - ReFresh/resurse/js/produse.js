window.addEventListener("load", function () {
    function normalizeString(str) {
        const diacriticsMap = {
            'ă': 'a', 'â': 'a', 'î': 'i', 'ș': 's', 'ț': 't',
            'Ă': 'A', 'Â': 'A', 'Î': 'I', 'Ș': 'S', 'Ț': 'T'
        };
        return str.replace(/[ăâîșțĂÂÎȘȚ]/g, match => diacriticsMap[match]);
    }

    function filtrareProduse() {
        const inpNume = normalizeString(document.getElementById("inp-nume").value.toLowerCase().trim());
        const radioCalorii = document.getElementsByName("gr_rad");
        let inpCalorii;

        for (let rad of radioCalorii) {
            if (rad.checked) {
                inpCalorii = rad.value;
                break;
            }
        }

        let minCalorii, maxCalorii;
        if (inpCalorii !== "toate") {
            const vCal = inpCalorii.split(":");
            minCalorii = parseInt(vCal[0]);
            maxCalorii = parseInt(vCal[1]);
        }

        const inpPret = parseInt(document.getElementById("inp-pret").value);
        const valDescriere = normalizeString(document.getElementById("i_textarea").value.toLowerCase().trim());
        const inpCateg = document.getElementById("inp-categorie").value.toLowerCase().trim();
        const produse = document.getElementsByClassName("produs");
        let numarProduseVizibile = 0;


        for (let produs of produse) {
            const valNume = normalizeString(produs.getElementsByClassName("val-nume")[0].innerHTML.toLowerCase().trim());
            const cond1 = valNume.startsWith(inpNume);
            const valCalorii = parseInt(produs.getElementsByClassName("val-calorii")[0].innerHTML);
            const cond2 = (inpCalorii === "toate" || (minCalorii <= valCalorii && valCalorii < maxCalorii));
            const valPret = parseFloat(produs.getElementsByClassName("val-pret")[0].innerHTML);
            const cond3 = (valPret > inpPret);
            const valCategorie = produs.getElementsByClassName("val-categorie")[0].innerHTML.toLowerCase().trim();
            const cond4 = (inpCateg === valCategorie || inpCateg === "toate");
            const prodDescriereElement = produs.getElementsByClassName("descriere")[0];
            const prodDescriere = prodDescriereElement ? normalizeString(prodDescriereElement.innerHTML.toLowerCase().trim()) : "";
            const cond5 = (valDescriere === "" || prodDescriere.includes(valDescriere));

            const isPinned = produs.classList.contains('pinned');

            if ((cond1 && cond2 && cond3 && cond4 && cond5) || isPinned) {
                produs.style.display = "block";
                numarProduseVizibile++;
            } else {
                produs.style.display = "none";
            }
        }
        // Afisează numărul total de produse vizibile
        let numarProduseVizibileElement = document.getElementById('numar-produse-vizibile');
        if (numarProduseVizibileElement) {
            numarProduseVizibileElement.textContent = numarProduseVizibile;
        }

        const mesajFiltrare = document.getElementById("mesaj-filtrare");
        mesajFiltrare.style.display = (numarProduseVizibile === 0) ? "block" : "none";
    }

    document.getElementById("inp-nume").addEventListener("input", filtrareProduse);
    document.getElementById("inp-pret").addEventListener("input", function () {
        document.getElementById("infoRange").innerHTML = `(${this.value})`;
        filtrareProduse();
    });
    document.getElementById("inp-categorie").addEventListener("change", filtrareProduse);
    document.getElementById("i_textarea").addEventListener("input", filtrareProduse);
    const radioCalorii = document.getElementsByName("gr_rad");
    radioCalorii.forEach(radio => {
        radio.addEventListener("change", filtrareProduse);
    });

    var prodinitialOrder = Array.from(document.getElementsByClassName("produs"));


    document.getElementById("resetare").addEventListener("click", function () {
        if (confirm("Doriți resetarea filtrelor?")) {
            document.getElementById("inp-nume").value = "";
            document.getElementById("inp-pret").value = document.getElementById("inp-pret").min;
            document.getElementById("inp-categorie").value = "toate";
            document.getElementById("i_rad4").checked = true;
            document.getElementById("infoRange").innerHTML = "(0)";
            document.getElementById("i_textarea").value = "";

            var produse = document.getElementsByClassName("produs");

            for (let prod of produse) {
                prod.style.display = "block";
            }
            var parentContainer = prodinitialOrder[0].parentNode;
            parentContainer.innerHTML = "";
            for (let prod of prodinitialOrder) {
                parentContainer.appendChild(prod);
                prod.style.display = "block";
            }

        }
    });

    function sorteaza(semn) {
        var produse = document.getElementsByClassName("produs");
        let v_produse = Array.from(produse)

        v_produse.sort(function (a, b) {
            let pret_a = parseInt(a.getElementsByClassName("val-pret")[0].innerHTML)
            let pret_b = parseInt(b.getElementsByClassName("val-pret")[0].innerHTML)
            if (pret_a == pret_b) {
                let nume_a = a.getElementsByClassName("val-nume")[0].innerHTML
                let nume_b = b.getElementsByClassName("val-nume")[0].innerHTML
                return semn * nume_a.localeCompare(nume_b);
            }
            return semn * (pret_a - pret_b);
        })
        console.log(v_produse)
        for (let prod of v_produse) {
            prod.parentNode.appendChild(prod)
        }

        // După sortare, reordonăm produsele pinuite la început
        var gridProduse = document.querySelector('.grid-produse');
        var pinnedProduse = gridProduse.querySelectorAll('.produs.pinned');
        pinnedProduse.forEach(function (pinnedProdus) {
            gridProduse.insertBefore(pinnedProdus, gridProduse.firstChild);
        });


    }



    document.getElementById("sortCrescNume").onclick = function () {
        sorteaza(1)
    }
    document.getElementById("sortDescrescNume").onclick = function () {
        sorteaza(-1)
    }

    window.addEventListener("keydown", function (e) {
        if (e.key === "c" && e.altKey) {
            let suma = 0;
            const produse = document.getElementsByClassName("produs");
            for (let produs of produse) {
                const stil = getComputedStyle(produs);
                if (stil.display !== "none") {
                    suma += parseFloat(produs.getElementsByClassName("val-pret")[0].innerHTML);
                }
            }

            if (!document.getElementById("par_suma")) {
                const p = document.createElement("p");
                p.innerHTML = suma;
                p.id = "par_suma";
                container = document.getElementById("produse");
                container.insertBefore(p, container.children[0]);
                setTimeout(() => {
                    const pgf = document.getElementById("par_suma");
                    if (pgf) pgf.remove();
                }, 2000);
            }
        }
    });

    // TEXTAREA Validation
    const textarea = document.getElementById("i_textarea");

    function validare(textarea) {
        const valDescriere = textarea.value.toLowerCase();
        const produse = document.getElementsByClassName("produs");
        let isInvalid = true; // Flag to track validation result

        for (let prod of produse) {
            const prod_descriere = prod.getElementsByClassName("val-descriere")[0].innerHTML.toLowerCase();
            if (prod_descriere.includes(valDescriere)) {
                isInvalid = false;
                break; // Exit the loop if a match is found
            }
        }

        if (isInvalid) {
            textarea.classList.add("is-invalid"); // Add the is-invalid class
        } else {
            textarea.classList.remove("is-invalid"); // Remove the is-invalid class
        }
    }

    // Event listener to trigger validation on textarea input
    textarea.addEventListener("input", function () {
        validare(textarea);
    });

    ////////////CEL MAI IEFTIN PRODUS///////////////////
    function calculeazaCelMaiMicPret() {
        var produse = document.getElementsByClassName("produs");
        let celMaiIeftinPret = Infinity; // Inițializăm cu un număr foarte mare

        for (let prod of produse) {
            let pretProdus = parseFloat(prod.getElementsByClassName("val-pret")[0].innerHTML);
            if (pretProdus < celMaiIeftinPret) {
                celMaiIeftinPret = pretProdus;
            }
        }

        return celMaiIeftinPret;
    }

    const pretmic = calculeazaCelMaiMicPret();
    const produse = document.getElementsByClassName("produs");
    for (let produs of produse) {
        let pretProdus = parseFloat(produs.getElementsByClassName("val-pret")[0].innerHTML);
        if (pretProdus === pretmic) {
            produs.getElementsByClassName("mesaj-special")[0].style.display = "block";
        }
    }




    //////////////////Butoane//////////////////

    // Funcția pentru pinuirea produsului
    function pinProduct(button) {
        var produs = button.closest('.produs');
        var gridProduse = document.querySelector('.grid-produse');
        var isPinned = produs.classList.toggle('pinned');

        // Schimbăm iconița în funcție de starea de pin
        var iconElement = button.querySelector('i');
        if (isPinned) {
            iconElement.classList.remove('bi-pin');
            iconElement.classList.add('bi', 'bi-pin-angle-fill');
            button.title = 'Dezactivează acest produs';
        } else {
            iconElement.classList.remove('bi-pin-angle-fill');
            iconElement.classList.add('bi', 'bi-pin');
            button.title = 'Păstrează acest produs';

            // Produsul nu mai este pinnuit, îl readucem la poziția originală
            var sibling = produs.nextElementSibling;
            while (sibling && sibling.classList.contains('produs')) {
                if (!sibling.classList.contains('pinned')) {
                    gridProduse.insertBefore(produs, sibling);
                    break;
                }
                sibling = sibling.nextElementSibling;
            }
        }

        // Reordonăm produsele pinuite la început
        var pinnedProduse = gridProduse.querySelectorAll('.produs.pinned');
        pinnedProduse.forEach(function (pinnedProdus) {
            gridProduse.insertBefore(pinnedProdus, gridProduse.firstChild);
        });
    }

    // Setăm inițial butoanele să afișeze iconița goală
    document.querySelectorAll('.keep-button').forEach(function (button) {
        var iconElement = button.querySelector('i');
        iconElement.classList.add('bi', 'bi-pin');
    });


    // Funcția pentru toggle pin
    function togglePin(button) {
        pinProduct(button);
        filtrareProduse(); // Actualizăm vizibilitatea produselor după toggle pin
    }


    // Adăugăm ascultători de evenimente pentru butoanele de pinuire
    document.querySelectorAll('.keep-button').forEach(function (button) {
        button.addEventListener('click', function (event) {
            event.preventDefault();
            togglePin(this);
        });
    });


    function deleteProduct(button) {
        var produs = button.closest('.produs');
        produs.style.display = 'none';

        // Afisăm mesajul de filtrare dacă nu mai sunt produse vizibile
        var mesajFiltrare = document.getElementById('mesaj-filtrare');
        var produseVizibile = document.querySelectorAll('.produs:not([style*="display: none"])');
        mesajFiltrare.style.display = produseVizibile.length === 0 ? 'block' : 'none';
    }

    // Funcția pentru stergerea produsului

    document.querySelectorAll('.delete-button').forEach(function (button) {
        button.addEventListener('click', function (event) {
            event.preventDefault();
            deleteProduct(this);
        });

    });




});
