
const express = require("express");
const fs= require('fs');
const path=require('path');
const sharp=require('sharp');
const sass=require('sass');
const cron = require('node-cron');
const ejs=require('ejs');
const formidable=require("formidable");
const session=require('express-session');
const AccesBD= require("./module_proprii/accesbd.js");
const {Utilizator}=require("./module_proprii/utilizator.js")
const Drepturi = require("./module_proprii/drepturi.js");
const xmljs=require('xml-js');
const { MongoClient } = require("mongodb");



const Client = require('pg').Client;


var client= new Client({database:"cti_2024",
        user:"maria",
        password:"mariaadina#22",
        host:"localhost",
        port:5432});
client.connect();

obGlobal ={
    obErori:null,
    obImagini:null,
    folderScss:path.join(__dirname,"resurse/scss"),
    folderCss:path.join(__dirname,"resurse/css"),
    folderBackup:path.join(__dirname,"backup"),
    optiuniMeniu:[],
    protocol:"http://",
    numeDomeniu:"localhost:8080",
}

const uri = "mongodb://localhost:27017";
obGlobal.clientMongo = new MongoClient(uri);
obGlobal.bdMongo = obGlobal.clientMongo.db('proiect_web');
client.query("select * from produse",function(err,rez){
    console.log(rez);
})

client.query("select * from unnest(enum_range(null::categ_produse))", function(err, rezCategorie){
    if (err){
        console.log(err);
    }
    else{
        obGlobal.optiuniMeniu=rezCategorie.rows;
    }
});

vect_foldere = ["temp", "temp1", "backup", "poze_uploadate"]
for (let folder of vect_foldere) {
    let caleFolder = path.join(__dirname, folder);
    if (!fs.existsSync(caleFolder))
        fs.mkdirSync(caleFolder);
}

app= express();

app.use(session({ // aici se creeaza proprietatea session a requestului (pot folosi req.session)
    secret: 'abcdefg',//folosit de express session pentru criptarea id-ului de sesiune
    resave: true,
    saveUninitialized: false
  }));

console.log("TW", __dirname);
console.log("C:\Users\Maria\Documents\CTI materiale\Anul II, sem II\Tehnici WEB\TW", __filename);
console.log("TW", process.cwd());
 
app.set("view engine","ejs");
 
app.use("/resurse", express.static(path.join(__dirname,"/resurse")));
app.use("/node_modules", express.static(__dirname+"/node_modules"));
app.use("/poze_uploadate", express.static(__dirname+"/poze_uploadate"));

app.use(express.static(__dirname));

// app.get("/", function(req, res){
//     res.sendFile(__dirname+"/index.html")
// })
// --------------------------utilizatori online ------------------------------------------


function getIp(req){//pentru Heroku/Render
    var ip = req.headers["x-forwarded-for"];//ip-ul userului pentru care este forwardat mesajul
    if (ip){
        let vect=ip.split(",");
        return vect[vect.length-1];
    }
    else if (req.ip){
        return req.ip;
    }
    else{
     return req.connection.remoteAddress;
    }
}


app.all("/*",function(req,res,next){
    let ipReq=getIp(req);
    if (ipReq){ 
        var id_utiliz=req?.session?.utilizator?.id;
        id_utiliz=id_utiliz?id_utiliz:null;
        //console.log("id_utiliz", id_utiliz);
        // TO DO comanda insert (folosind AccesBD) cu  ip, user_id, pagina(url  din request)
        var obiectCerere;
        if(id_utiliz){
            obiectCerere={
                ip: ipReq,
                user_id:id_utiliz,
                pagina: req.url
            }
        }
        else{
            obiectCerere={
                ip: ipReq,
                pagina: req.url
            }
        }
        AccesBD.getInstanta().insert({
            tabel:"accesari",
            campuri:obiectCerere
        }, function(err, rez){
            if (err){
                console.log(err)
            }
        })
    }
    next(); 
});



function stergeAccesariVechi(){
    AccesBD.getInstanta().delete({
        tabel:"accesari",
        conditiiAnd:["now() - data_accesare >= interval '10 minutes' "]}, 
        function(err, rez){
            console.log(err);
        })
}
stergeAccesariVechi();
setInterval(stergeAccesariVechi, 10*60*1000);


