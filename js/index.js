/**
 * Fichero encargado de gestionar los eventos de todos los botones de la aplicación web.
 * Este fichero necesita ser cargado después del fichero graph.js
 *
 * @author: Jose L. Jorro-Aragoneses, Marta Caro-Martínez
 * @version: 1.0
 */

const ZOOMVALUE = 10;
const EXAMPLES_NUM = 5
 
// Array donde se almacenan todos los pasos que hace el usuario
var steps = new Array();
var currentExample = null;
var zoomValue = 1;
var selectedExplanation = null;
var my_current_example = null;

$(function() {
	// Incluimos el evento correspondiente a cada uno de los botones.
	$("#btn_ver").click(loadExample);
	$("#btn_like").click(like);
	$("#btn_dislike").click(dislike);
	$("#btn_zoom_in").click(zoomIn);
	$("#btn_zoom_out").click(zoomOut);

	// Cargamos todos los ejemplos de la carpeta data
	//loadSelect();
	
	disableSystem();
	my_current_example = 1;
	init_svg("#vis");
});

/**
 * Cargamos todos los ejemplos disponibles en el select.
 */
/*function loadSelect() {

	$.getJSON("data/examples.json", function(data) {
  		let examples = data["examples"];
  		
  		$("#options").empty();
  		
  		let options = $("#options").prop("options");
  		options[options.length] = new Option("Examples...", "", false, true);

  		$.each(examples, function(index, el) {
  			options[options.length] = new Option(el.text, el.value);
  		});

	});
	disableSystem();
}*/


/**
 * Función que carga un grafo en el elemento svg a partir de un fichero JSON.
 */
function loadExample() {
	
	// Limpiamos los pasos
	cleanSteps();
	
	// nos aseguramos de que el sistema este ON
	enableSystem();

	// Obtenemos la ruta
	// let path = "data/" + $("#options").val();
	
	if(my_current_example <= EXAMPLES_NUM){
	
		let path = "data/example" + my_current_example + "/";
		currentExample = new ExplanationsSet();

		for(var i=1; i < 6; i++) {
			var exp_path = path + "question" + i + ".json";
			let explanation = loadFile(exp_path);
			
			currentExample.addExplanation(explanation);
		}
		
		// comprobamos si la explicacion actual es la mejor a mostrar
		currentExample.checkExplanations();
		
		// si no es la mejor, cambiamos la explicacion actual por la mejor
		if(currentExample.isThereBestExplanation()) {
			currentExample.changeExplanation();
		}
		
		let currentExplanation = currentExample.getCurrentExplanation();
		
		// Get the best explanation to show
		paint_graph(currentExplanation.nodes, currentExplanation.links, true);
		loadExplanationsButtons();

		//addStep("Loaded " + $("#options option:selected").text());
		addStep("Loaded Example " + my_current_example);
		
		// desactivamos el boton para pasar a la siguiente recomendacion hasta que el usuario le de a like o dislike
		$("#btn_ver").addClass("disabledbutton");
		
	} else{ // al final se carga el formulario
		window.location.replace("https://docs.google.com/forms/d/e/1FAIpQLSfxW0qokIiW-2WCjTzCzK_ePdcjjbW_5IKeA5zGq4EbT_Jrqw/viewform?embedded=true");
	}
		
}

function loadExplanationsButtons() {

	$("#explanations_buttons").empty();

	let numButtons = currentExample.explanations.length;
	selectedExplanation = currentExample.currentExplanationIndex;

	for (var i = 0; i < numButtons; i++) {
		id = 'btn_explanation_' + (i + 1);

		html = '<button id="' 
				+ id 
				+ '" type="button" class="btn btn_example';

		if (i == selectedExplanation)
			html += ' btn-outline-primary"';
		else
			html += ' btn-outline-secondary"';

		// Añadimos los atributos del tooltip
		html += ' data-title="Best explanation!" data-palcement="bottom';
		html += ' data-delay=\'{"show":"3000", "hide":"2000"} data-trigger="manual"\'';

		html += '>Movie ' 
				+ (i+1) 
				+ '</button>';

		$("#explanations_buttons").append(html);
	}

	for (var i = 0; i < numButtons; i++) {
		let id = '#btn_explanation_' + (i + 1);
		let index = i;

		$(id).click(function(event) {
			num_explanation = index;
			currentExample.setCurrentExplanation(num_explanation);

			// Cambiamos el color de los botones
			let old_button_id = "#btn_explanation_" + (selectedExplanation + 1);
			let new_button_id = "#btn_explanation_" + (num_explanation + 1);

			$(old_button_id).removeClass("btn-outline-primary");
			$(old_button_id).addClass("btn-outline-secondary");

			if($(new_button_id).hasClass("btn-success"))
				$(new_button_id).removeClass("btn-success");
			else
				$(new_button_id).removeClass("btn-outline-secondary");
			$(new_button_id).addClass("btn-outline-primary");

			selectedExplanation = num_explanation;

			refreshRecommendation();

			addStep("Changed to recommendation " + (num_explanation + 1));
		});

	}
				
}

