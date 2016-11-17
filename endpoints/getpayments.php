<?php
/**
 * Created by PhpStorm.
 * User: saresca
 * Date: 11/12/16
 * Time: 12:41 a.m.
 */

//if (isset($_SESSION['username'])) {

    include 'config.php';

    $querydate = $_GET['date'];

    // Create connection
    $conn = new mysqli($servername, $username, $password, $db);

    // Check connection
    if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
    }

    $rawSQL = "SELECT CASH.firstname, CASH.lastname, FLOOR(CASH.cash) as cash, FLOOR(DEPOSIT.deposit) AS deposit, FLOOR(CASH.cash + DEPOSIT.deposit) as control FROM
    (SELECT 	tandem_bookings.id,
                                                tandem_bookings.firstname,
                                                tandem_bookings.lastname,
                                                vpayments.amount as cash


                                        FROM tandem_bookings LEFT JOIN
                                             (SELECT id_booking, SUM(net_received_amount) AS amount FROM payments WHERE deleted = 0 AND type = 'CASH' GROUP BY id_booking) as vpayments
                                                ON tandem_bookings.id = vpayments.id_booking,
                                             group_bookings LEFT JOIN slots_booking_date
                                                ON slots_booking_date.slot_id = group_bookings.booking_datetime_id
                                        WHERE tandem_bookings.groupid = group_bookings.groupid AND
                                              tandem_bookings.deleted = 0 AND
                                              tandem_bookings.id IN (SELECT skydiverid FROM loads_skydivers) AND
                                              group_bookings.date=" . $querydate . "
    ) AS CASH,
    (SELECT 	tandem_bookings.id,
                                                tandem_bookings.firstname,
                                                tandem_bookings.lastname,
                                                ((tandem_bookings.deposit - (tandem_bookings.deposit/100*6)) +  coalesce(vpayments.amount, 0)) as deposit


                                        FROM tandem_bookings LEFT JOIN
                                             (SELECT id_booking, SUM(net_received_amount) AS amount FROM payments WHERE deleted = 0 AND type = 'MP' GROUP BY id_booking) as vpayments
                                                ON tandem_bookings.id = vpayments.id_booking,
                                             group_bookings LEFT JOIN slots_booking_date
                                                ON slots_booking_date.slot_id = group_bookings.booking_datetime_id
                                        WHERE tandem_bookings.groupid = group_bookings.groupid AND
                                              tandem_bookings.deleted = 0 AND
                                              tandem_bookings.id IN (SELECT skydiverid FROM loads_skydivers) AND
                                              group_bookings.date=" . $querydate . "
    ) AS DEPOSIT
    WHERE CASH.id = DEPOSIT.id";

    $result = $conn->query($rawSQL);
    if (!empty($conn->error)) {
        $error = array('error' => 'error',
        'dump' => $rawSQL);
        print json_encode($error);
        die();
    }

    $rows = [];
    if (!empty($result->num_rows) && $result->num_rows > 0) {
        // output the result object as an array and the make it json! and echo it, so u can see it in the screen.
        while ($r = mysqli_fetch_assoc($result)) {
            $rows[] = array(
                'firstname' => $r['firstname'],
                'lastname' => $r['lastname'],
                'cash' => isset($r['cash']) ? $r['cash'] : 0,
                'deposit' => isset($r['deposit']) ? $r['deposit'] : 0,
                'control' => isset($r['control']) ? $r['control'] : 0);
        }
    }

    print json_encode($rows);

//}
?>