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
var tutorial_step = 1; // variable que me dice en que paso del tutorial estoy
var tutorial_changes = 0; // variable para guardar cuantos atributos voy eliminando en el tutorial

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
	
	// disableSystem();
	my_current_example = 1;
	// my_current_example = 0;
	init_svg("#vis");
	loadExample();
	//bootbox.alert("Click on the Tutorial button to begin! The first window in the system contains a tutorial. You have to follow the steps that the system points out. When you finished, you will move to the system itself clicking on the Start button.");
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
		
		if (tutorial_step === 1){
			showTutorial(tutorial_step);
			tutorial_step++;
		}
		
		
		// Dibujar popups del tutorial
		//drawTutorial();
	} else if (my_current_example === 1) {
		document.querySelector('#btn_ver').innerText = "Next Step";
		//finishTutorial(); // desactivamos los pop ups del tutorial

		// mandamos un mensaje al usuario sobre el numero de interacciones
		// bootbox.alert("¡Recuerda que estamos midiendo el número de veces que interactuas con el sistema! Realiza sólo las acciones que consideres necesarias antes de terminar con cada ejemplo.");
		
		// Creamos la encuesta en el server
		/*$.ajax({
			url: URL_ENCUESTA,
			data: {option: 'new'},
			type: 'POST',
			success: function (data) {
				Cookies.set('id', data['id']);
				alert(data);
			}
		});*/

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
		
		currentExample.getSortedExample();
		
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

/*
* Función para mostrar el mensaje adecuado en el tutorial
*/
function showTutorial(step){
	let msg;
	
	if (step === 1){
		msg = "First, you are watching the first recommendation of the system which is also the most explainable. In the upper navigation bar you can see 4 more recommendations for you, with its explanations, sorted by its explainability. See that this current movie recommendation has the attributes Thriller and Drama. Next, click on the second movie recommendation. "
	} else if (step === 2){
		//msg = "You are watching the second recommendation of the system which is the second most explainable. See this movie has the attributes Thriller and Drama. Remove these attributes because you consider them not important. When you finish, go to see the first recommendation again."
		msg = "Estás viendo la segunda recomendación del sistema, que es la segunda más explicable. Fíjate en que esta recomendación también tiene los atributos Thriller y Drama. Supongamos que esos atributos no los consideras importantes, así que elimínalos. Cuando acabes, vuelve a la primera recomendación."
	} else if (step === 3){
		//msg = "You can see that the attributes Thriller and Drama that you removed in the second recommendation have also disappeared in this recommendation. Now, remove the attributes Crime, Mistery and Short duration. You are going to watch that now the recommendation with the best explanation to show you is the movie recommendation 3. Next, click on this recommendation 3."
		msg = "Estás de nuevo en la primera recomendación. Los atributos Drama y Thriller ya no aparecen en esta recomendación, ya que los eliminaste en la recomendación 2 porque no los considerabas relevantes. Viendo la explicación, te das cuenta de que hay otros atributos que no crees que sean importantes, así que eliminas Crimen, Misterio y Corta duración. Al eliminar estos atributos, aparece otra recomendación que es más explicable que la actual. Es la recomendación número 3. Haz click en esa recomendación cuando termines de eliminar los tres atributos que te hemos indicado. "
	} else if (step === 4){
		//msg = "This is the current most explainable recommendation. Delete the attribute Long duration. Later, click on the recommendation 4."
		msg = "Esta es la recomendación más explicable actualmente. Elimina el atributo Larga duración y después haz click en la recomendación 4. "
	} else if (step === 5){
		msg = "Esta es la cuarta recomendación. Fíjate en que la tercera recomendación sigue siendo la que mejor te podemos explicar. Restaura el atributo Larga duración. Después, vuelve a la recomendación de la primera película."
	} else if (step === 6){
		msg = "Mira los pasos que has estado realizando con el sistema en la parte derecha de la ventana. Después, en esta misma recomendación, restaura todos los atributos que has eliminado. Fíjate en que se van restaurando en orden inverso al que fuiste eliminándolos. Revisa los pasos de nuevo. Después haz click en la recomendación 5. "
	} else if (step === 7){
		msg = "En esta recomendación juega con los botones de zoom, para ver más grandes o más pequeños los carteles de las películas. Cuando termines, vuelve a la recomendación 1."
	} else if (step === 8){
		msg = "Ya has terminado el tutorial. Juega libremente con el sistema. Cuando acabes, haz click en el botón La explicación es útil, o La explicación no es útil, según consideres. Al terminar aparecerá un pequeño cuestionario. Después empezarás a utilizar el sistema propiamente dicho. "
	}
	
	bootbox.dialog({
		title: "<span style='color: Blue;'>Tutorial Step " + step + "</span>",
		message: msg
	})
}

/*
* Función auxiliar para determinar qué mensaje se tiene que mostrar en cada momento
*/
function triggersTutorial(num_explanation){
	// tutorial
	// Step 2 in the tutorial
	if (my_current_example === 0 && tutorial_step === 2 && num_explanation === 1){
		showTutorial(tutorial_step);
		tutorial_step++;
		tutorial_changes = 0;
	}
	// Step 3 in the tutorial
	if (my_current_example === 0 && tutorial_step === 3 && num_explanation === 0 && tutorial_changes === 2){
		showTutorial(tutorial_step);
		tutorial_step++;
		tutorial_changes = 0;
	}
	
	// Step 4 in the tutorial
	if (my_current_example === 0 && tutorial_step === 4 && num_explanation === 2 && tutorial_changes === 3){
		showTutorial(tutorial_step);
		tutorial_step++;
		tutorial_changes = 0;
	}
	
	// Step 5 in the tutorial
	if (my_current_example === 0 && tutorial_step === 5 && num_explanation === 3 && tutorial_changes === 1){
		showTutorial(tutorial_step);
		tutorial_step++;
		tutorial_changes = 0;
	}
	
	// Step 6 in the tutorial
	if (my_current_example === 0 && tutorial_step === 6 && num_explanation === 0 && tutorial_changes === -1){
		showTutorial(tutorial_step);
		tutorial_step++;
		tutorial_changes = 0;
	}
	
	// Step 7 in the tutorial
	if (my_current_example === 0 && tutorial_step === 7 && num_explanation === 4){
		showTutorial(tutorial_step);
		tutorial_step++;
		tutorial_changes = 0;
	}
	
	// Step 7 in the tutorial
	if (my_current_example === 0 && tutorial_step === 8 && num_explanation === 0){
		showTutorial(tutorial_step);
		tutorial_step++;
		tutorial_changes = 0;
	}
};

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
			
			// to build the tutorial
			triggersTutorial(num_explanation);
			
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
	//$("#undo").addClass("disabledbutton");
	$("#undo").hide();
};

