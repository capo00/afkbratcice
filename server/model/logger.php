<?php
  class Logger {
    const FILE_NAME = "../logger.log";

    private static function write($text, $severity = null) {
      $result = array(
        "date" => date("c"),
        "sev" => $severity ? $severity : "DEBUG",
        "msg" => is_array($text) ? json_encode($text) : $text
      );

      // Write the contents to the file,
      // using the FILE_APPEND flag to append the content to the end of the file
      // and the LOCK_EX flag to prevent anyone else writing to the file at the same time
      file_put_contents(self::FILE_NAME, json_encode($result) . ",", FILE_APPEND | LOCK_EX);
    }

    public static function read($severity = null) {
      $text = file_get_contents(self::FILE_NAME);
      $json = "[" . rtrim($text, ",") . "]";
      $array = json_decode($json);

      if ($severity) {
        $newArray = array_filter($array, function($v, $k) use($severity) {
          return $v->sev === $severity;
        }, ARRAY_FILTER_USE_BOTH);

        $array = $newArray;
      }

      usort($array, function($a, $b) {
        if ($a->date == $b->date) {
          return 0;
        }
        return ($a->date < $b->date) ? 1 : -1;
      });

      return $array;
    }

    public static function log($text) {
      self::write($text, "LOG");
    }

    public static function info($text) {
     self::write($text, "INFO");
    }

    public static function warning($text) {
     self::write($text, "WARN");
    }

    public static function error($text) {
     self::write($text, "ERROR");
    }
  }
?>
