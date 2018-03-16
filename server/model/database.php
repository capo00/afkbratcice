<?php
  require_once "logger.php";

  class Database {
    const TABLE_NAME = "d27814_afk";
    const URL = "wm3.wedos.net:3306";
    const LOGIN = "a27814_afk";
    const PASS = "fXHAWmeV";

    private $mysqli;

    function __construct() {
      $mysqli = new mysqli(self::URL, self::LOGIN, self::PASS, self::TABLE_NAME);
      
      if ($mysqli->connect_errno) {  
        die("Failed to connect to MySQL: (" . $mysqli->connect_errno . ") " . $mysqli->connect_error);
      }

      $mysqli->set_charset('utf8');
      
      $this->mysqli = $mysqli;
    }
    
    function selectOne($sql) {
      $result = $this->mysqli->query($sql . " LIMIT 0, 1");
      $data = $result->fetch_assoc();
      return $data ? $data : null;
    }
    
    function selectMany($sql, $pageSize = null, $pageIndex = null) {
      $pageSize = $pageSize == null ? 1000 : $pageSize;
      $pageIndex = $pageIndex == null ? 0 : $pageIndex;
      $query = sprintf($sql . " LIMIT %d, %d", $pageIndex, $pageSize);
     
      $data = array();
      $result = $this->mysqli->query($query);

      while($row = $result->fetch_assoc()) {
        $data[] = $row;
      }
      
      return $data;
    }

    public static function process($func) {
      $dtb = new Database();
      
      try {
        return $func($dtb);
      } catch (Exception $e) {
        throw $e;
      } finally {
        $dtb->mysqli->close();
      }
    }
    
    public static function getOne($sql) {
      return self::process(function($dtb) use($sql) {
        return $dtb->selectOne($sql);
      });
    }     
    
    public static function getMany($sql, $opt) {
      return self::process(function($dtb) use($sql, $opt) {
        return $dtb->selectMany($sql, $opt["pageSize"], $opt["pageIndex"]);
      });
    }
  }
?>