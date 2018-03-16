<?php
  require_once "model/response.php";
  require_once "model/database.php"; 
  require_once "model/logger.php";
  
  Response::create(function($dtoIn) { 
    $sql = "SELECT *
            FROM clanek
            WHERE priorita IS NULL OR priorita NOT IN (2)
            ORDER BY priorita DESC, datum DESC";
              
    $data = Database::getMany($sql, $dtoIn);
      
    return $data;
  });
?>
