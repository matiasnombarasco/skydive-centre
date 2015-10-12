<?php
/**
 * Created by PhpStorm.
 * User: saresca
 * Date: 10/7/15
 * Time: 2:18 p.m.
 */

//here are you db data tronco
$servername = "mysql.paracaidismorosario.com";
$username = "paracaidismo";
$password = "Mailg0syst3ms";
$db = "reservas_paracaidismo";

$requestParts = explode(':',$_GET['id']);

//if(count($requestParts) > 1)
//{
    $id = $requestParts[0];
//}
// Create connection
$conn = new mysqli($servername, $username, $password, $db);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

switch($_SERVER['REQUEST_METHOD']) {
    case "POST":
        //hack para php para poder tener los datos del payload
        $postdata = file_get_contents("php://input");
        $request = json_decode($postdata);
        $rawSql = "INSERT INTO reservas_locales (pasajeros, telefono, email) VALUES ('".$request->nombre."', '".$request->telefono."', '".$request->email."');";
        break;
    case "DELETE":
        $postdata = file_get_contents("php://input");
        $request = json_decode($postdata);
        $rawSql = "DELETE FROM reservas_locales where id = ". $id;
        break;
    default:
        $rawSql ="select id,pasajeros,telefono,email from reservas_locales";
        break;
}
//lets get the raw sql with the all the diferent locations to process them

$result = $conn->query($rawSql);
if(!empty($conn->error)) {
    echo $conn->error;
}
header('Content-Type: application/json');
if (!empty($result->num_rows) && $result->num_rows > 0) {
    // output the result object as an array and the make it json! and echo it, so u can see it in the screen.
    while($r = mysqli_fetch_assoc($result)) {
        $rows[] = array(
            'id'=> $r['id'],
            'nombre' => $r['pasajeros'],
            'telefono' => $r['telefono'],
            'email' => $r['email']);
    }
    print json_encode($rows);
}
?>