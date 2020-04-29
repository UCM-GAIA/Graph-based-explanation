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
		$name = $input['name'];

		$id = createAnswer($name);

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
		$like = $input['like'];
		$result = $input['result'];
		$feedback = $input['feedback'];
		$num_steps = $input['num_steps'];
		$actions = $input['actions'];

		saveAnswer($id, $explanation, $like, $result, $feedback, $num_steps, $actions);
		header("HTTP/1.1 200 OK");
		header('Access-Control-Allow-Origin: *');
		exit();
	}
	
}

// Si no es ninguna de las anteriores, enviamos un error
header("HTTP/1.1 400 Bad Request");

?>