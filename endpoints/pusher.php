<?php
/**
 * Created by PhpStorm.
 * User: saresca
 * Date: 12/24/16
 * Time: 10:32 a.m.
 */

//exit;

require('Pusher.php');

if (isset($_COOKIE["easymanifest"])) {

    $options = array(
        'encrypted' => true
    );
    $pusher = new Pusher(
        '1e138a11b344a3de1454',
        '40909923a0019250793d',
        '283921',
        $options
    );

    $estado = $pusher->get("/channels/paracaidismo");

    if ($estado["result"]["occupied"] == "true") {


        $pusher_date = date('Y-m-d',strtotime($pusher_date));
        $creator = isset($creator) ? $creator : '';


        $datasent = array(
            'manifest' => true,
            'bookings' => true,
            'date' => $pusher_date,
            'creator' => $creator
        );

        // push
        $pusher->trigger('paracaidismo', 'main', $datasent);
    }
}
?>

