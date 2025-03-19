DROP TYPE IF EXISTS categ_produse CASCADE;
DROP TYPE IF EXISTS brand_produs CASCADE;

CREATE TYPE categ_produse AS ENUM( 'fructe si legume', 'carne si peste', 'lactate si oua', 'bauturi', 'congelate','mezeluri','produse vegane', 'comuna');
CREATE TYPE brand_produs AS ENUM('Alpro', 'cristim', 'Zuzu', 'comuna','BIO','Aquatique','Perla Harghitei','Hochland','Bonduelle','Alfredo Seafood','sissi','La Provincia','Vitamin Aqua');

DROP TABLE IF EXISTS produse;

CREATE TABLE IF NOT EXISTS produse (
   id serial PRIMARY KEY,
   nume VARCHAR(50) UNIQUE NOT NULL,
   descriere TEXT,
   pret NUMERIC(8,2) NOT NULL,
   gramaj INT NOT NULL CHECK (gramaj>=0),   
   tip_produs categ_produse DEFAULT 'comuna',
   calorii INT NOT NULL CHECK (calorii>=0),
   brand brand_produs DEFAULT 'comuna',
   ingrediente VARCHAR [], 
   lactoza BOOLEAN NOT NULL DEFAULT FALSE,
   imagine VARCHAR(300),
   data_adaugare TIMESTAMP DEFAULT current_timestamp
);

INSERT into produse (nume, descriere, pret, gramaj, tip_produs, calorii, brand, ingrediente, lactoza, imagine) VALUES 
('Lapte de soia', 'Lapte vegetal', 10.5 , 1, 'lactate si oua', 100,  'Alpro', '{"soia", "apa"}', False, 'alpro-lapte-soia.jpg'),
('Lapte de vaca', 'Lapte', 6 , 1, 'lactate si oua', 110,  'Zuzu', '{"lapte de vaca", "corector de aciditate"}', True, 'zuzu-lapte.jpg');

INSERT into produse (nume, descriere, pret, gramaj, tip_produs, calorii, brand, ingrediente, lactoza, imagine) VALUES 
('Oua BIO', 'Oua proaspete de la gaini crescute la sol.', 13.5 , 63, 'lactate si oua', 250,  'BIO', '{"oua"}', False, '6oua.jpg'),
('Aquatique apa plata', 'Apa plata minerala de izvor', 8 , 5000, 'bauturi', 0,  'Aquatique', '{"apa"}', False, 'aquatique5l.jpg'),
('Ardei Gras Rosu', 'Ardei gras rosu BIO - producatori locali.', 5.6 , 70, 'fructe si legume', 30,  'BIO', '{"ardei"}', False, 'ardei.jpg'),
('Cascaval Hochland', 'Oascaval din lapte de vaca.', 17 , 300, 'lactate si oua', 250,  'Hochland', '{"lapte de vaca", "sare", "corector de aciditate", "apa"}', True, '6oua.jpg'),
('Mazare Congelata Bonduelle', 'Mazare congelata si semi preparata', 7 , 250, 'congelate', 10,  'Bonduelle', '{"mazare"}', False, 'mazare-congelata.jpg'),
('Mere Rosii BIO', 'Mere rosii de la producatori locali.', 11 , 40, 'fructe si legume', 50,  'BIO', '{"mere"}', False, 'mere-rosii.jpg'),
('Morcovi BIO', 'Morcovi BIO de la producatori locali.', 4 , 100, 'lactate si oua', 50,  'BIO', '{"morcovi"}', False, 'morcovi.jpg'),
('Mere Verzi BIO', 'Mere verzi de la producatori locali.', 11 , 40, 'fructe si legume', 50,  'BIO', '{"mere"}', False, 'mere-verzi.jpg'),
('Mix de legume mexican Bonduelle', 'Mix de legume.', 6 , 40, 'fructe si legume', 50,  'BIO', '{"porumb", "fasole rosie","morcov","mazare"}', False, 'mix-mexican-congelat.jpg'),
('Piersici BIO', 'Piersici de la producatori locali.', 12.4 , 40, 'fructe si legume', 50,  'BIO', '{"piersici"}', False, 'piersici.jpg'),
('Perla Harghitei apa plata', 'Apa plata minerala de izvor', 8 , 5000, 'bauturi', 0,  'Perla Harghitei', '{"apa"}', False, 'perla5l.jpg'),
('Somon file Alfredo Seafood', 'Somon file.', 30 , 250, 'carne si peste', 100,  'Alfredo Seafood', '{"somon"}', False, 'somon.jpg'),
('Trio Mix CrisTim', 'Salam mix trio.', 18 , 300, 'mezeluri', 300,  'cristim', '{"carne de vita","carne de pui", "carne de porc", "sare","grasime"}', False, 'cris-tim.jpg'),
('Zucchini', 'Zucchini BIO - producatori locali.', 5 , 70, 'fructe si legume', 30,  'BIO', '{"zucchini"}', False, 'zucchini.jpg'),
('Vitamin Aqua B+', 'Apa cu vitamine', 6 , 500, 'bauturi', 120,  'Vitamin Aqua', '{"apa","complex vitamine","stevia"}', False, 'vitaminbplus.jpg'),
('Vitamin Aqua MG', 'Apa cu vitamine', 6 , 500, 'bauturi', 120,  'Vitamin Aqua', '{"apa","complex vitamine","stevia"}', False, 'vitaminmg.jpg'),
('Pulpe de pui La Provincia', 'Pulpe de pui.', 25 , 500, 'carne si peste', 340,  'La Provincia', '{"pulpe de pui"}', False, 'piept-de-pui.jpg'),
('Salam Sinaia', 'Salam de calitate superioara.', 13 , 250, 'mezeluri', 200,  'cristim', '{"carne de porc","carne de vita","sare"}', False, 'salam-sinaia.jpg'),
('Muschi File', 'Muschi file afumat.', 10 , 120, 'mezeluri', 200,  'sissi', '{"carne de porc"}', False, 'muschi-file.jpg');
