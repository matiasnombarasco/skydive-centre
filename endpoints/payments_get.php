<?php
/**
 * Created by PhpStorm.
 * User: saresca
 * Date: 11/11/16
 * Time: 8:42 p.m.
 */


if (isset($_COOKIE["easymanifest"]))
{

    include 'config.php';

    $conn = new mysqli($servername, $username, $password, $db);

    if ($conn->connect_error)
    {
        die("Connection failed: " . $conn->connect_error);
    }

    $postdata = file_get_contents("php://input");
    $request = json_decode($postdata, false);

    if (isset($request->id_booking)) {
        $rawSQL = "SELECT * FROM payments WHERE deleted = 0 AND id_booking = " . $request->id_booking . ";";

        $result = $conn->query($rawSQL);

        if ($conn->connect_error) {
            $error = array('' => 'error');
            print json_encode($error);
            die();
        }

        $rows = array();
        if (!empty($result->num_rows) && $result->num_rows > 0) {
            while ($r = mysqli_fetch_assoc($result)) {
                $rows[] = array(
                    'type' => $r['type'],
                    'mp_id' => isset($r['mp_id']) ? $r['mp_id'] : 0,
                    'date_approved' => isset($r['date_approved']) ? $r['date_approved'] : '',
                    'mercadopago_fee' => isset($r['mercadopago_fee']) ? $r['mercadopago_fee'] : 0,
                    'net_received_amount' => $r['net_received_amount'],
                    'amount' => $r['amount'],
                    'payment_date' => $r['payment_date'],
                    'deleted' => $r['deleted'],
                    'id_booking' => $r['id_booking']);
            }
        }

        print json_encode($rows, JSON_NUMERIC_CHECK);
    }
}

?>