async function obtineUtilizatoriOnline(){
    try{
        var rez = await client.query("select username, nume, prenume from utilizatori where id in (select distinct user_id from accesari where now()-data_accesare <= interval '5 minutes')");
            console.log(rez.rows);
            return rez.rows
        } catch (err) {
            console.error(err);
            return []
        }
}
//////////////////////////////////////////////////////////////////
// trimiterea unui mesaj fix
app.get("/cerere", function(req, res){
    res.send("<b>Hello</b> <span style='color:red'>world!</span>");

})

//trimiterea unui mesaj dinamic
app.get("/data", function(req, res, next){
    res.write("Data: ");
    next();
});
app.get("/data", function(req, res){
    res.write(""+new Date());
    res.end();

});

app.get(["/","/home","/index"], function(req, res){
    res.render("pagini/index", {ip: req.ip, imagini:obGlobal.obImagini.imagini});
})
app.get(["/","/home","/index"],  async function(req, res){
   
    res.render("pagini/index", {
        ip: req.ip, 
        imagini:obGlobal.obImagini.imagini, 
        useriOnline:await obtineUtilizatoriOnline(),
        locatie:await obtineLocatie(),
        evenimente: genereazaEvenimente()
    });
})
/*
/////preluarea de produse in index
async function getRandomProductIds() {
    try {
        const result = await client.query('SELECT id FROM produse ORDER BY RANDOM() LIMIT 5');
        return result.rows.map(row => row.id);
    } catch (err) {
        console.error('Eroare la preluarea ID-urilor aleatoare:', err);
        throw err;
    }
}

function startFetchingRandomIds() {
    setInterval(async () => {
        try {
            const randomIds = await getRandomProductIds();
            console.log('ID-uri aleatoare:', randomIds);
            // Aici poți să faci ce dorești cu aceste ID-uri, cum ar fi să le trimiți către client prin WebSocket, să le salvezi într-o variabilă globală, etc.
        } catch (err) {
            console.error('Eroare în timpul preluării periodice:', err);
        }
    }, 15000); // 15 secunde
}

startFetchingRandomIds();

app.get(["/", "/home", "/index"], async (req, res) => {
    try {
        const productIds = await getRandomProductIds();
        const products = await getProductsByIds(productIds);
        res.render("pagini/index", { produseCarusel: products }); // Transmitem produsele ca variabilă în șablonul EJS
    } catch (err) {
        console.error('Eroare la preluarea datelor din baza de date:', err);
        res.status(500).send('Eroare internă a serverului');
    }
});

*/
//////////////
app.get('/retete', function(req, res) {
    // Renderează pagina "retete.ejs" și trimite-o către client
    res.render('pagini/retete');
})

app.get('/inregistrare', function(req, res) {
    // Renderează pagina "retete.ejs" și trimite-o către client
    res.render('pagini/inregistrare');
})

app.get('/galerie', function(req, res) {
    res.render('pagini/galerie', { imagini:obGlobal.obImagini.imagini});
})



app.get('/contact', function(req, res) {
    // Renderează pagina "retete.ejs" și trimite-o către client
    res.render('pagini/contact');
});
app.get('/cos-virtual', function(req, res) {
    // Renderează pagina "retete.ejs" și trimite-o către client
    res.render('pagini/cos-virtual');
});

app.get("/favicon.ico", function(req, res){
    res.sendFile(path.join(__dirname,"resurse/imagini/ico/favicon.ico"));
    
});

//----------------GALERIE ANIMATA-----------
function getRandomFromSet() {
    const set = [2, 4, 8, 16];
    return set[Math.floor(Math.random() * set.length)];
}

app.get("/galerieanimata", function (req, res) {
    let nrImagini = getRandomFromSet(); // Selectează un număr de imagini din mulțimea {2, 4, 8, 16}

    let fisScss = path.join(__dirname, "resurse/scss/galerie-animata.scss");
    let liniiFisScss = fs.readFileSync(fisScss).toString().split('\n');

    let stringImg = "$nrImg: " + nrImagini + ";";
    liniiFisScss.shift();
    liniiFisScss.unshift(stringImg);
    fs.writeFileSync(fisScss, liniiFisScss.join('\n'));

    res.render("pagini/galerieanimata", { imagini: obGlobal.obImagini.imagini, nrImagini: nrImagini });
});
// ------------------------- PRODUSE ----------------------

