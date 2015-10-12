<?php
/**
 * Created by PhpStorm.
 * User: matias
 * Date: 19/09/15
 * Time: 5:40 PM
 */

//here are you db data tronco
$servername = "mysql.paracaidismorosario.com";
$username = "paracaidismo";
$password = "Mailg0syst3ms";
$db = "reservas_paracaidismo";

// Create connection
$conn = new mysqli($servername, $username, $password, $db);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

//lets get the raw sql with the all the diferent locations to process them
$rawSql ="select id,pasajeros,telefono,email from reservas_locales";

$result = $conn->query($rawSql);

if ($result->num_rows > 0) {
    //is really important to set the proper type of headers in the response, otherwise angularJs wont like
    header('Content-Type: application/json');

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
