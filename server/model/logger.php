<?php
  class Logger {
    private static function write($text, $severity) {
      $file = 'logger.log';

      $result = array(
        date("Y-m-d H:i:s.u"),
        "[" . ($severity ? $severity : "DEBUG") . "]",
        json_encode($text) . "\n"
      );

      // Write the contents to the file,
      // using the FILE_APPEND flag to append the content to the end of the file
      // and the LOCK_EX flag to prevent anyone else writing to the file at the same time
      file_put_contents($file, join(" ", $result), FILE_APPEND | LOCK_EX);
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