app.get("/produse", function(req, res){
    console.log(req.query)
    var conditieQuery="";
    if (req.query.tip){
        conditieQuery=` where tip_produs='${req.query.tip}'`

        if (req.query.tip === 'mezeluri') {
            pagina = "pagini/produse_mezeluri";
        }
    }
    client.query("select * from unnest(enum_range(null::categ_produse))", function(err, rezOptiuni){

        client.query(`select * from produse ${conditieQuery}`, function(err, rez){
            if (err){
                console.log(err);
                afisareEroare(res, 2);
            }
            else{
                res.render("pagini/produse", {produse: rez.rows, optiuni:rezOptiuni.rows})
            }
        })
    });
})


// Route pentru afișarea unui produs specific după id
app.get("/produs/:id", function(req, res){
    client.query(`SELECT * FROM produse WHERE id=${req.params.id}`, function(err, rezProdus){
        if(err){
            console.log(err);
            afisareEroare(res, 2);
        }
        else{
            const produs = rezProdus.rows[0];
            
            client.query(`SELECT * FROM produse WHERE tip_produs='${produs.tip_produs}' AND id <> ${req.params.id}`, function(err, rezProduseSimilare){
                if(err){
                    console.log(err);
                    afisareEroare(res, 2);
                }
                else{
                    const produseSimilare = rezProduseSimilare.rows;
                    res.render("pagini/produs", { prod: produs, produseSimilare: produseSimilare });
                }
            });
        }
    });
});



// ------------------------- UTILIZATORI ----------------------
app.post("/inregistrare",function(req, res){
    var username;
    var poza;
    var formular= new formidable.IncomingForm()
    formular.parse(req, function(err, campuriText, campuriFisier ){//4
        console.log("Inregistrare:",campuriText);


        console.log(campuriFisier);
        console.log(poza, username);
        var eroare="";


        // TO DO var utilizNou = creare utilizator
        var utilizNou =new Utilizator();
        try{
            utilizNou.setareNume=campuriText.nume[0];
            utilizNou.setareUsername=campuriText.username[0];
            utilizNou.email=campuriText.email[0]
            utilizNou.prenume=campuriText.prenume[0]
           
            utilizNou.parola=campuriText.parola[0];
            utilizNou.culoare_chat=campuriText.culoare_chat[0];
            utilizNou.poza= poza;
            Utilizator.getUtilizDupaUsername(campuriText.username[0], {}, function(u, parametru ,eroareUser ){
                if (eroareUser==-1){//nu exista username-ul in BD
                    //TO DO salveaza utilizator
                    utilizNou.salvareUtilizator()
                }
                else{
                    eroare+="Mai exista username-ul";
                }


                if(!eroare){
                    res.render("pagini/inregistrare", {raspuns:"Inregistrare cu succes!"})
                   
                }
                else
                    res.render("pagini/inregistrare", {err: "Eroare: "+eroare});
            })
           


        }
        catch(e){
            console.log(e);
            eroare+= "Eroare site; reveniti mai tarziu";
            console.log(eroare);
            res.render("pagini/inregistrare", {err: "Eroare: "+eroare})
        }
   

    });
    formular.on("field", function(nume,val){  // 1
   
        console.log(`--- ${nume}=${val}`);
       
        if(nume=="username")
            username=val;
    })
    formular.on("fileBegin", function(nume,fisier){ //2
        console.log("fileBegin");
       
        console.log(nume,fisier);
        //TO DO adaugam folderul poze_uploadate ca static si sa fie creat de aplicatie
        //TO DO in folderul poze_uploadate facem folder cu numele utilizatorului (variabila folderUser)
        var folderUser=path.join(__dirname, "poze_uploadate", username);
        if (!fs.existsSync(folderUser))
            fs.mkdirSync(folderUser)
       
        fisier.filepath=path.join(folderUser, fisier.originalFilename)
        poza=fisier.originalFilename;
        //fisier.filepath=folderUser+"/"+fisier.originalFilename
        console.log("fileBegin:",poza)
        console.log("fileBegin, fisier:",fisier)


    })    
    formular.on("file", function(nume,fisier){//3
        console.log("file");
        console.log(nume,fisier);
    });
});


