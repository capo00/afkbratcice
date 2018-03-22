<?php
  class Config {
    const MEN = "M";
    const OLD_GUARD = "OG";
    const TEAMS = array(
                    self::MEN => array(
                      "id" => 1
                    ),
                    self::OLD_GUARD => array(
                      "id" => 25,
                      "shortcut" => "S"
                    )
                  );

    public static function checkTeamExist($team) {
      if (!self::TEAMS[$team]) {
        throw new Exception("Team " . $team . " does not exist.");
      }
    }

    public static function getTeamId($team) {
      self::checkTeamExist($team);
      return self::TEAMS[$team]["id"];
    }

    public static function getTeamShortcut($team) {
      self::checkTeamExist($team);
      return self::TEAMS[$team]["shortcut"] ? self::TEAMS[$team]["shortcut"] : $team;
    }
  }
?>