/**
 * Función que se encarga de obtener la explciación actual
 * y la vuelve a pintar en el grafo.
 */
function refreshRecommendation() {
	let explanation = currentExample.getCurrentExplanation();
	paint_graph(explanation.nodes, explanation.links, true);
}

/**
 * Función que carga un fichero y devuelve la explicación en forma
 * de objeto.
 * @param  String my_file ruta del fichero que se quiere cargar.
 * @return Object objeto que contiene la explicación.
 */
function loadFile(my_file){
	var result = null;
	
	$.ajax({
		async: false,
		url: my_file,
		success: function(data) {
			result = data;
		}
	});
	
	return result;
};

/*
	Function auxiliar para no permitir que el usuario siga interactuando con ese ejemplo
*/
function enableSystem(){
	$("#vis").removeClass("disabledbutton"); 
	$(".evaluateRecommendation").removeClass("disabledbutton"); 
	$("#zoomGraph").removeClass("disabledbutton");
	$("#explanations_buttons").removeClass("disabledbutton");
};


/*
	Function auxiliar para no permitir que el usuario siga interactuando con ese ejemplo
*/
function disableSystem(){
	$("#vis").addClass("disabledbutton"); 
	$(".evaluateRecommendation").addClass("disabledbutton"); 
	$("#zoomGraph").addClass("disabledbutton");
	$("#explanations_buttons").addClass("disabledbutton");
};

// Funcion auxiliar para terminar el ejemplo
function endExample(like){
	let numSteps = steps.length - 1; // -1 para que no cuente load Example
	let msg;
	if (like)
		msg = "You liked the recommendation! You have interacted " + numSteps +  " times with the system.";
	else
		msg = "You didn't like the recommendation! You have interacted " + numSteps +  " times with the system.";

	bootbox.alert({
		message: msg,
		size: "small"
	});

	addStep(msg);
	disableSystem();
	my_current_example++; // si el ejemplo es 6 -> pasar al formulario
	
	// activamos el boton para pasar al siguiente ejemplo
	$("#btn_ver").removeClass("disabledbutton");
};

/**
 * Función que ejecuta los eventos cuando ha gustado una recomendación a un usuario.
 */
function like() {
	// Añadimos la acción de "Like"
	endExample(true);
};

/**
 * Función que ejecuta los eventos cuando no ha gustado una recomendación a un usuario.
 */
function dislike() {
	// Añadimos la acción de "Dislike"
	endExample(false);
}

/**
 * Función que activa el evento "Zoom In" del grafo.
 */
function zoomIn() {
	clickedZoom(ZOOMVALUE);
}

/**
 * Función que activa el evento "Zoom Out" del grafo.
 */
function zoomOut() {
	clickedZoom(-ZOOMVALUE);
}

/**
 * Función que añade una nueva acción a la lista de pasos.
 * @param String action acción que se quiere añadir.
 */
function addStep(action) {
	steps.push(action);
	$("#steps_list").append("<li>" + action + "</li>");
}

/**
 * Función que limpia todos los pasos que se están mostrando.
 */
function cleanSteps() {
	steps = new Array();
	$("#steps_list").empty();
}

/**
 * Función que elimina un atributo de todas las explicaciones
 * que hay cargadas en currentExplanation.
 * @param  String attr atributo que se quiere eliminar.
 */
function removeAttribute(attr) {
	if (currentExample != null) {
		currentExample.removeAttribute(attr);
		
		// Compruebo si hay una mejor explicación
		if(currentExample.isThereBestExplanation()) {
			let index_rec = currentExample.bestExplanationIndex;
			let rec_botton_id = "#btn_explanation_" + (index_rec + 1);

			$(rec_botton_id).removeClass("btn-outline-secondary");
			$(rec_botton_id).addClass("btn-success");
			
			$(rec_botton_id).tooltip({
				title: "Best explanation!",
				placement: "bottom",
				delay: { "show": 700, "hide": 700 },
				trigger: "manual" 
			});

			$(rec_botton_id).tooltip('show');
			setTimeout(function(){
		      $(rec_botton_id).tooltip( 'hide' );
		    }, 6000);
		}
		
		// Vuelvo a pintar la explicación
		let currentExplanation = currentExample.getCurrentExplanation();
		
		paint_graph(currentExplanation.nodes, currentExplanation.links, false);
	} else {
		console.log("There is no example loaded.");
	}
	
}