app.post("/login",function(req, res){
    /*TO DO
        testam daca a confirmat mailul
    */
    var username;
    console.log("ceva");
    var formular= new formidable.IncomingForm()
    

    formular.parse(req, function(err, campuriText, campuriFisier ){
        var parametriCallback= {
            req:req,
            res:res,
            parola: campuriText.parola[0]
        }
        Utilizator.getUtilizDupaUsername (campuriText.username[0],parametriCallback, 
            function(u, obparam, eroare ){ //proceseazaUtiliz
            let parolaCriptata=Utilizator.criptareParola(obparam.parola)
            if(u.parola== parolaCriptata && u.confirmat_mail){
                u.poza=u.poza?path.join("poze_uploadate",u.username, u.poza):"";
                obparam.req.session.utilizator=u;               
                obparam.req.session.mesajLogin="Bravo! Te-ai logat!";
                obparam.res.redirect("/index");
                
            }
            else{
                console.log("Eroare logare")
                obparam.req.session.mesajLogin="Date logare incorecte sau nu a fost confirmat mailul!";
                obparam.res.redirect("/index");
            }
        })
    });
    
});

//http://${Utilizator.numeDomeniu}/cod/${utiliz.username}/${token}
app.get("/cod/:username/:token",function(req,res){
    /*TO DO parametriCallback: cu proprietatile: request (req) si token (luat din parametrii cererii)
        setat parametriCerere pentru a verifica daca tokenul corespunde userului
    */
    console.log(req.params);
    
    try {
        var parametriCallback= {
            req:req,
            token:req.params.token
        }
        Utilizator.getUtilizDupaUsername(req.params.username,parametriCallback ,function(u,obparam){
            let parametriCerere={
                tabel:"utilizatori",
                campuri:{confirmat_mail:true},
                conditiiAnd:[`id=${u.id}`]
            };
            AccesBD.getInstanta().update(
                parametriCerere, 
                function (err, rezUpdate){
                    if(err || rezUpdate.rowCount==0){
                        console.log("Cod:", err);
                        afisareEroare(res,3);
                    }
                    else{
                        res.render("pagini/confirmare.ejs");
                    }
                })
        })
    }
    catch (e){
        console.log(e);
        afisareEroare(res,2);
    }
})

app.get("/logout", function(req, res){
    req.session.destroy();
    res.locals.utilizator=null;
    res.render("pagini/logout");
});


//http://${Utilizator.numeDomeniu}/cod/${utiliz.username}/${token}
app.get("/cod/:username/:token",function(req,res){
    /*TO DO parametriCallback: cu proprietatile: request (req) si token (luat din parametrii cererii)
        setat parametriCerere pentru a verifica daca tokenul corespunde userului
    */
    console.log(req.params);

    try {
        var parametriCallback={
            req:req,
            token:req.params.token
        }
        Utilizator.getUtilizDupaUsername(req.params.username,parametriCallback ,function(u,obparam){
            let parametriCerere={
                tabel:"utilizatori",
                campuri:{confirmat_mail:true},
                conditiiAnd:[`id=${u.id}`]
            };
            AccesBD.getInstanta().update(
                parametriCerere, 
                function (err, rezUpdate){
                    if(err || rezUpdate.rowCount==0){
                        console.log("Cod:", err);
                        afisareEroare(res,3);
                    }
                    else{
                        res.render("pagini/confirmare.ejs");
                    }
                })
        })
    }
    catch (e){
        console.log(e);
        afisareEroare(res,2);
    }
})