/*
	Función auxiliar para crear el prompt con el mini cuestionario del final	
*/
function finalQuestionnaire(msg){
	
	bootbox.prompt({
		title: msg,
		message: '<p>Please select at least one option below:</p>',
		inputType: 'checkbox',
		inputOptions: [{
			text: 'The attributes',
			value: '1',
		},
		{
			text: 'The explanation examples',
			value: '2',
		},
		{
			text: 'The grouping of the examples',
			value: '3',
		},
		{
			text: 'Other: </br><textarea name="textarea" rows="5" cols="50">Write something here...</textarea>',
			value: '4',
			type: 'text'
		}
		],
		callback: function (result) {
			if (result === null || result.length === 0){
				// si no ha respondido nada, volver a mostrar el mensaje
				finalQuestionnaire(msg + " You have to click at least one option!");
			}
			
			// result tiene un array con los value que el usuario ha marcado
			// console.log(result);
		}
	});
};


// Funcion auxiliar para terminar el ejemplo
function endExample(like){
	let numSteps = steps.length - 1; // -1 para que no cuente load Example
	let msg;
	let promptMsg;
	if (like){
		msg = "You consider the explanation useful! You have interacted " + numSteps +  " times with the system. ";
		promptMsg = msg + "What features do you consider useful?";
	}
	else{
		msg = "You don't consider the explanation useful! You have interacted " + numSteps +  " times with the system. ";
		promptMsg = msg + "What features do you not consider useful?";
	}

	finalQuestionnaire(promptMsg);

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
/*function drawTutorial(){
	drawPopUpTutorial("#zoomGraph", "You can zoom in or zoom out the explanation!", "top");
	drawPopUpTutorial("#explanations_buttons", "These are your recommendations! You can change whenever you want. The green one is the best explanation. The blue one is the selected one. The rest of them are in grey.", "bottom");
	drawPopUpTutorial("#btn_like", "When you end up, you have to click in this button if you consider the explanation useful. Then you can start using the system!", "left");
	drawPopUpTutorial("#btn_dislike", "When you end up, you have to click in this button if you consider the explanation not useful. Then you can start using the system!", "left");
	drawPopUpTutorial("#steps_list", "Here, you can see the steps that you have carried out.", "left");
	drawPopUpTutorial("#vis", "Here, you can see the recommended movie in the center and its explanation. You can delete an attribute when you click its X. This attribute will not appear anymore unless you undo the last action!", "left"); 
	drawPopUpTutorial("#undo", "You can restore the last removed attribute with this button. The button will desappear when there are not more attributes to retrieve!", "bottom");
};*/

/*
* Función auxiliar para dibujar los pop ups del tutorial
*/
/*function drawPopUpTutorial(button_id, msg, place){
	let trigger_type = "hover focus";
	let show = "hide";

	$(button_id).popover({
		content: msg,
		placement: place,
		delay: { "show": 700, "hide": 700 },
		trigger: trigger_type
	});

	$(button_id).popover(show);
};*/

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
	$('#undo').popover('dispose');
};

