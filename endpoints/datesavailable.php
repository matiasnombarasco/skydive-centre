<?php
/**
 * Created by PhpStorm.
 * User: saresca
 * Date: 1/31/16
 * Time: 11:37 p.m.
 */

//session_start();

//if (isset($_SESSION['username'])) {

    include 'config.php';

// Create connection
    $conn = new mysqli($servername, $username, $password, $db);

// Check connection
    if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
    }

    $postdata = file_get_contents("php://input");
    $request = json_decode($postdata, false);

    $datesavailable = "";
    if (isset($request->date)) {
        $date = $request->date;


        //$rawSql = "SELECT slot_date FROM (SELECT slot_date, sum(slot_available) as slotsavaiable FROM easymanifest.slots_booking_date GROUP BY slot_date) AS avaiables WHERE slotsavaiable > 0";
        $rawSql = "SELECT slot_time FROM easymanifest.slots_booking_date WHERE slot_date = '$date' AND slot_available > 0";
        $result = $conn->query($rawSql);

        if (!empty($conn->error)) {
            die($conn->error);
        }
        if (!empty($result->num_rows) && $result->num_rows > 0) {
            // output the result object as an array and the make it json! and echo it, so u can see it in the screen.
            while ($r = mysqli_fetch_assoc($result)) {
                $datesavailable[] = $r['slot_time'];
            }

        }
        print json_encode($datesavailable);
    }
//}
?>
