<?php
/**
 * Created by PhpStorm.
 * User: saresca
 * Date: 11/11/16
 * Time: 11:32 p.m.
 */

require_once('mercadopago.php');

$mp = new MP ("5179497693280373", "Q1Gk3Xg5qaUaN3lamxdncuC8pPPffyV4");


$postdata = file_get_contents("php://input");
$request = json_decode($postdata, false);

$bookid = $request->bookid;
$price = $request->price;
$mpName = $request->mpName;
$mpEmail = $request->mpEmail;
$mpDNI = $request->mpDNI;

$preference_data = array(
    "items" => array(
        array(
            "title" => "Paracaidismo Rosario XXXXX - $bookid",
            "quantity" => 1,
            "currency_id" => "ARS",
            "unit_price" => $price,
            "picture_url" => "http://booking.paracaidismorosario.com/images/Cartel2015-500.jpg"
        )
    ),
    "payer" => array(
        "name" => $mpName,
        "email" => $mpEmail,
        "identification" => array(
            "number" => $mpDNI
        )
    ),
    "notification_url" => "http://booking.paracaidismorosario.com/endpoints/payments.php",
    "external_reference" => "XXXXX-" . $bookid
);

$preference = $mp->create_preference($preference_data);

$mpurl = $preference['response']['init_point'];

print($mpurl);

?>

