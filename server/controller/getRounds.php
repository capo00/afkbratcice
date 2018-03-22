<?php
  require_once "../model/response.php";
  require_once "../model/database.php";
  require_once "../model/logger.php";

  Response::create(function($dtoIn) {
    $data = Database::process(function($dtb) use($dtoIn) {
      $sqlRounds = sprintf(
                    'SELECT kolo
                      FROM `zapas` join `tym` on idD = tym.id
                      WHERE kolo IS NOT NULL AND vek = "%s"
                        AND datum > "%d-07-01 00:00:00"
                        AND datum < "%d-07-01 00:00:00"
                      GROUP BY kolo
                      ORDER BY kolo, datum',
                    $dtoIn["teamAge"],
                    $dtoIn["season"],
                    $dtoIn["season"] + 1
                   );

      $rounds = $dtb->selectMany($sqlRounds);
      $matches = array();

      foreach ($rounds as &$round) {
        $sqlMatches = sprintf(
                        'SELECT zapas.id AS "id", kolo, datum, dom.nazev AS "domaci", hos.nazev AS "hoste", golyD, golyH, golyDP, golyHP, penalty
                         FROM `tym` `dom` JOIN `zapas` ON dom.id = idD JOIN `tym` `hos` ON idH = hos.id
                         WHERE kolo = %d AND dom.vek = "%s"
                           AND datum > "%d-07-01 00:00:00"
                           AND datum < "%d-07-01 00:00:00"
                         ORDER BY datum ASC',
                        $round["kolo"],
                        $dtoIn["teamAge"],
                        $dtoIn["season"],
                        $dtoIn["season"] + 1
                      );

        $matches[$round["kolo"]] = $dtb->selectMany($sqlMatches);
      }

      return $matches;
    });

    return $data;
  });
?>
