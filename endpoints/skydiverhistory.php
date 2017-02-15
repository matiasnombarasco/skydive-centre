<?php
/**
 * Created by PhpStorm.
 * User: saresca
 * Date: 1/25/17
 * Time: 5:56 p.m.
 */


if (isset($_COOKIE["easymanifest"])) {

    include 'config.php';

    $rawSQL = '';

    $conn = new mysqli($servername, $username, $password, $db);

    if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
    }

    $postdata = file_get_contents("php://input");
    $request = json_decode($postdata, false);

    $id = $request->id;


    $rawSQL = "
                SELECT * FROM
                (
                    SELECT loads.date, loads.loadnumber, jumpstypereq.description, -loads_skydivers.price as amount, '' as type FROM loads_skydivers
                LEFT JOIN loads ON loads_skydivers.loadid = loads.loadid
                LEFT JOIN jumpstypereq ON loads_skydivers.jumptype = jumpstypereq.id
                WHERE skydiverid = $id
                ORDER BY date, loadnumber
                ) AS skydiver_reg

                UNION

                SELECT payments.payment_date, 99, 'PAYMENT', payments.amount, payments.type FROM payments WHERE deleted != 1 && id_booking = $id AND deleted = 0

                ORDER BY date, loadnumber;
              ";

    $result = $conn->query($rawSQL);
    if (!empty($conn->error)) {
        $error = array('error' => 'error',
            'dump' => $rawSQL);
        print json_encode($error);
        die();
    }

    $rows = [];

    if (!empty($result->num_rows) && $result->num_rows > 0) {
        while ($r = mysqli_fetch_assoc($result)) {
            $rows[] = array(
                'payment_date' => $r['date'],
                'loadnumber' => $r['loadnumber'],
                'description' => $r['description'],
                'amount' => $r['amount'],
                'type' => $r['type']
                );
        }
    }

    print json_encode($rows, JSON_NUMERIC_CHECK);

}
?>