app.post("/profil", function(req, res){
    console.log("profil");
    if (!req.session.utilizator){
        afisareEroare(res,403)
        return;
    }
    var formular= new formidable.IncomingForm();
 
    formular.parse(req,function(err, campuriText, campuriFile){
       
        var parolaCriptata=Utilizator.criptareParola(campuriText.parola[0]);
 
        AccesBD.getInstanta().updateParametrizat(
            {tabel:"utilizatori",
            campuri:["nume","prenume","email","culoare_chat"],
            valori:[
                `${campuriText.nume[0]}`,
                `${campuriText.prenume[0]}`,
                `${campuriText.email[0]}`,
                `${campuriText.culoare_chat[0]}`],
            conditiiAnd:[
                `parola='${parolaCriptata}'`,
                `username='${campuriText.username[0]}'`
            ]
        },          
        function(err, rez){
            if(err){
                console.log(err);
                afisareEroare(res,2);
                return;
            }
            console.log(rez.rowCount);
            if (rez.rowCount==0){
                res.render("pagini/profil",{mesaj:"Update-ul nu s-a realizat. Verificati parola introdusa."});
                return;
            }
            else{            
                //actualizare sesiune
                console.log("ceva");
                req.session.utilizator.nume= campuriText.nume[0];
                req.session.utilizator.prenume= campuriText.prenume[0];
                req.session.utilizator.email= campuriText.email[0];
                req.session.utilizator.culoare_chat= campuriText.culoare_chat[0];
                res.locals.utilizator=req.session.utilizator;
            }
 
 
            res.render("pagini/profil",{mesaj:"Update-ul s-a realizat cu succes."});
 
        });
       
 
    });
});




app.get("/useri", function(req, res){
    /* TO DO
    * in if testam daca utilizatorul din sesiune are dreptul sa vizualizeze utilizatori
    * completam obiectComanda cu parametrii comenzii select pentru a prelua toti utilizatorii
    */
    if(req?.utilizator?.areDreptul(Drepturi.vizualizareUtilizatori)){
        var obiectComanda={
            tabel:"utilizatori",
            campuri:["*"],
            conditiiAnd:[]
        };
        AccesBD.getInstanta().select(obiectComanda, function(err, rezQuery){
            console.log(err);
            res.render("pagini/useri", {useri: rezQuery.rows});
        });
        
    }
    else{
        afisareEroare(res, 403);
    }
    
});



// async function f(){
//     console.log(1);
//     return 100;
// }


// rez = await f();



app.post("/sterge_utiliz",  function(req, res){

    /* TO DO
    * in if testam daca utilizatorul din sesiune are dreptul sa stearga utilizatori
    * completam obiectComanda cu parametrii comenzii select pentru a prelua toti utilizatorii
    */
    if(req?.utilizator?.areDreptul(Drepturi.stergereUtilizatori)){
        var formular= new formidable.IncomingForm();
 
        formular.parse(req,function(err, campuriText, campuriFile){
                var obiectComanda= {
                    tabel:"utilizatori",
                    conditiiAnd:[`id=${campuriText.id_utiliz[0]}`]
                }
                AccesBD.getInstanta().delete(obiectComanda, function(err, rezQuery){
                console.log(err);
                res.redirect("/useri");
            });
        });
    }else{
        afisareEroare(res,403);
    }
    
})
//------------------------altele--------------------

app.get("/suma/:a/:b", function(req, res){
    var suma=parseInt(req.params.a)+parseInt(req.params.b)
    res.send(""+suma);

}); 
 
app.get("/*.ejs", function (req, res) {
    afisareEroare(res, 400);
});

app.get(new RegExp("^\/[A-Za-z\/0-9]*\/$"), function(req, res){
    afisareEroare(res,403);
    
});


app.get("/*", function(req, res){
    //console.log(req.url)
    try {
        res.render("pagini"+req.url, function(err, rezHtml){
            // console.log(rezHtml);
            // console.log("Eroare:"+err)

                if (err){
                    if (err.message.startsWith("Failed to lookup view")){
                        afisareEroare(res,404);
                        console.log("Nu a gasit pagina: ", req.url)
                    }
                    
                }
                else {
                    res.send(rezHtml+"")
                }

            
        });         
    }
    catch (err1){
        if (err1.message.startsWith("Cannot find module")){
            afisareEroare(res,404);
            console.log("Nu a gasit resursa: ", req.url)
        }
        else{
            afisareEroare(res);
            console.log("Eroare:"+err1)
        }
    }

});
 
function initErori(){
    var continut= fs.readFileSync(path.join(__dirname,"resurse/json/erori.json")).toString("utf-8");
    console.log(continut);
    
    obGlobal.obErori=JSON.parse(continut);
    for (let eroare of obGlobal.obErori.info_erori){
        eroare.imagine=path.join(obGlobal.obErori.cale_baza,eroare.imagine)
    }
    obGlobal.obErori.eroare_default=path.join(obGlobal.obErori.cale_baza,obGlobal.obErori.eroare_default.imagine)
    console.log(obGlobal.obErori);

} 
initErori()


