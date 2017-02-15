<?php
/**
 * Created by PhpStorm.
 * User: saresca
 * Date: 11/18/16
 * Time: 9:28 a.m.
 */

if (isset($_COOKIE["easymanifest"])) {

    include 'config.php';

    $conn = new mysqli($servername, $username, $password, $db);

    if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
    }

    $postdata = file_get_contents("php://input");
    $request = json_decode($postdata, false);

    $instructor = $request->instructor;
    $skydiverid = $request->skydiverid;
    $loadid = $request->loadid;
    $autoid = $request->autoid;

    $rawSQL = "";

    switch ($request->action) {
        CASE "DELETE":
            if (isset($skydiverid)) {
                if ($instructor != 0) {
                    $rawSQL = "DELETE FROM loads_skydivers where loadid = $loadid AND (instructor = $instructor OR skydiverid = $instructor);
                           DELETE FROM loads WHERE loads.loadid = $loadid AND loads.loadid NOT IN
                           (SELECT loadid FROM loads_skydivers WHERE loadid = $loadid AND !(instructor = $instructor OR skydiverid = $instructor));";
                }
                else
                {
                    $rawSQL = "DELETE FROM loads_skydivers where loadid = $loadid AND (skydiverid = $skydiverid);
                           DELETE FROM loads WHERE loads.loadid = $loadid AND loads.loadid NOT IN
                           (SELECT loadid FROM loads_skydivers WHERE loadid = $loadid AND !(skydiverid = $skydiverid));";
                }
            }
            else
            {
                $rawSQL = "DELETE FROM loads WHERE loads.loadid = $loadid AND loads.loadid NOT IN
                            (SELECT loadid FROM loads_skydivers WHERE loadid = $loadid);";
            }
            break;

        CASE "UPDATE":
            $rawSQL = "UPDATE loads_skydivers SET skydiverid = $skydiverid WHERE autoid = $autoid;";
            break;
    }


    if (!$conn->multi_query($rawSQL)) {
        $error = array('error' => 'error',
            'dump' => $rawSQL);
        print json_encode($error);
        die();
    };

    if (isset($request->querydate))
    {
        $pusher_date = $request->querydate;
        include('pusher.php');
    };

}

?>