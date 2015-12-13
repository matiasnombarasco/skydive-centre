<?php


$servername = "127.0.0.1";
$username = "root";
$password = "mailgo";
$db = "reservas_paracaidismo";

$conn = new mysqli($servername, $username, $password, $db);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}


$postdata = file_get_contents("php://input");
$requestarray = json_decode($postdata, true);

$groupid = array_values($requestarray)[0]['groupid'];
$bookdate = array_values($requestarray)[0]['bookdate'];

$rawSQL = "INSERT INTO tandem_bookings VALUES ";

foreach ($requestarray as $request) {

    $email = "";
    $phone = "";
    $dob = "";
    $weight = "";

    if (isset($request['email'])) {
        $email = $request['email'];
    }
    if (isset($request['phone'])) {
        $phone = $request['phone'];
    }
    if (isset($request['dob'])) {
        $dob = $request['dob'];
    }
    if (isset($request['weight'])) {
        $weight = $request['weight'];
    }

    $rawSQL = $rawSQL . "('', '" .
        $request['firstname'] . "', '" .
        $request['lastname'] . "', '" .
        $email . "', '" .
        $phone . "', '" .
        $dob . "', '" .
        $weight . "', '" .
        $groupid . "'),";
}

$rawSQL = rtrim($rawSQL, ',') . ';';

$rawSQL = $rawSQL . "INSERT INTO group_bookings (groupid, date) VALUES ('" . $groupid . "','" . $bookdate . "');";

var_dump($rawSQL);
if (!$conn->multi_query($rawSQL)) {
    die($conn->error);
}


?>

