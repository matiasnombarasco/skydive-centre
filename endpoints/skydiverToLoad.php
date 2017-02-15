<?php
/**
 * Created by PhpStorm.
 * User: saresca
 * Date: 12/3/16
 * Time: 12:04 a.m.
 */

if (isset($_COOKIE["easymanifest"])) {

    include 'config.php';

    $conn = new mysqli($servername, $username, $password, $db);

    if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
    }

    $postdata = file_get_contents("php://input");
    $request = json_decode($postdata, false);

    $skydiver = $request->skydiver->id;
    $loadid = $request->loadid;

    $rawSQL = "INSERT INTO loads_skydivers VALUES (0, $loadid, $skydiver, 7, 0, 0)";

    $result = $conn->query($rawSQL);
    if (!empty($conn->error)) {
        var_dump($conn->error);
        $error = array('error' => 'error');
        print json_encode($error);
        die();
    }

    if (isset($request->querydate))
    {
        $pusher_date = $request->querydate;
        include('pusher.php');
    };

}
?>