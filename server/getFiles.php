<?php
  require_once "model/response.php";
  require_once "model/database.php";
  require_once "model/logger.php";

  Response::create(function($dtoIn) {
    $sql = "SELECT *
            FROM serial RIGHT JOIN soubor ON serial.id = serial
              JOIN pripona ON soubor.pripona = pripona.id
            WHERE pripona.pripona NOT IN ('php', 'html') %s
            ORDER BY datum DESC";

    $filter = "";

    if (isset($dtoIn["type"])) {
      $filter = $dtoIn["type"] == 5 ? "AND serial IS NULL" : sprintf("AND serial = %d", $dtoIn["type"]);
    }

    $data = Database::getMany(sprintf($sql, $filter), $dtoIn);

    return $data;
  });
?>
