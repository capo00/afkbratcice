<?php
  require_once "../model/response.php";
  require_once "../model/database.php";
  require_once "../model/logger.php";

  Response::create(function($dtoIn) {
    $sql = sprintf(
             "SELECT login, jmeno, prijmeni, narozen, COUNT(zapas) AS 'zapasy', SUM(goly) AS 'goly', SUM(zluta) AS 'zlute', SUM(cervena) AS 'cervene'
              FROM hrac LEFT JOIN (
                SELECT hrac, zapas, goly, zluta, cervena
                FROM zapas LEFT JOIN ucast ON id = zapas
                WHERE kolo IS NOT NULL AND datum >= '%s-07-01 00:00:00' AND datum < '%s-07-01 00:00:00'
              ) `zapasy` ON login = hrac
              WHERE aktivni = 1 AND tym = '%s'
              GROUP BY login
              ORDER BY zapasy DESC, prijmeni, jmeno",
             $dtoIn["season"],
             $dtoIn["season"] + 1,
             $dtoIn["team"]
           );

    $data = Database::getMany($sql, $dtoIn);

    return $data;
  });
?>
