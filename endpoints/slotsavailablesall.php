<?php

if (isset($_COOKIE["easymanifest"])) {

    include 'config.php';
    $conn = new mysqli($servername, $username, $password, $db);
    if ($conn->connect_error) { die("Connection failed: " . $conn->connect_error);}
    $postdata = file_get_contents("php://input");
    $request = json_decode($postdata, false);


    if (isset($request->date)) {
        $bookdate = $request->date;
    }

    if (isset($bookdate)) {

        $rawSQL = "SELECT * FROM (
                        SELECT slots_booking_date.slot_id,
                               slots_booking_date.slot_date,
                               slots_booking_date.slot_time,
                               (slots_booking_date.slot_available - coalesce(tBusySlots.slotcount,0)) as slot_avaialables
                               FROM slots_booking_date
                               LEFT JOIN (SELECT group_bookings.booking_datetime_id,
                                                 COUNT(tandem_bookings.id) as slotcount
                                                 FROM tandem_bookings, group_bookings
                                                 WHERE tandem_bookings.deleted = 0 AND
                                                 tandem_bookings.groupid = group_bookings.groupid
                                                 GROUP BY group_bookings.booking_datetime_id) AS tBusySlots
                                ON slots_booking_date.slot_id = tBusySlots.booking_datetime_id
                                WHERE slots_booking_date.slot_date >= '$bookdate'
                        ) AS slots
                        ORDER BY slot_time;";

        $result = $conn->query($rawSQL);

        if (!empty($conn->error)) {
            $error = array('error' => 'error', 'dump' => $rawSQL);
            print json_encode($error);
            die();
        }

        $rows = [];
        if (!empty($result->num_rows) && $result->num_rows > 0) {
            // output the result object as an array and the make it json! and echo it, so u can see it in the screen.
            while ($r = mysqli_fetch_assoc($result)) {
                $rows[] = array(
                    'slot_date' => $r['slot_date'],
                    'value' => $r['slot_id'],
                    'label' => $r['slot_time'],
                    'slot_available' => $r['slot_available']);
            }
        }

        print json_encode($rows, JSON_NUMERIC_CHECK);
    }
}
?>
