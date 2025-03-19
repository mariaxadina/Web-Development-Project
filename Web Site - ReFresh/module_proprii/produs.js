class Produs{

    constructor({id, nume, descriere, pret, gramaj, tip_produs, calorii, brand, ingrediente, lactoza, imagine, data_adaugare}={}) {

        for(let prop in arguments[0]){
            this[prop]=arguments[0][prop]
        }

    }

}