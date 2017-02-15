<?php
/**
 * Created by PhpStorm.
 * User: saresca
 * Date: 11/29/16
 * Time: 12:09 p.m.
 */


include 'config.php';

//$requestParts = explode(':', $_GET['id']);

$conn = new mysqli($servername, $username, $password, $db);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

$rawSQL = "SELECT * FROM loads_skydivers WHERE jumptype = 'TI-HC';";

$result = $conn->query($rawSQL);
if (!empty($conn->error)) {
    die($conn->error);
}

while ($r = mysqli_fetch_assoc($result)) {
    $instructors[] = $r;
}

$rawSQL = "SELECT * FROM loads_skydivers WHERE jumptype = 'TL1';";

$result = $conn->query($rawSQL);
if (!empty($conn->error)) {
    die($conn->error);
}

while ($r = mysqli_fetch_assoc($result)) {

}


?>