function afisareEroare(res, _identificator, _titlu, _text, _imagine){
    let eroare=obGlobal.obErori.info_erori.find(
        function(elem){
            return elem.identificator==_identificator
        }
    )
    if(!eroare) {
        let eroare_default = obGlobal.ofErori.eroare_default;
        res.render("pagini/eroare", {
            titlu: _titlu || eroare_default.titlu ,
            text: _text || eroare_default.text,
            imagine: _imagine || eroare_default.imagine
        })
    }
    else {
        if(eroare.status)
        res.status(eroare.identificator)
        res.render("pagini/eroare", {
            titlu: _titlu || eroare.titlu ,
            text: _text || eroare.text,
            imagine: _imagine || eroare.imagine
        })
    }
}

function initImagini(){
    var continut= fs.readFileSync(path.join(__dirname,"resurse/json/galerie.json")).toString("utf-8");

    obGlobal.obImagini=JSON.parse(continut);
    let vImagini=obGlobal.obImagini.imagini;

    let caleAbs=path.join(__dirname,obGlobal.obImagini.cale_galerie);
    let caleAbsMediu=path.join(__dirname,obGlobal.obImagini.cale_galerie, "mediu");
    if (!fs.existsSync(caleAbsMediu))
        fs.mkdirSync(caleAbsMediu);

    //for (let i=0; i< vErori.length; i++ )

        let numarImaginiAfisate = vImagini.length;
        numarImaginiAfisate -= numarImaginiAfisate % 3;
        vImagini = vImagini.slice(0, numarImaginiAfisate);
        
    for (let imag of vImagini){
        [numeFis, ext]=imag.cale_relativa.split(".");
        let caleFisAbs=path.join(caleAbs,imag.cale_relativa);
        let caleFisMediuAbs=path.join(caleAbsMediu, numeFis+".webp");
        sharp(caleFisAbs).resize(300).toFile(caleFisMediuAbs);
        imag.fisier_mediu=path.join("/", obGlobal.obImagini.cale_galerie, "mediu",numeFis+".webp" )
        imag.fisier=path.join("/", obGlobal.obImagini.cale_galerie, imag.cale_relativa )
        
    }
    console.log(obGlobal.obImagini)
}
initImagini();

//////////////////////////SASS////////////////

function compileazaScss(caleScss, caleCss){
    console.log("cale:",caleCss);
    if(!caleCss){

        let numeFisExt=path.basename(caleScss);
        let numeFis=numeFisExt.split(".")[0]   /// "a.scss"  -> ["a","scss"]
        caleCss=numeFis+".css";
    }
    
    if (!path.isAbsolute(caleScss))
        caleScss=path.join(obGlobal.folderScss,caleScss )
    if (!path.isAbsolute(caleCss))
        caleCss=path.join(obGlobal.folderCss,caleCss )
    

    let caleBackup=path.join(obGlobal.folderBackup, "resurse/css");
    if (!fs.existsSync(caleBackup)) {
        fs.mkdirSync(caleBackup,{recursive:true})
    }
    
    // la acest punct avem cai absolute in caleScss si  caleCss

    let numeFisCss=path.basename(caleCss);
    if (fs.existsSync(caleCss)){
        fs.copyFileSync(caleCss, path.join(obGlobal.folderBackup, "resurse/css",numeFisCss ))// +(new Date()).getTime()
    }
    rez=sass.compile(caleScss, {"sourceMap":true});
    fs.writeFileSync(caleCss,rez.css)
    //console.log("Compilare SCSS",rez);
}
//compileazaScss("a.scss");
vFisiere=fs.readdirSync(obGlobal.folderScss);
for( let numeFis of vFisiere ){
    if (path.extname(numeFis)==".scss"){
        compileazaScss(numeFis);
    }
}


