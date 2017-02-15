<?php
/**
 * Created by PhpStorm.
 * User: saresca
 * Date: 11/29/16
 * Time: 12:09 p.m.
 */

/// ESTO NO SE USA MAS. REEMPLAZADO POR staffstatus.php


if (isset($_COOKIE["easymanifest"])) {

    include 'config.php';

    //$requestParts = explode(':', $_GET['id']);

    $conn = new mysqli($servername, $username, $password, $db);

    if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
    }

    $rawSQL = "SELECT id, firstname, loggedin, weight FROM tandem_bookings WHERE isTandemInstructor = 'Y';";

    $result = $conn->query($rawSQL);
    if (!empty($conn->error)) {
        die($conn->error);
    }

    if (!empty($result->num_rows) && $result->num_rows > 0) {
        while ($r = mysqli_fetch_assoc($result)) {
            $rows[] = array(
                'id' => $r['id'],
                'name' => $r['firstname'],
                'loggedin' => $r['loggedin'],
                'weight' => isset($r['weight']) ? $r['weight'] : ''
            );
        }
    }
    else
    {
        $rows[] = array();
    }
    print json_encode($rows, JSON_NUMERIC_CHECK);
}
?>