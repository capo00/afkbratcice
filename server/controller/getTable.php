<?php
  require_once "../config.php";
  require_once "../model/response.php";
  require_once "../model/database.php";
  require_once "../model/logger.php";

  Response::create(function($dtoIn) {
    $season = $dtoIn["season"];

    if (!$season) {
      $season = date("Y");
      if (date("n") < 8) {
        $season -= 1;
      }
    }

    $team = isset($dtoIn["team"]) ? $dtoIn["team"] : Config::MEN;

    $sql = sprintf(
             "SELECT idTymu AS 'id', nazev AS 'name',
                SUM(V) + SUM(VP) + SUM(PP) + SUM(P) AS 'played',
                SUM(V) AS 'wins',
                SUM(VP) AS 'penaltyWins',
                SUM(PP) AS 'penaltyLosses',
                SUM(P) AS 'losses',
                SUM(GV) AS 'goalsFor',
                SUM(GO) AS 'goalsAgainst',
                SUM(GV) - SUM(GO) AS 'goalDifference',
                SUM(V) * 3  + SUM(VP) * 2 + SUM(PP) * 1 AS 'points'
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
              WHERE vek = '%s' AND rok%s = 1
              GROUP BY name
              ORDER BY points DESC, goalDifference DESC, goalsFor DESC, played DESC, name ASC",
             $season,
             $season,
             Config::getTeamShortcut($team),
             $season
           );

    $data = Database::getMany($sql, $dtoIn);

    return $data;
  });
?>
