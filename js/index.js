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

//const URL_ENCUESTA = "http://localhost:8000/server/explanations.php";
const URL_ENCUESTA = "https://mistela.fdi.ucm.es/jorro/explanations.php";

$(function() {
	// Incluimos el evento correspondiente a cada uno de los botones.
	$("#btn_ver").click(loadExample);
	$("#btn_like").click(like);
	$("#btn_dislike").click(dislike);
	$("#btn_zoom_in").click(zoomIn);
	$("#btn_zoom_out").click(zoomOut);
	$("#undo").click(unDoExample);	
	$("#openTutorialButton").click(openTutorial);

	// Cargamos todos los ejemplos de la carpeta data
	//loadSelect();
	
	disableSystem();
	my_current_example = 0;
	init_svg("#vis");
	bootbox.alert("¡Haz click en el botón Tutorial para empezar! La primera pantalla contiene un tutorial, tienes que seguir los pasos que el sistema indica. Cuando acabes, pasarás a interactuar con el sistema en sí al hacer click en el botón Empezar.");
	
});

function askForName(msg){
	bootbox.prompt(msg, function(result){ 
		if(result === null || result === ""){
			askForName("Primero tienes que poner tu nombre y tus apellidos:");
		} else{
			// Creamos al usuario
			createUser(result);
			bootbox.alert("¡Recuerda que estamos midiendo el número de veces que interactuas con el sistema! Realiza sólo las acciones que consideres necesarias antes de terminar con cada ejemplo.");
		}
	});

}

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
		$("#openTutorialButton").removeClass("disabledbutton");
		document.querySelector('#btn_ver').innerText = "Empezar";
		
		if (tutorial_step === 1){
			showTutorial(tutorial_step);
		}
		
		
		// Dibujar popups del tutorial
		//drawTutorial();
	} else if (my_current_example === 1) {
		document.querySelector('#btn_ver').innerText = "Siguiente paso";
				
		askForName("Escribe tu nombre y apellidos:");


		$("#helpTutorial").remove();


	} else if (my_current_example === 5){
		// Finalización del sistema
		document.querySelector('#btn_ver').innerText = "Terminar";
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
		addStep("Cargado ejemplo " + my_current_example);
		
		// desactivamos el boton para pasar a la siguiente recomendacion hasta que el usuario le de a like o dislike
		$("#btn_ver").addClass("disabledbutton");
		
		
	} else{ // al final se carga el formulario
		Cookies.remove('id')
		window.location.replace("https://docs.google.com/forms/d/e/1FAIpQLSfxW0qokIiW-2WCjTzCzK_ePdcjjbW_5IKeA5zGq4EbT_Jrqw/viewform?embedded=true");
	}
		
}

