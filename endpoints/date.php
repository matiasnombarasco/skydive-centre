<?php
/**
 * Created by PhpStorm.
 * User: saresca
 * Date: 1/13/16
 * Time: 1:36 a.m.
 */
    date_default_timezone_set('America/Buenos_Aires');
    $date = date('Y-m-d');
    $rows[] = array(
        'date' => $date);
    print json_encode($rows);
?>
