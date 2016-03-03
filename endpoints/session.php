<?php
/**
 * Created by PhpStorm.
 * User: saresca
 * Date: 3/3/16
 * Time: 3:04 p.m.
 */

session_start();

$row[] = array('session' => 'true');

if (isset($_SESSION['username'])) {
    $rows[] = array(
        'session' => 'true'
    );
}
}

print json_encode($rows);

}

?>

