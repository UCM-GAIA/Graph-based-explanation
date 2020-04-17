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
var graph_history = new Array();

const URL_ENCUESTA = "http://localhost:8000/server/explanations.php";

$(function() {
	// Incluimos el evento correspondiente a cada uno de los botones.
	$("#btn_ver").click(loadExample);
	$("#btn_like").click(like);
	$("#btn_dislike").click(dislike);
	$("#btn_zoom_in").click(zoomIn);
	$("#btn_zoom_out").click(zoomOut);
	$("#undo").click(unDoExample);	

	// Cargamos todos los ejemplos de la carpeta data
	//loadSelect();
	
	disableSystem();
	my_current_example = 0;
	init_svg("#vis");
	bootbox.alert("Click on the Start button to begin! The first window in the system contains a tutorial. You can see some explanations of the system work if you hover over the buttons with the mouse cursor. When you finished, you will move to the system itself clicking on the Next Step button.");
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
	
	// Limpiamos el historial
	graph_history = new Array();

	// Obtenemos la ruta
	// let path = "data/" + $("#options").val();
	
	if(my_current_example === 0){
		// Tutorial
		document.querySelector('#btn_ver').innerText = "Start";

		// Dibujar popups del tutorial
		drawTutorial();
	} else if (my_current_example === 1) {
		document.querySelector('#btn_ver').innerText = "Next Step";
		finishTutorial(); // desactivamos los pop ups del tutorial

		// Creamos la encuesta en el server
		$.ajax({
			url: URL_ENCUESTA,
			data: {option: 'new'},
			type: 'POST',
			success: function (data) {
				Cookies.set('id', data['id']);
				alert(data);
			}
		});

	} else if (my_current_example === 5){
		// Finalización del sistema
		document.querySelector('#btn_ver').innerText = "Finish";
	}
	
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
		drawPopUpBestExplanation();

		//addStep("Loaded " + $("#options option:selected").text());
		addStep("Loaded Example " + my_current_example);
		
		// desactivamos el boton para pasar a la siguiente recomendacion hasta que el usuario le de a like o dislike
		$("#btn_ver").addClass("disabledbutton");
		
		
	} else{ // al final se carga el formulario
		window.location.replace("https://docs.google.com/forms/d/e/1FAIpQLSfxW0qokIiW-2WCjTzCzK_ePdcjjbW_5IKeA5zGq4EbT_Jrqw/viewform?embedded=true");
		Cookies.remove('id')
	}
		
}

