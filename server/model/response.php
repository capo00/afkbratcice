<?php
  require 'request.php';

  class Response {
    public static function create($func) {
      http_response_code(500);

      $request = new Request();
      $dtoOut = array('data' => $func($request->getDtoIn()));

      header('Content-Type: application/json');
      http_response_code(200);

      print json_encode($dtoOut);

      die();
    }
  }
?>
