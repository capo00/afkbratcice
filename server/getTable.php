<?php
  require_once "model/response.php";
  require_once "model/database.php";
  require_once "model/logger.php";

  Response::create(function($dtoIn) {     
    $season = $dtoIn["season"];

    $sql = sprintf(
             "SELECT idTymu, nazev,
                SUM(V) + SUM(VP) + SUM(PP) + SUM(P) AS 'zapasy',
                SUM(V) AS 'vyhry',
                SUM(VP) AS 'vyhrane_penalty',
                SUM(PP) AS 'prohrane_penalty',
                SUM(P) AS 'prohry',
                SUM(GV) AS 'golyVst',
                SUM(GO) AS 'golyObd',
                SUM(GV) - SUM(GO) AS 'rozdil',
                SUM(V) * 3  + SUM(VP) * 2 + SUM(PP) * 1 AS 'body'
              FROM(
                SELECT idD AS 'idTymu',
                  SUM(IF(golyD > golyH AND penalty IS NULL, 1, 0)) AS 'V',
                  SUM(IF(penalty = idD, 1, 0)) AS 'VP',
                  SUM(IF(penalty = idH, 1, 0)) AS 'PP',
                  SUM(IF(golyD < golyH AND penalty IS NULL, 1, 0)) AS 'P',
                  SUM(golyD) AS 'GV',
                  SUM(golyH) AS 'GO'
                FROM `zapas`
                WHERE golyD IS NOT NULL AND golyH IS NOT NULL AND kolo IS NOT NULL
                  AND datum > '%s-07-01 00:00:00'
                GROUP BY idD

                UNION ALL

                SELECT idH AS 'idTymu',
                  SUM(IF(golyD < golyH AND penalty IS NULL, 1, 0)) AS 'V',
                  SUM(IF(penalty = idH, 1, 0)) AS 'VP',
                  SUM(IF(penalty = idD, 1, 0)) AS 'PP',
                  SUM(IF(golyD > golyH AND penalty IS NULL, 1, 0)) AS 'P',
                  SUM(golyH) AS 'GV',
                  SUM(golyD) AS 'GO'
                FROM `zapas`
                WHERE golyD IS NOT NULL and golyH IS NOT NULL AND kolo IS NOT NULL
                  AND datum > '%s-07-01 00:00:00'
                GROUP BY idH
              ) tmp RIGHT JOIN tym ON id = idTymu
              WHERE vek = 'M' AND rok%s = 1
              GROUP BY nazev
              ORDER BY body DESC, rozdil DESC, golyVst DESC, zapasy DESC, nazev ASC",
             $season,
             $season,
             $season
           );

    $data = Database::getMany($sql, $dtoIn);

    return $data;
  });
?>
