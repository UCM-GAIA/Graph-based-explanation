<?php

/**
 * Método que crea el fichero para guardar las interacciones
 * del usuario en el experimento. Este fichero se inicializará con el
 * identificador del usuario y la hora en la que ha comenzado el 
 * experimento.
 * @return devuelve el identificador que se ha asignado al usuario.
 */
function createAnswer() {
	$current_time = time();
	$num_answer = count(scandir('./answers')) - 2; // quitamos . y ..
	$id_user = strval($current_time) . '_' . strval($num_answer + 1);
	$file_name = './answers/' . $id_user . '.log';
	
	$file = fopen($file_name, 'w');
	fwrite($file,"User ID: " . $id_user . "\n");
	fwrite($file, "Time started: " . $current_time . "\n");
	fclose($file);

	return $id_user;
}   

/**
 * Método que almacena las acciones que ha realizado un usuario,
 * en uno de los ejemplos mostrados. Además, almacena la hora
 * en el que ha terminado de interactuar con el ejemplo.
 * @param $id: identificador del usuario.
 * @param $example: número de ejemplo con el que ha interactuado.
 * @param $actions: acciones que ha realizado en el ejemplo, cada
 *                  una de ellas separadas por una coma.
 */
function saveAnswer($id, $question, $result, $num_steps, $answer) {
	$current_time = time();
	$file_name = './answers/' . $id . '.log';

	$file = fopen($file_name, 'a');
	fwrite($file, "Explanation: " . $question . "\n");
	fwrite($file, "Time: " . $current_time . "\n");
	fwrite($file, "Result: " . $result. "\n");
	fwrite($file, "Num. Steps: " . $num_steps. "\n");
	fwrite($file, "Actions: " . $answer . "\n");
	fclose($file);
}


/**
 * Método que devuelve el número de encuestas que hay en la
 * carpeta answers.
 * @return número de encuestas.
 */
function getNumAnswers() {
	$num_answer = count(scandir('./answers')) - 2;
	return $num_answer;
}

?>