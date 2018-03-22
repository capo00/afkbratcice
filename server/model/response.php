<?php
  require_once "request.php";
  require_once "logger.php";

  class Response {
    public static function create($func) {
      http_response_code(500);

      try {
        $request = new Request();
        $dtoOut = array('data' => $func($request->getDtoIn()));

        header('Content-Type: application/json');
        http_response_code(200);

        print json_encode($dtoOut);
      } catch (Exception $e) {
        Logger::error($e->__toString());
        print json_encode(array(
                            "error" => array(
                              "message" => $e->getMessage(),
                              "stacktrace" => $e->getTraceAsString()
                            )
                          ));
      }

      die();
    }
  }
?>
