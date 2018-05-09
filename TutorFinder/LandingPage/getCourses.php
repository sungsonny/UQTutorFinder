<?php
session_start();
if(!isset($_SESSION['user']) || !isset($_SESSION['pin'])){
    header("Location: index.php");
} else{
    include('connectMySQL.php');
    $db = new MySQLDatabase();
    $db->connect("root","","infs3202");
    $query = "select courseID from listing where email = 'useremail'";
    $query = str_replace("useremail",$_SESSION['user'],$query);
    $result = mysqli_query($db->link,$query);

    if($result){
        while($row = mysqli_fetch_array($result)) {
            $course = $row["courseID"];
            echo "<p>".$course."</p>";
        }
        //header("Location: index.php");
    } else{
        die(mysqli_error($db->link));
    }
}

$db->disconnect();
?>