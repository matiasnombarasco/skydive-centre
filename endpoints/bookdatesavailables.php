<?php

include 'config.php';

// Create connection
$conn = new mysqli($servername, $username, $password, $db);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

$rawSQL = "SELECT slot_date, SUM(slotcount) as slotscount FROM (
                    SELECT slots_booking_date.slot_date,
                           (slots_booking_date.slot_available - coalesce(tBusySlots.slotcount,0)) as slotcount
                           FROM slots_booking_date
                           LEFT JOIN (SELECT group_bookings.booking_datetime_id,
                                             COUNT(tandem_bookings.id) as slotcount
                                             FROM tandem_bookings, group_bookings
                                             WHERE tandem_bookings.deleted = 0 AND
                                             tandem_bookings.groupid = group_bookings.groupid
                                             GROUP BY group_bookings.booking_datetime_id) AS tBusySlots
                            ON slots_booking_date.slot_id = tBusySlots.booking_datetime_id
                            WHERE slots_booking_date.slot_date > curdate()
                            ) AS slots
            GROUP BY slot_date;
          ";

$result = $conn->query($rawSQL);

if (!empty($conn->error)) {
    $error = array('error' => 'error');
    print json_encode($error);
    die();
}

if (!empty($result->num_rows) && $result->num_rows > 0) {
    while ($r = mysqli_fetch_assoc($result)) {
        if ($r['slotscount'] > 0) {
            $rows[] = array(
                'date' => $r['slot_date']);
        }
    }
}

print json_encode($rows);

?>
