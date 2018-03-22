<?php
  require_once "../model/response.php";
  require_once "../model/database.php";
  require_once "../model/logger.php";

  Response::create(function($dtoIn) {
    $newsText = file_get_contents("../news.json");
    return json_decode($newsText);
  });
?>
