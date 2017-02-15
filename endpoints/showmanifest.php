<?php
/**
 * Created by PhpStorm.
 * User: saresca
 * Date: 2/25/16
 * Time: 11:51 a.m.
 */

if (isset($_COOKIE["easymanifest"])) {

    include 'config.php';

    $rawSQL = '';

    $conn = new mysqli($servername, $username, $password, $db);

    if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
    }

    $rows = [];
    $rawSQL = '';

    if (isset($_GET["querydate"]))
    {
        $querydate = $_GET["querydate"];
    }

    $rawSQL = "SELECT vloads.loadnumber,
                      vloads.loadid,
                      vloads.Rpriceslots as priceslots,
                      vloads.Rprice as price,
                      vloads.jumptypeid,
                      vloads.description,
                      vloads.jumptype,
                      vloads.altitude,
                      vloads.video,
                      vloads.skydiverid,
                      (CONCAT(UCASE(LEFT(firstname, 1)),
                      LCASE(SUBSTRING(firstname, 2)))) as skydiver,
                      tandem_bookings.weight,
                      vloads.instructor, vloads.autoid
              FROM
              (SELECT * FROM
				  (SELECT loads.loadnumber,
						  loads.loadid,
						  loads_skydivers.autoid,
						  loads_skydivers.skydiverid,
						  loads_skydivers.jumptype as jumptypeid,
						  loads_skydivers.instructor,
						  loads_skydivers.grouporder,
						  loads_skydivers.priceslots as Rpriceslots,
						  loads_skydivers.price as Rprice
					FROM loads
					LEFT JOIN loads_skydivers ON loads.loadid = loads_skydivers.loadid
					WHERE date = '$querydate'
				  ) as vloads1
              LEFT JOIN jumpstypereq ON vloads1.jumptypeid = jumpstypereq.id
              ) as vloads
              LEFT JOIN tandem_bookings
              ON vloads.skydiverid = tandem_bookings.id
              ORDER BY vloads.loadnumber, grouporder, autoid;
              ";

    mysqli_set_charset($conn, "utf8");
    $result = $conn->query($rawSQL);
    if (!empty($conn->error)) {
        die($conn->error);
    }

    if (!empty($result->num_rows) && $result->num_rows > 0) {
        while ($r = mysqli_fetch_assoc($result)) {
            $rows[] = array(
                'loadnumber' => $r['loadnumber'],
                'skydiver' => $r['skydiver'],
                'jumptypeid' => $r['jumptypeid'],
                'jumptype' => $r['jumptype'],
                'description' => $r['description'],
                'altitude' => $r['altitude'],
                'video' => $r['video'],
                'loadid' => $r['loadid'],
                'weight' => $r['weight'],
                'skydiverid' => $r['skydiverid'],
                'instructor' => $r['instructor'],
                'autoid' => $r['autoid'],
                'priceslots' => $r['priceslots'],
                'price' => $r['price']
            );
        }
    }
    else
    {
        $rows[] = '';
    }

    if (!isset($pusherquery)) {
        print json_encode($rows, JSON_NUMERIC_CHECK);
    }
}

?>

