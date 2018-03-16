<?php
  class Request {
    function getDtoIn() {
      if (isset($_GET['data'])) {
        return json_decode($_GET['data'], true);
      } else {
        return file_get_contents('php://input') ? json_decode(file_get_contents('php://input'), true)["data"] : null;
      }
    }
  }
?>
