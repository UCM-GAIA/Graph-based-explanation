<?php

include_once('answers.php');

if ($_SERVER['REQUEST_METHOD'] == 'GET')
{
	$num_answers = getNumAnswers();
	$data = ['num_answers' => $num_answers];
	header('Content-Type: application/json');
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
	    echo $json_data;
	    exit();
	} 
	else if ($input['option'] == 'addActions') 
	{
		$id = $input['id'];
		$explanation = $input['explanation'];
		$actions = $input['actions'];

		saveAnswer($id, $explanation, $actions);
		header("HTTP/1.1 200 OK");
		exit();
	}

	

}

// Si no es ninguna de las anteriores, enviamos un error
header("HTTP/1.1 400 Bad Request");

?>