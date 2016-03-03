<?php
/**
 * Created by PhpStorm.
 * User: saresca
 * Date: 1/26/16
 * Time: 2:33 p.m.
 */

session_start();

if (isset($_SESSION['username'])) {

    $postdata = file_get_contents("php://input");
    $request = json_decode($postdata, false);

    ob_start();
    var_dump($request);
    $result = ob_get_clean();

    $myfile = fopen("payments.txt", "a") or die("Unable to open file!");
    fwrite($myfile, $request);
    fclose($myfile);


    if ($_GET["topic"] == 'payment') {
        $payment_info = $mp->get("/collections/notifications/" . $_GET["id"]);
        $merchant_order_info = $mp->get("/merchant_orders/" . $payment_info["response"]["collection"]["merchant_order_id"]);
// Get the merchant_order reported by the IPN.
    } else if ($_GET["topic"] == 'merchant_order') {
        $merchant_order_info = $mp->get("/merchant_orders/" . $_GET["id"]);
    }

    /*
    if ($merchant_order_info["status"] == 200) {
        // If the payment's transaction amount is equal (or bigger) than the merchant_order's amount you can release your items
        $paid_amount = 0;

        foreach ($merchant_order_info["response"]["payments"] as  $payment) {
            if ($payment['status'] == 'approved'){
                $paid_amount += $payment['transaction_amount'];
            }
        }

        if($paid_amount >= $merchant_order_info["response"]["total_amount"]){
            if(count($merchant_order_info["response"]["shipments"]) > 0) { // The merchant_order has shipments
                if($merchant_order_info["response"]["shipments"][0]["status"] == "ready_to_ship"){
                    print_r("Totally paid. Print the label and release your item.");
                }
            } else { // The merchant_order don't has any shipments
                print_r("Totally paid. Release your item.");
            }
        } else {
            print_r("Not paid yet. Do not release your item.");
        }
    }
    */

    ob_start();
    var_dump($payment_info);
    $result = ob_get_clean();

    ob_start();
    var_dump($merchant_order_info);
    $result2 = ob_get_clean();

    $todo = date('Y-m-d H:i:s') . $_GET["id"] . $_GET["topic"] . $_SERVER['REQUEST_URI'] . '\n' . $result . $result2;

//$postdata = file_get_contents("php://input");
//$request = json_decode($postdata, false);
//ob_start();
//var_dump($request);
//$result = ob_get_clean();

    $myfile = fopen("payments.txt", "a") or die("Unable to open file!");
    fwrite($myfile, $todo);
    fclose($myfile);

}
?>

