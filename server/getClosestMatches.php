<?php
  require_once "model/response.php";
  require_once "model/database.php";
  require_once "model/logger.php";

  Response::create(function($dtoIn) {
    $data = Database::process(function($dtb) use($dtoIn) {
      $sql = 'SELECT zapas.id AS "id", kolo, datum, dom.nazev AS "domaci", hos.nazev AS "hoste", golyD, golyH, golyDP, golyHP, penalty
              FROM `tym` `dom` JOIN `zapas` ON dom.id = idD JOIN `tym` `hos` ON idH = hos.id
              WHERE (idD = %d OR idH = %d) %s
              ORDER BY datum DESC';
    
      $sqlLast = sprintf(
                  $sql,
                  $dtoIn["teamId"],
                  $dtoIn["teamId"],
                  "AND (golyD IS NOT NULL OR golyH IS NOT NULL)"
                 );
                 
      $sqlNext = sprintf(
                  $sql,
                  $dtoIn["teamId"],
                  $dtoIn["teamId"],
                  "AND (golyD IS NULL AND golyH IS NULL)"
                 );
                                  
      return array(
        "last" => $dtb->selectOne($sqlLast),
        "next" => $dtb->selectOne($sqlNext)
      );
    });    

    return $data;
  });
?>
