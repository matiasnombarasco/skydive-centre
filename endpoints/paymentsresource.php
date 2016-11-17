<?php
/**
 * Created by PhpStorm.
 * User: saresca
 * Date: 11/11/16
 * Time: 8:42 p.m.
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

    switch ($_SERVER['REQUEST_METHOD']) {
        case "POST":
            if ((isset($request->type)) && (isset($request->id)) && (isset($request->net_received_amount))) {
                $id_booking = $request->id;
                $type = $request->type;
                $net_received_amount = $request->net_received_amount;

                $date = date('Y-m-d H:i:s');

                $rawSQL = "INSERT INTO payments (type,
                                                 net_received_amount,
                                                 amount,
                                                 payment_date,
                                                 id_booking)
                                         VALUES ('" . $type . "',
                                                  " . $net_received_amount . ",
                                                  " . $net_received_amount . ",'
                                                  " . $date . "',
                                                  " . $id_booking . ")";


                $result = $conn->query($rawSQL);

                if ($conn->connect_error) {
                    $error = array('error' => 'error');
                    print json_encode($error);
                    die();
                }
            }
            else {
                if ((isset($request->id)) && (isset($request->delete))) {
                    $rawSQL = "UPDATE payments SET deleted = 1 WHERE id = " . $request->id . ";";

                    $result = $conn->query($rawSQL);

                    if ($conn->connect_error) {
                        $error = array('error' => 'error');
                        print json_encode($error);
                        die();
                    }
                } else {
                    if (isset($request->id)) {
                        $rawSQL = "SELECT * FROM payments WHERE deleted = 0 AND id_booking = " . $request->id . ";";

                        $result = $conn->query($rawSQL);

                        if ($conn->connect_error) {
                            $error = array('error' => 'error');
                            print json_encode($error);
                            die();
                        }

                        $rows = [];
                        if (!empty($result->num_rows) && $result->num_rows > 0) {
                            while ($r = mysqli_fetch_assoc($result)) {
                                $rows[] = array(
                                    'id' => $r['id'],
                                    'type' => $r['type'],
                                    'mp_id' => isset($r['mp_id']) ? $r['mp_id'] : 0,
                                    'date_approved' => isset($r['date_approved']) ? $r['date_approved'] : '',
                                    'mercadopago_fee' => isset($r['mercadopago_fee']) ? $r['mercadopago_fee'] : 0,
                                    'net_received_amount' => $r['net_received_amount'],
                                    'amount' => $r['amount'],
                                    'payment_date' => $r['payment_date'],
                                    'id_booking' => $r['id_booking']);
                            }
                        }

                        print json_encode($rows);

                    }
                }
            }
            break;
        case "DELETE":
            break;

        default:
            break;
    }
}

?>