var temps_precedent = 0;
var ventes_totales = 0;
var dernieres_ventes = {};
for(let biere in bieres){
	dernieres_ventes[biere] = 0;
}


if(localStorage.getItem("restaurer_sauvegarde")=="true"){
	var indice_courant = localStorage.getItem("indice_courant");
	var krach_en_cours = localStorage.getItem("krach_en_cours");
	var krach_indices = JSON.parse(localStorage.getItem("krach_indices"));
} else { //s'il n'y a aucune sauvegarde
	console.log("nouvelle soirée")
	var indice_courant = 0;
	var krach_en_cours = false;
	var krach_indices = [];
}

//gestion du temps :
var avant_soiree = true;
setInterval(function(){
	if(avant_soiree){
		let minutes_avant_debut = Math.round((debut_soiree - Date.now())/1000/60)
		document.getElementById('temps_restant_soiree').innerHTML = minutes_avant_debut + " min"
		if (minutes_avant_debut<0){
			avant_soiree = false
			document.getElementById('texte_temps_restant').innerHTML = "temps avant la fin de la soirée : "
		}
	}
	else {
		let minutes_avant_fin = Math.round((fin_soiree - Date.now())/1000/60)
		document.getElementById('temps_restant_soiree').innerHTML = minutes_avant_fin + " min"

		let secondes_avant_refresh = Math.round((fin_soiree - Date.now())/1000)%interval_temps
		document.getElementById('temps_restant_interval').innerHTML = secondes_avant_refresh + " s"
	
		if(secondes_avant_refresh == 0){ //on lance tous les calculs toutes les [interval_temps] secondes
			temps_precedent = Date.now();
			calcul_ventes();

			if(krach_en_cours){
				krach_indices.push(indice_courant);
			}

			for(let biere in bieres){ //c est une fausse boucle pour avoir une clé du dictionnaire
				indice_courant = bieres[biere]["prix"].length;
				console.log("indice courant : " + indice_courant)
				break;
			}

			transfert_informations();
			
			affichage_prix();
			reset_ventes();
		}
	}
}, 1*1000);


function calcul_ventes(){
	const reducer = (previousValue, currentValue) => previousValue + currentValue;
	let ventes_totales_interval = Object.values(dernieres_ventes).reduce(reducer)

	//gere la variation max en fonction du nombre de ventes totales. tend vers 80% en +inf. 10 ventes font une var max de 40%.
	let variation_max = Math.atan(ventes_totales_interval/10);
	variation_max = variation_max / (Math.PI/2) * 80;

	let minimum = Math.min(...Object.values(dernieres_ventes));
	let maximum = Math.max(...Object.values(dernieres_ventes));
	let extremum = Math.max(Math.max(maximum, -minimum), 1); //on evite la division par 0

	var ventes_centre = {} //ventes recentrées en 0
	
	var ventes_moyennes = ventes_totales_interval/nombre_bieres;

	for(let biere in dernieres_ventes){
		ventes_centre[biere] = (dernieres_ventes[biere] - ventes_moyennes) / extremum * variation_max;
	}

	calcul_prix(ventes_centre);
}

function calcul_prix(ventes_centre){
	for(let biere in ventes_centre){
		let nombre_prix_a_prendre_en_compte = Math.floor(1/bieres[biere]["volatilité"]);

		if(krach_en_cours){
			nouveau_prix = bieres[biere]["prix_krach"];
		} else {
			var nouveau_prix = 0;
			var decalage = 0;
			let compteur = 0;
			for(var ii=nombre_prix_a_prendre_en_compte; ii>0; ii--){ //gere la volatilite des prix

				while(krach_indices.includes(indice_courant - ii - decalage)){ //on compte pas les prix pendant le krach
					decalage += 1;
				}

				var prix_historique = (100 + ventes_centre[biere])/100 * bieres[biere]["prix"].at(indice_courant - ii - decalage);
				if(prix_historique){//evite le undefined
					nouveau_prix += prix_historique
					compteur += 1
				}
			}
			nouveau_prix = nouveau_prix/compteur;
		}

		bieres[biere]["prix"].push(Math.round(nouveau_prix*100)/100);
	}
}

function affichage_prix(){
	for(let i in bieres){
		let DOM_biere_prix = document.querySelector('[nom_biere="' + i + '"] .prix');
		DOM_biere_prix.innerText = bieres[i]["prix"].at(-1);
	}
}

function reset_ventes(){
	boutons_ventes_bieres.forEach(function(bouton_vente) {
		let DOM_nbr_vente = bouton_vente.querySelector(".nbr_ventes");
		DOM_nbr_vente.innerText = 0;
	});
	for(let biere in bieres){
		dernieres_ventes[biere] = 0;
	}
}

function transfert_informations(){
	localStorage.setItem("indice_courant", indice_courant);
	localStorage.setItem("krach_indices", JSON.stringify(krach_indices));
	localStorage.setItem("krach_en_cours", krach_en_cours);
	localStorage.setItem("nombre_bieres", nombre_bieres);
	localStorage.setItem("bieres", JSON.stringify(bieres));
}