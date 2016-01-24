<?php
/**
 * Created by PhpStorm.
 * User: saresca
 * Date: 12/23/15
 * Time: 2:27 a.m.
 */

$slip = "deposits/slip" . $_REQUEST['groupid'];

move_uploaded_file($_FILES["image"]["tmp_name"], $slip);

?>