/*
* Función para mostrar el mensaje adecuado en el tutorial
*/
function showTutorial(step){
	let msg;
	
	if (step === 1){
		//msg = "First, you are watching the first recommendation of the system which is also the most explainable. In the upper navigation bar you can see 4 more recommendations for you, with its explanations, sorted by its explainability. See that this current movie recommendation has the attributes Thriller and Drama. Next, click on the second movie recommendation. "
		msg = "<p>Estás viendo la primera recomendación del sistema, que es también la que mejor te podemos explicar. En el centro, dentro del círculo morado estás viendo la película recomendada. En el exterior, estás viendo cuáles son las películas que has visto y que son similares a la película recomendada. La película recomendada está unida a estas películas a través de los atributos que tienen en común, dentro del círculo naranja. Estos atributos pueden aparecer en varias recomendaciones.</p> <p>En la barra superior puedes ver otras cuatro recomendaciones, con sus respectivas explicaciones, ordenadas de más a menos explicables. En color verde se indica cuál es la película más explicable, y en azul la que actualmente estás viendo. Si estás viendo la película más explicable, entonces el botón se mantiene en verde.</p> <p><b>Haz click en la segunda película</b> recomendada para ver por qué te la estamos recomendando.</p>";
	} else if (step === 2){
		//msg = "You are watching the second recommendation of the system which is the second most explainable. See this movie has the attributes Thriller and Drama. Remove these attributes because you consider them not important. When you finish, go to see the first recommendation again."
		msg = "<p>Estás viendo la segunda recomendación del sistema, que es la segunda más explicable.</p> <p>Supongamos que los atributos <i>Thriller</i> y <i>Drama</i> no los consideras importantes, así que <b>elimínalos</b>.</p><p> Cuando acabes, <b>vuelve a la primera recomendación</b>.</p>"
	} else if (step === 3){
		//msg = "You can see that the attributes Thriller and Drama that you removed in the second recommendation have also disappeared in this recommendation. Now, remove the attributes Crime, Mistery and Short duration. You are going to watch that now the recommendation with the best explanation to show you is the movie recommendation 3. Next, click on this recommendation 3."
		msg = "<p>Estás de nuevo en la primera recomendación. Los atributos <i>Thriller</i> y <i>Drama</i> ya no aparecen en esta recomendación, ya que los eliminaste en la recomendación 2 porque no los considerabas relevantes. </p><p>Viendo la explicación, te das cuenta de que esos atributos te parecen interesantes en esta película. <b>Restaura los atributos <i>Thriller</i> y <i>Drama</i></b>. </p><p>Después, <b>haz click en la recomendación 3</b>.</p>"
	} else if (step === 4){
		msg = "<p>En esta recomendación <b>juega con los botones de <i>zoom</i></b>, para ver más grandes o más pequeños los carteles de las películas.</p> <p><b>Mira</b> los <i>Pasos</i> que has estado realizando con el sistema en la parte derecha de la ventana.</p> <p>Cuando termines, <b>vuelve a la recomendación 1</b>.</p>"
	} else if (step === 5){
		msg = "<p>Ya has terminado el tutorial. <b>Juega libremente con el sistema</b>.</p> <p>Cuando acabes, <b>haz click</b> en el botón <i>La explicación es útil</i>, o <i>La explicación no es útil</i>, según consideres. </p><p>Al terminar aparecerá un pequeño cuestionario. Después empezarás a utilizar el sistema propiamente dicho. </p>"
	}
	
	bootbox.dialog({
		title: "<span style='color: Blue;'>Tutorial: Paso " + step + "</span>",
		message: msg
	})
}

