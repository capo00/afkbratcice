<?php
  require_once "../config.php";
  require_once "../model/response.php";
  require_once "../model/database.php";
  require_once "../model/logger.php";

  Response::create(function($dtoIn) {
    $data = Database::process(function($dtb) use($dtoIn) {
      $sql = 'SELECT zapas.id AS "id", kolo AS "round", datum AS "date", dom.nazev AS "home", hos.nazev AS "guest",
              golyD AS "goalsFor", golyH AS "goalsAgainst", golyDP AS "goalsForHalf", golyHP AS "goalsAgainstHalf", penalty
              FROM `tym` `dom` JOIN `zapas` ON dom.id = idD JOIN `tym` `hos` ON idH = hos.id
              WHERE (idD = %d OR idH = %d) %s';

      $teamId = Config::getTeamId($dtoIn["team"]);

      $dataLast = $dtb->selectOne(sprintf($sql,
                                          $teamId,
                                          $teamId,
                                          "AND (golyD IS NOT NULL OR golyH IS NOT NULL) ORDER BY datum DESC"
                                         ));

      $dataNext = $dtb->selectOne(sprintf($sql,
                                          $teamId,
                                          $teamId,
                                          "AND golyD IS NULL AND golyH IS NULL AND datum IS NOT NULL ORDER BY datum ASC"
                                         ));

      if ($dataLast["date"]) {
        $dataLast["date"] = date("c", strtotime($dataLast["date"]));
      }
      if ($dataNext["date"]) {
        $dataNext["date"] = date("c", strtotime($dataNext["date"]));
      }

      return array(
        "last" => $dataLast,
        "next" => $dataNext
      );
    });

    return $data;
  });
?>
