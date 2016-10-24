<?php
/**
 * Created by PhpStorm.
 * User: saresca
 * Date: 3/23/16
 * Time: 8:09 p.m.
 */


session_start();

if (isset($_SESSION['username'])) {

    include 'config.php';

//$requestParts = explode(':', $_GET['id']);

    $conn = new mysqli($servername, $username, $password, $db);

    if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
    }

    $postdata = file_get_contents("php://input");
    $request = json_decode($postdata, false);

    $rawSQL = "SELECT id, firstname FROM tandem_bookings WHERE isTandemInstructor = 'Y' AND loggedin = 1";

    $result = $conn->query($rawSQL);
    if (!empty($conn->error)) {
        die($conn->error);
    }

    //$rows[] = array();
    if (!empty($result->num_rows) && $result->num_rows > 0) {
        while ($r = mysqli_fetch_assoc($result)) {
            $rows[] = array(
                'id' => $r['id'],
                'firstname' => $r['firstname']
            );
        }
    }
    print json_encode($rows);
}

?>

