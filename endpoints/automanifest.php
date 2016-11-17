<?php
/**
 * Created by PhpStorm.
 * User: saresca
 * Date: 2/24/16
 * Time: 11:45 a.m.
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

    $studentid = $request->id;

    $date = $request->bookdate;

    $rawSQL = "SELECT loads.loadid, loads.loadnumber, (loadslotavailable - COUNT(loads_skydivers.loadid)) as slotavailable FROM loads, loads_skydivers
           WHERE loads.loadid = loads_skydivers.loadid
           AND date = '$date'
           GROUP BY loads_skydivers.loadid
           DESC LIMIT 1";

    $result = $conn->query($rawSQL);
    if (!empty($conn->error)) {
        die($conn->error);
    }

    $loadnumberlast = 0;

    if (!empty($result->num_rows)) {
        $r = mysqli_fetch_assoc($result);
        $loadnumberlast = $r['loadnumber'];
        $slotavailable = $r['slotavailable'];
        $loadid = $r['loadid'];
    }

    if ((empty($result->num_rows) && $result->num_rows == 0) || $slotavailable < 2) {
        // No load found, create new load
        while ($conn->more_results()) {
            $conn->next_result();
            if ($res = $conn->store_result()) // added closing bracket
            {
                $res->free();
            }
        }

        $rawSQL = "INSERT INTO `easymanifest`.`loads`
                            (`loadnumber`,
                            `date`,
                            `aircraft`,
                            `takeofftime`,
                            `turning`,
                            `altitude`,
                            `pilot`,
                            `loadslotavailable`)
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

        $result = $conn->query($rawSQL);
        if (!empty($conn->error)) {
            die($conn->error);
        }

        while ($conn->more_results()) {
            $conn->next_result();
            if ($res = $conn->store_result()) // added closing bracket
            {
                $res->free();
            }
        }

        $rawSQL = "SELECT * FROM loads WHERE date = '" . $date . "' ORDER BY loadnumber DESC LIMIT 1;";

        $result = $conn->query($rawSQL);
        if (!empty($conn->error)) {
            die($conn->error);
        }

        $r = mysqli_fetch_assoc($result);
        $loadid = $r['loadid'];

    }

// Search for adecuate TI
// Select looking for TI with less jumps and check weigth
    $rawSQL = "
SELECT vTIs.id as TI, (count(*) + vTIs.jumpsnumberset) as TIcount, (sum(weight)/count(*)) as weightagv FROM
(SELECT vTI.id, vTI.jumpsnumberset, loads_skydivers.id as jumpid FROM (SELECT * FROM tandem_bookings WHERE isTandemInstructor = 'Y'
AND loggedin = 1 AND tandem_bookings.id NOT IN (SELECT skydiverid FROM loads_skydivers WHERE loadid = $loadid)
) as vTI LEFT JOIN loads_skydivers
ON  vTI.id = loads_skydivers.skydiverid) as vTIs LEFT JOIN
(SELECT skydiverid as customer, tandem_bookings.weight, loads_skydivers.id as id FROM loads_skydivers, tandem_bookings
WHERE LEFT(jumptype,2) = 'TL' AND loads_skydivers.skydiverid = tandem_bookings.id) as vweight
ON vTIs.jumpid = vweight.id
GROUP BY vTIs.id ORDER BY TICount, weightagv LIMIT 1;";

    $result = $conn->query($rawSQL);
    if (!empty($conn->error)) {
        die($conn->error);
    }

    $r = mysqli_fetch_assoc($result);
    $tandemid = $r['TI'];

    while ($conn->more_results()) {
        $conn->next_result();
        if ($res = $conn->store_result()) // added closing bracket
        {
            $res->free();
        }
    }

    $id = $loadid . $studentid . $tandemid;

    $rawSQL = "INSERT INTO `easymanifest`.`loads_skydivers` VALUES
                    (0, $id, $loadid, $studentid, 'TL1'),
                    (0, $id, $loadid, $tandemid, 'TI-HC');
           ";

    $result = $conn->query($rawSQL);
    if (!empty($conn->error)) {
        var_dump($conn->error);
        $error = array('error' => 'error');
        print json_encode($error);
        die();
    }


// Order TI-Paxs

    $rawSQL = "
SELECT loads_skydivers.*, tandem_bookings.weight
FROM loads_skydivers, tandem_bookings
WHERE loads_skydivers.loadid = $loadid AND tandem_bookings.id = loads_skydivers.skydiverid
AND LEFT(loads_skydivers.jumptype,2) = 'TL' ORDER BY tandem_bookings.weight;";

    $result = $conn->query($rawSQL);
    if (!empty($conn->error)) {
        die($conn->error);
    }

    while ($r = mysqli_fetch_assoc($result)) {
        $customers[] = $r;
    }


    while ($conn->more_results()) {
        $conn->next_result();
        if ($res = $conn->store_result()) // added closing bracket
        {
            $res->free();
        }
    }

    $rawSQL = "
SELECT vTIs.id as TI, (sum(weight)/count(*)) as weightagv FROM
(SELECT vTI.id, vTI.jumpsnumberset, loads_skydivers.id as jumpid FROM (SELECT * FROM tandem_bookings WHERE id IN
(SELECT skydiverid FROM loads_skydivers WHERE LEFT(jumptype,2) = 'TI' and loads_skydivers.loadid = $loadid)
) as vTI LEFT JOIN loads_skydivers
ON  vTI.id = loads_skydivers.skydiverid) as vTIs LEFT JOIN
(SELECT skydiverid as customer, tandem_bookings.weight, loads_skydivers.id as id FROM loads_skydivers, tandem_bookings
WHERE LEFT(jumptype,2) = 'TL' AND loads_skydivers.skydiverid = tandem_bookings.id AND loads_skydivers.loadid != $loadid) as vweight
ON vTIs.jumpid = vweight.id
GROUP BY vTIs.id ORDER BY weightagv DESC;
";

    $result = $conn->query($rawSQL);
    if (!empty($conn->error)) {
        die($conn->error);
    }

    while ($r = mysqli_fetch_assoc($result)) {
        $TI[] = $r;
    }

    $rawSQL = "";

    for ($x = 0; $x <= (sizeof($customers) - 1); $x++) {
        $rawSQL = $rawSQL . "UPDATE loads_skydivers SET
                id = " . $customers[$x]['loadid'] . $customers[$x]['skydiverid'] . $TI[$x]['TI'] . "
                WHERE id = " . $customers[$x]['id'] . " AND LEFT(jumptype,2) = 'TL';
          UPDATE loads_skydivers SET
                id = " . $customers[$x]['loadid'] . $customers[$x]['skydiverid'] . $TI[$x]['TI'] . " ,
                skydiverid = " . $TI[$x]['TI'] . "
                WHERE id = " . $customers[$x]['id'] . " AND LEFT(jumptype,2) = 'TI';";
    }

    if (!$conn->multi_query($rawSQL)) {
        die($conn->error);
    };


}

?>

