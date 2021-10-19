<?php

include_once('answers.php');

if ($_SERVER['REQUEST_METHOD'] == 'GET')
{
	$num_answers = getNumAnswers();
	$data = ['num_answers' => $num_answers];
	header('Content-Type: application/json');
	header('Access-Control-Allow-Origin: *');
	echo json_encode($data);
	exit();
}

if ($_SERVER['REQUEST_METHOD'] == 'POST')
{
	$input = $_POST;

	if ($input['option'] == 'new') 
	{
		$id = createAnswer();

		$data = array('id' => $id);
		$json_data = json_encode($data);
		header("HTTP/1.1 200 OK");
		header("Content-Type: application/json");
		header('Access-Control-Allow-Origin: *');
	    echo $json_data;
	    exit();
	} 
	else if ($input['option'] == 'addActions') 
	{
		$id = $input['id'];
		$explanation = $input['explanation'];
		$result = $input['result'];
		$num_steps = $input['num_steps'];
		$actions = $input['actions'];

		saveAnswer($id, $explanation, $result, $num_steps, $actions);
		header("HTTP/1.1 200 OK");
		header('Access-Control-Allow-Origin: *');
		exit();
	}

	

}

// Si no es ninguna de las anteriores, enviamos un error
header("HTTP/1.1 400 Bad Request");

?>