<?php 
include('connectMySQL.php');
$db = new MySQLDatabase();
session_start();
$db->connect("root","","infs3202");
$query = "delete from CLIENT where email = 'user';";
$user = $_SESSION["user"];
$result = mysqli_query($db->link, str_replace("user", $user, $query));

if(!$result){
	        echo "failed to delete account";
        	//header("Location: index.php");
        	//die(sqli_error($db->link));
        } else{
        	unset($_SESSION['user']);
        	unset($_SESSION['pin']);
        	setcookie("user_email", $user, time()-3600);
        	setcookie("user_email", $pin, time()-3600);
        	header("Location: index.php");
        }
	
?>