function loadExplanationsButtons() {

	$("#explanations_buttons").empty();

	let numButtons = currentExample.explanations.length;
	selectedExplanation = currentExample.currentExplanationIndex;
	
	
	for (var i = 0; i < numButtons; i++) {
		id = 'btn_explanation_' + (i + 1);
		if (i == 0)
			html = 'The recommendations are...</br>';
		else
			html = '';
		
		html += '<input id="' 
				+ id 
				+ '" type="image" class="buttons_movies btn btn_example btn-lg';

		if (i == selectedExplanation)
			html += ' btn-primary"';
		else
			html += ' btn-outline-secondary"';

		html += ' src="' + currentExample.getExplanationByIndex(i).getPosterMovieRec() + ');"';
		
		// Añadimos los atributos del tooltip
		html += ' data-title="Best explanation!" data-placement="bottom"';
		html += ' data-delay=\'{"show":"3000", "hide":"2000"} data-trigger="manual"\'';
				
		html += '></button>';

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

			// cambiando el color de mi actual boton
			$(old_button_id).removeClass("btn-primary");
			if (currentExample.bestExplanationIndex !== selectedExplanation)
				$(old_button_id).addClass("btn-outline-secondary");
			else
				$(old_button_id).addClass("btn-success");

			// cambiando el color del boton sobre el que esto clickando
			if($(new_button_id).hasClass("btn-success"))
				$(new_button_id).removeClass("btn-success");
			else
				$(new_button_id).removeClass("btn-outline-secondary");
			$(new_button_id).addClass("btn-primary");

			selectedExplanation = num_explanation;

			refreshRecommendation();

			addStep("Changed to recommendation " + (num_explanation + 1));

			$(new_button_id).tooltip('hide');
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
	$("#undo").addClass("disabledbutton");
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
	
	
	//quitamos el tooltip en caso de que este viendose
	let index_rec = currentExample.bestExplanationIndex;
	let rec_botton_id = "#btn_explanation_" + (index_rec + 1);
	$(rec_botton_id).tooltip( 'hide' );
	
	// activamos el boton para pasar al siguiente ejemplo
	$("#btn_ver").removeClass("disabledbutton");
};

/**
 * Función que ejecuta los eventos cuando ha gustado una recomendación a un usuario.
 */
function like() {
	// Añadimos la acción de "Like"
	endExample(true);

	if (my_current_example > 1) {
		sendExample('Like');
	}
};

/**
 * Función que ejecuta los eventos cuando no ha gustado una recomendación a un usuario.
 */
function dislike() {
	// Añadimos la acción de "Dislike"
	endExample(false);

	if (my_current_example > 1) {
		sendExample('Dislike');
	}
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

/*
* Función auxiliar para dibujar los pop ups de la 
*/
function drawTutorial(){
	let trigger = "hover focus";
	let show = "hide";
	
	drawPopUpTutorial("#zoomGraph", "You can zoom in or zoom out the explanation!", "top", trigger, show);
	drawPopUpTutorial("#explanations_buttons", "These are your recommendations! You can change whenever you want. The green one is the best explanation. The blue one is the selected one. The rest of them are in grey.", "bottom", trigger, show);
	drawPopUpTutorial("#btn_like", "When you end up, you have to click in the like button or dislike button. Then you can begin follow the next step.", "left", trigger, show);
	drawPopUpTutorial("#btn_dislike", "When you end up, you have to click in the like button or dislike button. Then you can begin follow the next step.", "left", trigger, show);
	drawPopUpTutorial("#steps_list", "Here, you can see the steps that you have carried out.", "left", trigger, show);
	drawPopUpTutorial("#vis", "Here, you can see the recommended movie in the center and its explanation. You can delete an attribute when you click its X. This attribute will not appear anymore unless you undo the last action!", "left", trigger, show); 
};

/*
* Función auxiliar para dibujar los pop ups del tutorial
*/
function drawPopUpTutorial(button_id, msg, place, trigger_type, show){
	
	$(button_id).popover({
		content: msg,
		placement: place,
		delay: { "show": 700, "hide": 700 },
		trigger: trigger_type
	});

	$(button_id).popover(show);
};

/*
* Función auxililiar para eliminar las explicaciones del tutorial
*/
function finishTutorial(){
	$('#zoomGraph').popover('dispose');
	$('#explanations_buttons').popover('dispose');
	$('#btn_like').popover('dispose');
	$('#btn_dislike').popover('dispose');
	$('#steps_list').popover('dispose');
	$('#vis').popover('dispose');
};

/*
* Función auxiliar para dibujar explicaciones en el tutorial
*/
function drawToolTip(button_id, msg, place, trigger_type, show){
	
	$(button_id).tooltip({
		title: msg,
		placement: place,
		delay: { "show": 700, "hide": 700 },
		trigger: trigger_type
	});

	$(button_id).tooltip(show);
};

/*
* Función auxiliar para ver el tooltip de mejor explicación
*/
function drawPopUpBestExplanation(){
	let index_rec = currentExample.bestExplanationIndex;
	let rec_botton_id = "#btn_explanation_" + (index_rec + 1);

	$(rec_botton_id).removeClass("btn-outline-secondary");
	$(rec_botton_id).addClass("btn-success");
	
	drawToolTip(rec_botton_id, "Best explanation!", "bottom", "manual", 'show');

	setTimeout(function(){
		$(rec_botton_id).tooltip( 'hide' );
	}, 3000);
}

	// source: https://github.com/jashkenas/underscore/blob/master/underscore.js#L1320
	function isObject(obj) {
	  var type = typeof obj;
	  return type === 'function' || type === 'object' && !!obj;
	};
	function iterationCopy(src) {
	  let target = {};
	  for (let prop in src) {
		if (src.hasOwnProperty(prop)) {
		  // if the value is a nested object, recursively copy all it's properties
		  if (isObject(src[prop])) {
			target[prop] = iterationCopy(src[prop]);
		  } else {
			target[prop] = src[prop];
		  }
		}
	  }
	  return target;
	}




/**
 * Función que elimina un atributo de todas las explicaciones
 * que hay cargadas en currentExplanation.
 * @param  String attr atributo que se quiere eliminar.
 */
function removeAttribute(attr) {
	if (currentExample != null) {
		
		let current_example_history = new Object();
		current_example_history['history'] = new Object();
		Object.assign(current_example_history['history'], currentExample.cloneExample());
		current_example_history['attribute'] = attr;

		// Guardamos este estado en el historial co su atributo eliminado
		graph_history.push(current_example_history); 
		
		console.log(graph_history);
		
		// habilitar boton de deshacer
		$("#undo").removeClass("disabledbutton");
		
		// cambian los colores del boton actual
		let index_rec = currentExample.bestExplanationIndex;
		let rec_botton_id = "#btn_explanation_" + (index_rec + 1);

		$(rec_botton_id).removeClass("btn-success");
		$(rec_botton_id).addClass("btn-outline-secondary");
		$(rec_botton_id).tooltip( 'hide' );
		
		currentExample.removeAttribute(attr);
		
		// Compruebo si hay una mejor explicación
		if(currentExample.isThereBestExplanation()) {	
			drawPopUpBestExplanation();
		}
		
		// Vuelvo a pintar la explicación
		let currentExplanation = currentExample.getCurrentExplanation();
		
		paint_graph(currentExplanation.nodes, currentExplanation.links, false);
	} else {
		console.log("There is no example loaded.");
	}
}


function unDoExample(){
	// mirar si el historial no esta vacio
	if (graph_history.length > 0){
		// cargar el ultimo ejemplo en la variable global de mi currentExample
		// hago una copia para que al borrarlo no haya problemas
		currentExample = graph_history[graph_history.length - 1]['history'].cloneExample(); 
		
		console.log(currentExample);
		
		// volver a pintar el grafo
		let currentExplanation = currentExample.getCurrentExplanation();
		
		// Get the best explanation to show
		//paint_graph(currentExplanation.nodes, currentExplanation.links, true);
		//loadExplanationsButtons();
		//drawPopUpBestExplanation();

		
		addStep("Retrieved the attribute " + graph_history[graph_history.length - 1]['attribute']);
		
		
		// barra de peliculas sale correctamente -- verde, azul y gris?
		
		// eliminar del historial este estado
		
		// si el historial queda vacio, deshabilitar el boton
		
	}

}

function sendExample(result) {

	var steps_str = steps[0];
	for (var i = 0; i < steps.length; i++) {
		steps_str += "," + steps[i];
	}

	$.ajax({
		url: URL_ENCUESTA,
		data: {
			option: 'addActions',
			id: Cookies.get('id'),
			explanation: (my_current_example - 1),
			result: result,
			num_steps: steps.length,
			actions: steps_str
		},
		type: 'POST',
		success: function (data) {
			
		}
	});
}

