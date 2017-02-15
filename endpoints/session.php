<?php
/**
 * Created by PhpStorm.
 * User: saresca
 * Date: 3/3/16
 * Time: 3:04 p.m.
 */

$row = array('session' => 'false');

if (isset($_COOKIE["easymanifest"])) {
    $row = array(
        'session' => 'true'
    );
};

print json_encode($row);

?>