/*
* Función auxiliar para ver el tooltip de mejor explicación
*/
function drawPopUpBestExplanation(){
	
	let index_rec = currentExample.bestExplanationIndex;
	let rec_botton_id = "#btn_explanation_" + (index_rec + 1);

	$(rec_botton_id).removeClass("btn-outline-secondary");
	$(rec_botton_id).addClass("btn-success");
	
	//drawToolTip(rec_botton_id, "Best explanation!", "bottom", "manual", 'show');

	$(rec_botton_id).tooltip({
		title: "Best explanation!",
		placement: "bottom",
		delay: { "show": 700, "hide": 700 },
		trigger: "manual"
	});

	$(rec_botton_id).tooltip("show");
	
	setTimeout(function(){
		$(rec_botton_id).tooltip( 'hide' );
	}, 3000);
};

/*
* Función auxiliar para eliminar los pop ups de mejor recomendacion en el caso de que aun esten en pantalla
*/
function removeBestExplanationPopUp(){
	// borrar el anterior en caso de que este dibujado, me aseguro eliminando todos los pop ups que existen de mejor recomendacion
	for (var i = 1; i <= currentExample.explanations.length; i++){
		let botton_id = "#btn_explanation_" + i;
		$(botton_id).tooltip( 'hide' );
	}
};

/**
 * Función que elimina un atributo de todas las explicaciones
 * que hay cargadas en currentExplanation.
 * @param  String attr atributo que se quiere eliminar.
 */
function removeAttribute(attr) {
	if (currentExample != null) {
		// elimino el anterior pop up de mejor explicacion que existe hasta ahora
		removeBestExplanationPopUp();
		
		let current_example_history = new Object();
		current_example_history['history'] = currentExample.cloneExample();
		current_example_history['attribute'] = attr;

		// Guardamos este estado en el historial con su atributo eliminado 
		graph_history.push(current_example_history); 
		
		$("#undo").show();
		document.querySelector('#undo_text').innerText = "Undo deletion of " + attr;
		
		
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
		
		// Para el tutorial 
		// Step 3
		if (tutorial_step === 3 && my_current_example === 0){
			if (attr === "Thriller" || attr === "Drama"){
				tutorial_changes++;
			}
		}
		// step 4
		if (tutorial_step === 4 && my_current_example === 0){
			if (attr === "Crime" || attr === "Mystery" || attr === "Short duration"){
				tutorial_changes++;
			}
		}
		// step 5
		if (tutorial_step === 5 && my_current_example === 0){
			if (attr === "Long duration"){
				tutorial_changes++;
			}
		}
		
		
	} else {
		console.log("There is no example loaded.");
	}
}

/**
 * Función que devuelve al estado anterior el sistema
 */
function unDoExample(){
	// mirar si el historial no esta vacio
	if (graph_history.length > 0){
		// elimino el anterior pop up de mejor explicacion que existe hasta ahora
		removeBestExplanationPopUp();
		
		// eliminar del historial este estado
		let last_state = graph_history.pop();
		
		// cargar el ultimo ejemplo en la variable global de mi currentExample
		// hago una copia para que al borrarlo no haya problemas
		let my_history = last_state['history'];
		let currentAttribute = last_state['attribute'];
		
		// vuelvo al estado anterior
		currentExample = my_history.cloneExample(); 
		
		// me quedo en el grafo en el que estoy actualmente
		currentExample.setCurrentExplanation(selectedExplanation);
		
		// pinto el grafo
		refreshRecommendation();
		
		// cargo la barra de botones apra cambiar de peli
		loadExplanationsButtons();
		
		// genero el popup de mejor explicacion
		drawPopUpBestExplanation();
		
		addStep("Retrieved the attribute " + currentAttribute);	
		
		// Tutorial step 6
		if (tutorial_step === 6 && my_current_example === 0){
			if (currentAttribute === "Long duration"){
				tutorial_changes--;
			}
		}
		
		// Tutorial step 7
		if (tutorial_step === 7 && my_current_example === 0){
			if (currentAttribute === "Crime" || currentAttribute === "Mystery" || currentAttribute === "Short duration" || currentAttribute === "Drama" || currentAttribute === "Thriller"){
				tutorial_changes--;
			}
		}
		
		// si el historial queda vacio, deshabilitar el boton, si no, cambiar el nombre al anterior atributo
		if (graph_history.length === 0){
			$("#undo").addClass("disabledbutton");
			$("#undo").hide(); 
		} else {
			let lastAttribute = graph_history[graph_history.length-1]['attribute'];
			document.querySelector('#undo_text').innerText = "Undo deletion of " + lastAttribute;
		}
		
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

