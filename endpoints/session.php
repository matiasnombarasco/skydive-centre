<?php
/**
 * Created by PhpStorm.
 * User: saresca
 * Date: 3/3/16
 * Time: 3:04 p.m.
 */

session_start();

$row = array('session' => 'false');

if (isset($_SESSION['username'])) {
    $row = array(
        'session' => 'true'
    );
};

print json_encode($row);

?>

