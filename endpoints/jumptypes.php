<?php
/**
 * Created by PhpStorm.
 * User: saresca
 * Date: 12/2/16
 * Time: 11:44 p.m.
 */

include 'config.php';

if (isset($_COOKIE["easymanifest"])) {

    $conn = new mysqli($servername, $username, $password, $db);

    if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
    }

    $rawSQL = "SELECT * FROM jumpstypereq;";

    $result = $conn->query($rawSQL);
    if (!empty($conn->error)) {
        die($conn->error);
    }

    if (!empty($result->num_rows) && $result->num_rows > 0) {
        while ($r = mysqli_fetch_assoc($result)) {
            $rowsJumpsTypeReq[] = array(
                'id' => $r['id'],
                'description' => $r['description'],
                'jumptype' => $r['jumptype'],
                'altitude' => $r['altitude'],
                'video' => $r['video'],
                'priceslots' => $r['priceslots'],
                'price' => $r['price']
            );
        }
    }

    $rawSQL = "select DISTINCT(jumptype) as jumptype from jumpstypereq;;";

    $result = $conn->query($rawSQL);
    if (!empty($conn->error)) {
        die($conn->error);
    }

    if (!empty($result->num_rows) && $result->num_rows > 0) {
        while ($r = mysqli_fetch_assoc($result)) {
            $rowsJumpsType[] = array(
                'jumptype' => $r['jumptype']
            );
        }
    }

    $rawSQL = "select DISTINCT(altitude) as altitude from jumpstypereq;;";

    $result = $conn->query($rawSQL);
    if (!empty($conn->error)) {
        die($conn->error);
    }

    if (!empty($result->num_rows) && $result->num_rows > 0) {
        while ($r = mysqli_fetch_assoc($result)) {
            $rowsAltitude[] = array(
                'altitude' => $r['altitude']
            );
        }
    }


    $rawSQL = "select distinct(video) as video from jumpstypereq where video != '';";

    $result = $conn->query($rawSQL);
    if (!empty($conn->error)) {
        die($conn->error);
    }

    if (!empty($result->num_rows) && $result->num_rows > 0) {
        while ($r = mysqli_fetch_assoc($result)) {
            $rowsVideo[] = array(
                'video' => $r['video']
            );
        }
    }

    $rows[] = array($rowsJumpsTypeReq,$rowsJumpsType,$rowsAltitude,$rowsVideo);

    print json_encode($rows, JSON_NUMERIC_CHECK);
}

?>