fs.watch(obGlobal.folderScss, function(eveniment, numeFis){
    console.log(eveniment, numeFis);
    if (eveniment=="change" || eveniment=="rename"){
        let caleCompleta=path.join(obGlobal.folderScss, numeFis);
        if (fs.existsSync(caleCompleta)){
            compileazaScss(caleCompleta);
        }
    }
})


//--------------------------------------locatie---------------------------------------
async function obtineLocatie() {
    try {
        const response = await fetch('https://secure.geobytes.com/GetCityDetails?key=7c756203dbb38590a66e01a5a3e1ad96&fqcn=109.99.96.15');
        const obiectLocatie = await response.json();
        console.log(obiectLocatie);
        locatie=obiectLocatie.geobytescountry+" "+obiectLocatie.geobytesregion
        return locatie
    } catch(error) {
        console.error(error);
    }
}
/*
async function obitienUtilizatoriOnline(){
    try{
        var rez = await client.quiery("select username, nume, prenume from utilizatori where id in (select distinct user_id from accesari where now()-data_accesare <=interval '5 minute')")
        console.log(rez.rows);
        return rez.rows
    }catch(err) {
        console.error(err);
        return[]
    }
}
*/
app.get(["/","/home","/index"],  async function(req, res){
   
    res.render("pagini/index", {
        ip: req.ip, 
        imagini:obGlobal.obImagini.imagini, 
        useriOnline:await obtineUtilizatoriOnline(),
        locatie:await obtineLocatie(),
        evenimente: genereazaEvenimente()
    });
})
//////////////////EVENIMENTE//////////////
function genereazaEvenimente(){
    var evenimente=[]
    var texteEvenimente=["Eveniment important", "Festivitate", "Prajituri gratis", "Zi cu soare", "Aniversare"];
    var dataCurenta=new Date();
    for(i=0;i<texteEvenimente.length;i++){
        evenimente.push({
            data: new Date(dataCurenta.getFullYear(), dataCurenta.getMonth(), Math.ceil(Math.random()*27) ), 
            text:texteEvenimente[i]
        });
    }
    return evenimente;
}

////////////////////////FACTURI//////////////////
/*
function insereazaFactura(req,rezultatRanduri){
    rezultatRanduri.rows.forEach(function (elem){ elem.cantitate=1});
    let jsonFactura= {
        data: new Date(),
        username: req.session.utilizator.username,
        produse:rezultatRanduri.rows
    }
    console.log("JSON factura", jsonFactura)
    if(obGlobal.bdMongo){
        obGlobal.bdMongo.collection("facturi").insertOne(jsonFactura, function (err, rezmongo){
            if (err) console.log(err)
            else console.log ("Am inserat factura in mongodb");

            obGlobal.bdMongo.collection("facturi").find({}).toArray(
                function (err, rezInserare){
                    if (err) console.log(err)
                    else console.log (rezInserare);
            })
        })
    }
}
async function afisFacturi(){
    const facturi = database.collection('facturi');
    const query = { username: 'prof67195' };
    const factura = await facturi.findOne(query);
    console.log("Factura:",factura);
}
afisFacturi()
*/
/////////////////// CONTACT////////////////////////


app.use(["/contact"], express.urlencoded({extended:true}));

caleXMLMesaje="resurse/xml/contact.xml";
headerXML=`<?xml version="1.0" encoding="utf-8"?>`;
function creeazaXMlContactDacaNuExista(){
    if (!fs.existsSync(caleXMLMesaje)){
        let initXML={
            "declaration":{
                "attributes":{
                    "version": "1.0",
                    "encoding": "utf-8"
                }
            },
            "elements": [
                {
                    "type": "element",
                    "name":"contact",
                    "elements": [
                        {
                            "type": "element",
                            "name":"mesaje",
                            "elements":[]                            
                        }
                    ]
                }
            ]
        }
        let sirXml=xmljs.js2xml(initXML,{compact:false, spaces:4});//obtin sirul xml (cu taguri)
        console.log(sirXml);
        fs.writeFileSync(caleXMLMesaje,sirXml);
        return false; //l-a creat
    }
    return true; //nu l-a creat acum
}


