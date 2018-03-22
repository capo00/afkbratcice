<?php
  require_once "../model/response.php";
  require_once "../model/database.php";
  require_once "../model/logger.php";

  Response::create(function($dtoIn) {
    $condition = "";

    if ($dtoIn["period"] === "last") {
      $condition = "AND (golyD IS NOT NULL OR golyH IS NOT NULL)";
    } else if ($dtoIn["period"] === "next") {
      $condition = "AND (golyD IS NULL AND golyH IS NULL)";
    }

    $sql = sprintf(
             'SELECT zapas.id AS "id", kolo, datum, dom.nazev AS "domaci", hos.nazev AS "hoste", golyD, golyH, golyDP, golyHP, dom.vek AS "vek", penalty
              FROM `tym` `dom` JOIN `zapas` ON dom.id = idD JOIN `tym` `hos` ON idH = hos.id
              WHERE (idD = "%d" OR idH = "%d") %s
              ORDER BY datum DESC',
             $dtoIn["teamId"],
             $dtoIn["teamId"],
             $condition
           );

    $data = Database::getMany($sql, $dtoIn);

    return $data;
  });
?>
