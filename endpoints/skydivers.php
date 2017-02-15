<?php
/**
 * Created by PhpStorm.
 * User: saresca
 * Date: 12/2/16
 * Time: 11:44 p.m.
 */

if (isset($_COOKIE["easymanifest"])) {

    include 'config.php';

    $conn = new mysqli($servername, $username, $password, $db);

    if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
    }


    $rawSQL = "SELECT tandem_bookings.*, total FROM tandem_bookings
               LEFT JOIN
               (SELECT
                    `Totals`.`skydiverid` AS `skydiverid`,
                    SUM(`Totals`.`amount`) AS `total`
                FROM
                    (SELECT
                        `skydiver_reg`.`skydiverid` AS `skydiverid`,
                            `skydiver_reg`.`date` AS `date`,
                            `skydiver_reg`.`loadnumber` AS `loadnumber`,
                            `skydiver_reg`.`description` AS `description`,
                            `skydiver_reg`.`amount` AS `amount`,
                            `skydiver_reg`.`type` AS `type`
                    FROM
                    (SELECT
                        `easymanifest`.`loads_skydivers`.`skydiverid` AS `skydiverid`,
                            `easymanifest`.`loads`.`date` AS `date`,
                            `easymanifest`.`loads`.`loadnumber` AS `loadnumber`,
                            `easymanifest`.`jumpstypereq`.`description` AS `description`,
                            -(`easymanifest`.`loads_skydivers`.`price`) AS `amount`,
                            '' AS `type`
                    FROM
                        (`easymanifest`.`tandem_bookings`
                    LEFT JOIN ((`easymanifest`.`loads_skydivers`
                    LEFT JOIN `easymanifest`.`loads` ON ((`easymanifest`.`loads_skydivers`.`loadid` = `easymanifest`.`loads`.`loadid`)))
                    LEFT JOIN `easymanifest`.`jumpstypereq` ON ((`easymanifest`.`loads_skydivers`.`jumptype` = `easymanifest`.`jumpstypereq`.`id`))) ON (((`easymanifest`.`loads_skydivers`.`skydiverid` = `easymanifest`.`tandem_bookings`.`id`)
                        AND (`easymanifest`.`tandem_bookings`.`isCustomer` = 'N'))))
                    ORDER BY `easymanifest`.`loads`.`date` , `easymanifest`.`loads`.`loadnumber`) `skydiver_reg`

                    UNION SELECT
                        `easymanifest`.`payments`.`id_booking` AS `skydiverid`,
                            payments.payment_date,
                            99 AS `99`,
                            'PAYMENT' AS `PAYMENT`,
                            `easymanifest`.`payments`.`amount` AS `amount`,
                            `easymanifest`.`payments`.`type` AS `type`
                    FROM
                        (`easymanifest`.`tandem_bookings`
                    LEFT JOIN `easymanifest`.`payments` ON (((`easymanifest`.`payments`.`id_booking` = `easymanifest`.`tandem_bookings`.`id`)
                        AND (`easymanifest`.`tandem_bookings`.`isCustomer` = 'N'))))
                    WHERE
                        (`easymanifest`.`payments`.`deleted` = 0)
                    ORDER BY `date` , `loadnumber`) `Totals`
                GROUP BY `Totals`.`skydiverid`
                ) as vskydiver_account_total

               ON vskydiver_account_total.skydiverid = tandem_bookings.id
               WHERE iscustomer = 'N'
               ORDER BY tandem_bookings.firstname;";

    $result = $conn->query($rawSQL);
    if (!empty($conn->error)) {
        die($conn->error);
    }

    if (!empty($result->num_rows) && $result->num_rows > 0) {
        while ($r = mysqli_fetch_assoc($result)) {
            $rows[] = array(
                'id' => $r['id'],
                'firstname' => isset($r['firstname']) ? ucwords($r['firstname']) : '',
                'lastname' => isset($r['lastname']) ? ucwords($r['lastname']) : '',
                'email' => isset($r['email']) ? $r['email'] : '',
                'dni' => isset($r['DNI']) ? $r['DNI'] : '',
                'phone' => isset($r['phone']) ? $r['phone'] : '',
                'dob' => isset($r['dob']) ? $r['dob'] : '',
                'weight' => isset($r['weight']) ? $r['weight'] : '',
                'isTandemInstructor' => $r['isTandemInstructor'],
                'jumptypeid' => $r['jumptypeid'],
                'total' => $r['total']
            );
        }
    }
    else
    {
        $rows[] = array();
    }
    print json_encode($rows, JSON_NUMERIC_CHECK);
}

?>