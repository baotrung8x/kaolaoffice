<?php
 = new PDO('mysql:host=127.0.0.1;dbname=kaolaai;charset=utf8mb4', 'root', '');
foreach(->query('SELECT id, name, description FROM bots') as ) {
    echo ['id'] . ' | ' . ['name'] . ' | ' . ['description'] . PHP_EOL;
}
