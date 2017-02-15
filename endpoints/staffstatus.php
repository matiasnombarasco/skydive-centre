<?php
/**
 * Created by PhpStorm.
 * User: saresca
 * Date: 3/4/16
 * Time: 10:03 p.m.
 */

if (isset($_COOKIE["easymanifest"])) {

    include 'config.php';

    $conn = new mysqli($servername, $username, $password, $db);

    // Check connection
    if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
    }

    $postdata = file_get_contents("php://input");
    $requestobj = json_decode($postdata, false);

    $querydate = isset($requestobj->querydate) ? $requestobj->querydate : '';
    $creator = isset($requestobj->creator) ? $requestobj->creator : '';

    $staffStatus = isset($requestobj->staffStatus) ? $requestobj->staffStatus : [];

    $rawSQL = "";

    if (count($staffStatus) > 0) {
        $values = "";
        foreach($staffStatus as $request) {
            $id = $request->id;
            $loggedin = $request->loggedin;
            $InstJumpStart = $request->InstJumpStart;
            $InstJumpStop = $request->InstJumpStop;
            $start_weight = $request->start_weight;
            $start_jumps = $request->start_jumps;

            $values .= "('" . $querydate . "','" . $id . "','" . $loggedin . "','" . $InstJumpStart . "','" . $InstJumpStop . "','" . $start_weight . "','" . $start_jumps . "'),";
        }

        $rawSQL .= "INSERT INTO TI_positions VALUES " . rtrim($values, ',') .
                   " ON DUPLICATE KEY UPDATE
                         date = VALUES(date),
                         id = VALUES(id),
                         loggedin = VALUES(loggedin),
                         InstJumpStart = VALUES(InstJumpStart),
                         InstJumpStop = VALUES(InstJumpStop),
                         start_weight = VALUES(start_weight),
                         start_jumps = VALUES(start_jumps)";
    }
    else
    {
        $rawSQL .= "SELECT tandem_bookings.id, tandem_bookings.firstname, tandem_bookings.weight,
                        TI_positions.loggedin, TI_positions.InstJumpStart, TI_positions.InstJumpStop, TI_positions.start_weight, TI_positions.start_jumps
                        FROM tandem_bookings
                        LEFT JOIN TI_positions ON tandem_bookings.id = TI_positions.id AND TI_positions.date = '$querydate'
                        WHERE tandem_bookings.isTandemInstructor = 'Y';";
        $rows = array();
    };

    $result = $conn->query($rawSQL);
    if (!$conn->multi_query($rawSQL)) {
        $error = array('error' => 'error',
            'dump' => $rawSQL);
        print json_encode($error);
        die();
    };

    if (is_array($rows)) {
        if (!empty($result->num_rows) && $result->num_rows > 0) {
            while ($r = mysqli_fetch_assoc($result)) {
                $rows[] = array(
                    'id' => $r['id'],
                    'name' => $r['firstname'],
                    'loggedin' => isset($r['loggedin']) ? $r['loggedin'] : '0',
                    'weight' => isset($r['weight']) ? $r['weight'] : '0',
                    'InstJumpStart' => isset($r['InstJumpStart']) ? $r['InstJumpStart'] : '0',
                    'InstJumpStop' => isset($r['InstJumpStop']) ? $r['InstJumpStop'] : '0',
                    'start_weight' => isset($r['start_weight']) ? $r['start_weight'] : '0',
                    'start_jumps' => isset($r['start_jumps']) ? $r['start_jumps'] : '0'
                );
            }
        } else {
            $rows[] = array();
        }
    }
    print json_encode($rows, JSON_NUMERIC_CHECK);
}

?>
