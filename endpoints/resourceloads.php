<?php
/**
 * Created by PhpStorm.
 * User: saresca
 * Date: 11/18/16
 * Time: 5:19 p.m.
 */

if (isset($_COOKIE["easymanifest"])) {

    include 'config.php';

    $conn = new mysqli($servername, $username, $password, $db);

    if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
    }

    $postdata = file_get_contents("php://input");
    $request = json_decode($postdata, false);

    SWITCH ($request->action) {

        CASE 'MOVE':

            $loadfromnumber = $request->loadfrom->loadnumber;
            $loadto = $request->loadto;
            $date = $request->querydate;

            if ($loadto == 'UP') {
                $rawSQL = "SELECT * FROM loads
                           WHERE loads.date = '$date' AND loads.loadnumber < $loadfromnumber
                           ORDER BY loads.loadnumber DESC
                           LIMIT 1;";
            }
            else
            {
                $rawSQL = "SELECT * FROM loads
                           WHERE loads.date = '$date' AND loads.loadnumber > $loadfromnumber
                           ORDER BY loads.loadnumber
                           LIMIT 1;";
            }

            $result = $conn->query($rawSQL);

            if (!empty($conn->error)) {
                die($conn->error);
            }

            if (!empty($result->num_rows) && $result->num_rows > 0) {
                $r = mysqli_fetch_assoc($result);

                $loadfromloadid = $request->loadfrom->loadid;
                $loadtonumber = $r['loadnumber'];
                $loadtoloadid = $r['loadid'];

                $rawSQL = "UPDATE loads set loadnumber = $loadfromnumber WHERE loadid = $loadtoloadid;
                           UPDATE loads set loadnumber = $loadtonumber WHERE loadid = $loadfromloadid;";

                if (!$conn->multi_query($rawSQL)) {
                    $error = array('error' => 'error',
                        'dump' => $rawSQL);
                    print json_encode($error);
                    die();
                };
            }
            if ($loadto == 'UP') {
                $rows[] = array(
                    'loadnumber' => $loadtonumber
                );
            }
            else
            {
                $rows[] = array(
                    'loadnumber' => $loadfromnumber
                );
            }
            print json_encode($rows);

            break;

        CASE 'ADD':

            $date = $request->querydate;

            $rawSQL = "SELECT loads.loadnumber FROM loads
               WHERE loads.date = '$date'
               ORDER BY loads.loadnumber DESC
               LIMIT 1";

            $result = $conn->query($rawSQL);
            if (!empty($conn->error)) {
                die($conn->error);
            }

            $loadnumberlast = 0;

            if (!empty($result->num_rows)) {
                $r = mysqli_fetch_assoc($result);
                $loadnumberlast = $r['loadnumber'];
            }

            $rawSQL = "INSERT INTO loads
                                (loadnumber,
                                date,
                                aircraft,
                                takeofftime,
                                turning,
                                altitude,
                                pilot,
                                loadslotavailable)
                                VALUES
                                ($loadnumberlast + 1,
                                '$date',
                                'LV-HBB',
                                0,
                                'Y',
                                '3000',
                                0,
                                4);
                                ";

            if (!$conn->query($rawSQL)) {
                $error = array('error' => 'error',
                    'dump' => $rawSQL);
                print json_encode($error);
                die();
            };

            break;
    };




}

?>

