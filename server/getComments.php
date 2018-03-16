<?php
  require_once "model/response.php";
  require_once "model/database.php";
  require_once "model/logger.php";

  Response::create(function($dtoIn) {
    $sql = "SELECT SQL_CALC_FOUND_ROWS *
            FROM diskuze
            ORDER BY cas desc";

    $data = Database::getMany($sql, $dtoIn);

    return $data;
  });
?>