function parseazaMesaje(){
    let existaInainte=creeazaXMlContactDacaNuExista();
    let mesajeXml=[];
    let obJson;
    if (existaInainte){
        let sirXML=fs.readFileSync(caleXMLMesaje, 'utf8');
        obJson=xmljs.xml2js(sirXML,{compact:false, spaces:4});
        

        let elementMesaje=obJson.elements[0].elements.find(function(el){
                return el.name=="mesaje"
            });
        let vectElementeMesaj=elementMesaje.elements?elementMesaje.elements:[];// conditie ? val_true: val_false
        console.log("Mesaje: ",obJson.elements[0].elements.find(function(el){
            return el.name=="mesaje"
        }))
        let mesajeXml=vectElementeMesaj.filter(function(el){return el.name=="mesaj"});
        return [obJson, elementMesaje,mesajeXml];
    }
    return [obJson,[],[]];
}


app.get("/contact", function(req, res){
    let obJson, elementMesaje, mesajeXml;
    [obJson, elementMesaje, mesajeXml] =parseazaMesaje();

    res.render("pagini/contact",{ utilizator:req.session.utilizator, mesaje:mesajeXml})
});

app.post("/contact", function(req, res){
    let obJson, elementMesaje, mesajeXml;
    [obJson, elementMesaje, mesajeXml] =parseazaMesaje();
        
    let u= req.session.utilizator?req.session.utilizator.username:"anonim";
    let mesajNou={
        type:"element", 
        name:"mesaj", 
        attributes:{
            username:u, 
            data:new Date()
        },
        elements:[{type:"text", "text":req.body.mesaj}]
    };
    if(elementMesaje.elements)
        elementMesaje.elements.push(mesajNou);
    else 
        elementMesaje.elements=[mesajNou];
    console.log(elementMesaje.elements);
    let sirXml=xmljs.js2xml(obJson,{compact:false, spaces:4});
    console.log("XML: ",sirXml);
    fs.writeFileSync("resurse/xml/contact.xml",sirXml);
    
    res.render("pagini/contact",{ utilizator:req.session.utilizator, mesaje:elementMesaje.elements})
});


// Funcția care șterge fișierele .css de backup mai vechi de 3 ore
function stergeBackupuriVechi(folderBackup, intervalMinute) {
    const caleBackup = path.join(__dirname, folderBackup, 'resurse', 'css');
    const intervalMs = intervalMinute * 60 * 1000;

    console.log(`Verificarea folderului: ${caleBackup}`);
    
    // Obține lista tuturor fișierelor din folderul de backup
    fs.readdir(caleBackup, (err, files) => {
        if (err) {
            console.error('Eroare la citirea folderului de backup:', err);
            return;
        }

        if (files.length === 0) {
            console.log('Nu există fișiere în folderul de backup.');
            return;
        }

        console.log(`Fișiere găsite: ${files}`);

        files.forEach(file => {
            const caleFisier = path.join(caleBackup, file);

            console.log(`Verificarea fișierului: ${caleFisier}`);

            // Verifică dacă este un fișier .css
            if (path.extname(caleFisier) === '.css') {
                console.log(`Fișierul ${file} este un fișier .css`);

                // Obține informațiile despre fișier
                fs.stat(caleFisier, (err, stats) => {
                    if (err) {
                        console.error('Eroare la obținerea informațiilor despre fișier:', err);
                        return;
                    }

                    const now = Date.now();
                    const creationTime = new Date(stats.ctime).getTime();
                    const age = now - creationTime;

                    // Șterge fișierul dacă este mai vechi de intervalul specificat
                    if (age > intervalMs) {
                        fs.unlink(caleFisier, (err) => {
                            if (err) {
                                console.error('Eroare la ștergerea fișierului:', err);
                            } else {
                                console.log(`Fișierul ${file} a fost șters.`);
                            }
                        });
                    } else {
                        console.log(`Fișierul ${file} nu este suficient de vechi pentru a fi șters.`);
                    }
                });
            } else {
                console.log(`Fișierul ${file} nu este un fișier .css.`);
            }
        });
    });
}
// Programarea sarcinii cron pentru a rula la fiecare 5 minute
cron.schedule('*/1 * * * *', () => {
    console.log('Rularea funcției de curățare a backup-urilor');
    stergeBackupuriVechi('backup', 180);
});

//afisare imagini in functie de ora
//const currentHour = currentDate.getHours();
app.listen(8080);
console.log("Serverul a pornit.");