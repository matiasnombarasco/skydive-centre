<?php
/**
 * Created by PhpStorm.
 * User: saresca
 * Date: 2/25/16
 * Time: 11:51 a.m.
 */

if (isset($_COOKIE["easymanifest"])) {

    include 'config.php';

    $conn = new mysqli($servername, $username, $password, $db);

    if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
    }

    $postdata = file_get_contents("php://input");
    $request = json_decode($postdata, false);

    $creator = $request->creator;
    $date = $request->date;
    $loads_skydivers_reg = $request->loads_skydivers_reg;
    $loads_skydivers_delete = $request->loads_skydivers_delete;

    $order = 0;

    $rawSQL = '';
    $rawSQLloads = '';

    if (count($loads_skydivers_reg) > 0) {
        $loads_values = '';
        $loads_skydivers_values = '';

        foreach ($loads_skydivers_reg as $loadreg) {

            $autoid = $loadreg->autoid;
            $skydiverid = $loadreg->skydiverid;
            $jumptypid = $loadreg->jumptypeid;
            $instructor = $loadreg->instructor;
            $priceslots = $loadreg->priceslots;
            $price = $loadreg->price;
            $loadnumber = $loadreg->loadnumber;
            $loadid = $loadreg->loadid;

            if ($loadreg->loadid != null) {
                $loads_values .= "($loadid, $loadnumber, '$date', 'LV-HBB', 0, 'Y', '3000', 0, 4),";
            }

            if ($loadreg->autoid != null) {
                $loads_skydivers_values .= "($autoid, $loadid, $skydiverid, $jumptypid, $instructor, $order, $priceslots, $price),";
            };

            $order = $order + 1;
        };

        if ($loads_values != '') {
            $rawSQLloads = "INSERT INTO loads VALUES " . rtrim($loads_values, ',') . " ON DUPLICATE KEY UPDATE
                        loadid = VALUES(loadid),
                        loadnumber = VALUES(loadnumber);";
        }

        if ($loads_skydivers_values != '')
        {
            $rawSQLInsert = "INSERT INTO loads_skydivers VALUES " . rtrim($loads_skydivers_values, ',') . " ON DUPLICATE KEY UPDATE
                                    loadid = VALUES(loadid),
                                    skydiverid = VALUES(skydiverid),
                                    jumptype = VALUES(jumptype),
                                    instructor = VALUES(instructor),
                                    grouporder = VALUES(grouporder);";
        }
    }


    if (count($loads_skydivers_delete) > 0) {
        $loads_values_delete = '';
        $loads_skydivers_values_delete = '';

        foreach ($loads_skydivers_delete as $loadreg) {

            // if only load delete
            if ($loadreg->autoid == null) {
                $loads_values_delete .= $loadreg->loadid . ",";
            }
            else
            {
                $loads_skydivers_values_delete .= $loadreg->autoid . ",";
            }
        }

        if ($loads_values_delete != '') {
            $rawSQLDelete = "DELETE FROM loads WHERE loadid IN (" . rtrim($loads_values_delete, ',') . ");";
        }

        if ($loads_skydivers_values_delete != '')
        {
            $rawSQLDelete .= "DELETE FROM loads_skydivers WHERE autoid IN (" . rtrim($loads_skydivers_values_delete, ',') . ");";
        }
        $rawSQLDelete = "DELETE FROM loads WHERE loadid NOT IN (SELECT loadid FROM loads_skydivers);";
    }

    mysqli_set_charset($conn, "utf8");

    $rawSQL = "SET AUTOCOMMIT=0; START TRANSACTION;";
    if (isset($loadid)) {
        $rawSQL .= "DELETE FROM loads_skydivers WHERE LEFT(loadid, 8) = LEFT($loadid,8);";
    }
    else
    {
        $loadid = $loads_skydivers_delete[0]->loadid;
        $rawSQL .= "DELETE FROM loads_skydivers WHERE LEFT(loadid, 8) = LEFT($loadid,8);";
    }

    if (!$conn->multi_query($rawSQL)) {
        $error = array('error' => 'error',
            'dump' => $rawSQL);
        $conn->query('rollback;');
        print json_encode($error);
        die();
    };

    while($conn->more_results())
    {
        $conn->next_result();
        if($res = $conn->store_result()) // added closing bracket
        {
            $res->free();
        }
    }

    if ($rawSQLInsert) {
        if (!$conn->query($rawSQLInsert)) {
            $error = array('error' => 'error',
                'dump' => $rawSQLInsert);
            $conn->query('rollback;');
            print json_encode($error);
            die();
        };
    };

    if ($rawSQLloads) {
        if (!$conn->query($rawSQLloads)) {
            $error = array('error' => 'error',
                'dump' => $rawSQLloads);
            $conn->query('rollback;');
            print json_encode($error);
            die();
        };
    }

    if ($rawSQLDelete) {
        if (!$conn->query($rawSQLDelete)) {
            $error = array('error' => 'error',
                'dump' => $rawSQLDelete);
            $conn->query('rollback;');
            print json_encode($error);
            die();
        };
    };

    if (!$conn->query('commit;')) {
        $error = array('error' => 'error',
            'dump' => $rawSQLDelete);
        print json_encode($error);
        die();
    };



    $pusher_date = $date;
    $creator = $request->creator;
    include('pusher.php');
}

?>

