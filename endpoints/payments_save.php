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
    if ($conn->connect_error) {die("Connection failed: " . $conn->connect_error);}
    $postdata = file_get_contents("php://input");
    $requestArray = json_decode($postdata, true);

    $info = $requestArray['info'];

    foreach($requestArray['payments'] as $request) {
        $payment_date = $request['payment_date'];
        $id_booking = $request['id_booking'];
        $type = $request['type'];
        $net_received_amount = $request['net_received_amount'];
        $deleted = isset($request['deleted']) ? $request['deleted'] : '0';

        $values .= "('$payment_date', '$id_booking', '$type', '$net_received_amount', '$net_received_amount', $deleted),";
    };

    $rawSQL = "INSERT INTO payments (payment_date,
                                     id_booking,
                                     type,
                                     net_received_amount,
                                     amount,
                                     deleted)
                                     VALUES " . rtrim($values, ',') .
                            " ON DUPLICATE KEY UPDATE
                                payment_date = VALUES(payment_date),
                                id_booking = VALUES(id_booking),
                                type = VALUES(type),
                                net_received_amount = VALUES(net_received_amount),
                                amount = VALUES(net_received_amount),
                                deleted = VALUES(deleted);";

    $result = $conn->query($rawSQL);

    if ($conn->connect_error) {
        $error = array('error' => 'error');
        print json_encode($error);
        die();
    }

    if (isset($info->querydate))
    {
        $creator = $info->creator;
        $pusher_date = $info->querydate;
        include('pusher.php');
    };

}

?>