/*
* Función auxiliar para determinar qué mensaje se tiene que mostrar en cada momento
*/
function triggersTutorial(num_explanation){
	// tutorial
	// Step 2 in the tutorial
	if (my_current_example === 0 && tutorial_step === 1 && num_explanation === 1){
		tutorial_step++;
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
	if (my_current_example === 0 && tutorial_step === 4 && num_explanation === 2 && tutorial_changes === -2){
		showTutorial(tutorial_step);
		tutorial_step++;
		tutorial_changes = 0;
	}
	
	// Step 5 in the tutorial
	if (my_current_example === 0 && tutorial_step === 5 && num_explanation === 0){
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
			html = 'Las recomendaciones son...</br>';
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
		html += ' data-title="¡Mejor explicación!" data-placement="bottom"';
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

			addStep("Cambio a la recomendación " + (num_explanation + 1));

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
	$("#openTutorialButton").addClass("disabledbutton");
};

// Función auxiliar para activar el text area cuando se pinche sobre ese textarea
function disabledTextArea(){
	$("#feedback").removeClass("semi_disabledbutton"); 
	document.querySelector("#feedback").innerText = "";
};

/*
	Función auxiliar para crear el prompt con el mini cuestionario del final	
*/
function finalQuestionnaire(msg, msgStep, like){
	
	bootbox.prompt({
		title: msg,
		message: '<p>Por favor, selecciona al menos una opción:</p>',
		inputType: 'checkbox',
		inputOptions: [{
			text: 'Los atributos',
			value: '1',
		},
		{
			text: 'Los ejemplos de la explicación',
			value: '2',
		},
		{
			text: 'El agrupamiento de los ejemplos',
			value: '3',
		},
		{
			text: '<p onclick="disabledTextArea()">Otro: </br><textarea id="feedback" class="semi_disabledbutton" name="textarea" rows="5" cols="35">Escribe aquí...</textarea></p>',
			value: '4',
			type: 'text'
		}
		],
		callback: function (result) {
			if (result !== null && result.length === 0){
				// si no ha respondido nada, volver a mostrar el mensaje
				finalQuestionnaire(msg, msgStep);
			} else if(result !== null){

				addStep(msgStep);
				feedback = $("#feedback").val();

				//TODO - Enviar al server la información
				sendExample(like, result, feedback);

				disableSystem();
				my_current_example++; // si el ejemplo es 6 -> pasar al formulario
				
				//quitamos el tooltip en caso de que este viendose
				let index_rec = currentExample.bestExplanationIndex;
				let rec_botton_id = "#btn_explanation_" + (index_rec + 1);
				$(rec_botton_id).tooltip( 'hide' );
				
				// activamos el boton para pasar al siguiente ejemplo
				$("#btn_ver").removeClass("disabledbutton");
			}
			
			// result tiene un array con los value que el usuario ha marcado
			// console.log(result);
			// ..........................
		}
	});
};


// Funcion auxiliar para terminar el ejemplo
function endExample(like){
	let numSteps = steps.length - 1; // -1 para que no cuente load Example
	let msg;
	let promptMsg;
	if (like){
		msg = "¡Consideras la explicación útil! Has interactuado " + numSteps +  " veces con el sistema. ";
		promptMsg = msg + "¿Qué características del sistema consideras útiles?";
	}
	else{
		msg = "No consideras la explicación útil. Has interactuado " + numSteps +  " veces con el sistema. ";
		promptMsg = msg + "¿Qué características del sistema no consideras útiles?";
	}

	finalQuestionnaire(promptMsg, msg, like);
};

/**
 * Función que ejecuta los eventos cuando ha gustado una recomendación a un usuario.
 */
function like() {
	// Añadimos la acción de "Like"
	endExample(true);

	/*if (my_current_example > 1) {
		sendExample('Like');
	}*/
};

/**
 * Función que ejecuta los eventos cuando no ha gustado una recomendación a un usuario.
 */
function dislike() {
	// Añadimos la acción de "Dislike"
	endExample(false);

	/*if (my_current_example > 1) {
		sendExample('Dislike');
	}*/
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

function openTutorial() {
	if(tutorial_step === 1)
		showTutorial(tutorial_step);
	else
		showTutorial(tutorial_step-1);
}

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
		title: "¡Mejor explicación!",
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
		document.querySelector('#undo_text').innerText = "Deshacer la eliminación de " + attr;
		
		
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
		
		addStep("Recuperado el atributo " + currentAttribute);	
		
		
		// Tutorial step 4
		if (tutorial_step === 4 && my_current_example === 0){
			if (currentAttribute === "Drama" || currentAttribute === "Thriller"){
				tutorial_changes--;
			}
		}
		
		// si el historial queda vacio, deshabilitar el boton, si no, cambiar el nombre al anterior atributo
		if (graph_history.length === 0){
			$("#undo").addClass("disabledbutton");
			$("#undo").hide(); 
		} else {
			let lastAttribute = graph_history[graph_history.length-1]['attribute'];
			document.querySelector('#undo_text').innerText = "Deshacer la eliminación de " + lastAttribute;
		}
		
	}

}

function createUser(name) {
	// Creamos la encuesta en el server
	$.ajax({
		url: URL_ENCUESTA,
		data: { option: 'new' , name: name},
		type: 'POST',
		success: function (data) {
			Cookies.set('id', data['id']);
		}
	});
}

function sendExample(like, result, feedback) {

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
			like: like,
			result: result.toString(),
			feedback: feedback,
			num_steps: steps.length,
			actions: steps_str
		},
		type: 'POST',
		success: function (data) {
			
		}
	});
}

