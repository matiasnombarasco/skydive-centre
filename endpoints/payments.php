<?php
/**
 * Created by PhpStorm.
 * User: saresca
 * Date: 1/26/16
 * Time: 2:33 p.m.
 */

    $postdata = file_get_contents("php://input");
    $request = json_decode($postdata, false);


    require_once "mercadopago.php";
    include 'config.php';

    $mp = new MP("5179497693280373", "Q1Gk3Xg5qaUaN3lamxdncuC8pPPffyV4");

    //$mp->sandbox_mode(TRUE);

    if ($_GET["topic"] == 'payment') {
        $payment_info = $mp->get("/collections/notifications/" . $_GET["id"]);
        $merchant_order_info = $mp->get("/merchant_orders/" . $payment_info["response"]["collection"]["merchant_order_id"]);
// Get the merchant_order reported by the IPN.
    } else if ($_GET["topic"] == 'merchant_order') {
        $merchant_order_info = $mp->get("/merchant_orders/" . $_GET["id"]);
    }

    ob_start();
    $result = ob_get_clean();

    ob_start();
    $result2 = ob_get_clean();

    $todo = date('Y-m-d H:i:s') . $_GET["id"] . $_GET["topic"] . $_SERVER['REQUEST_URI'] . '\n' . $result . $result2;

include 'config.php';

$conn = new mysqli($servername, $username, $password, $db);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

$mp_id = $_GET["id"];
$rawSQL = "INSERT INTO mp_payments (mp_id, log) VALUES ('" . $mp_id . "','" . $todo . " ');";

$result = $conn->query($rawSQL);
if (!empty($conn->error)) {
    die($conn->error);
}



?>

