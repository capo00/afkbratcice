<?php
  require_once 'model/response.php';
  require_once 'model/database.php'; 
  require_once 'model/logger.php';

  Response::create(function($dtoIn) {
    
    $sql = 'SELECT *
              FROM diskuze
              LIMIT 1';
              
    $result = Database::process($sql);
      
    return array('result' => $result);
  });
?>
