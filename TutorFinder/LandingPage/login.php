<?php
include('connectMySQL.php');
$db = new MySQLDatabase();
$db->connect("root","","infs3202");
session_start();

$userErr = $pinErr = "";
$user = $pin = "";

if ($_SERVER["REQUEST_METHOD"] == "POST"){
	if (empty($_POST["user"])){
		$userErr = "Please enter your username.";
	} else{
		$user = $_REQUEST["user"];
	}

	if (empty($_POST["pin"])){
		$pinErr = "Please enter your password.";
	} else{
		$pin = $_REQUEST["pin"];
	}

	if($userErr == "" && $pinErr == ""){
		$query = "select password from CLIENT where email ='user' ";
		$query = str_replace("user", $_POST['user'], $query);
		$result = mysqli_query($db->link,$query);
		
		if ($result){
			$row = mysqli_fetch_array($result);
			$pin = $row['password'];

			if($_REQUEST['pin'] == $pin){
				$_SESSION["user"] = $user;
				$_SESSION['pin'] = $pin;
				echo $_COOKIE['user_email'];
				if(isset($_POST["rememberme"])){
					setcookie("user_email",$user, time()+86400*30);
					setcookie("user_pin",$pin, time()+86400*30);
				}else{
					setcookie("user_email", $user, time()-3600);
					setcookie("user_pin",$pin,time()-3600);
				}
				header("Location: dashboard.php?q=".$user);
			} else{
				header("Location: index.php");
			}

		}else{
			die(mysqli_error($db->link));
		}
	} else{
		header("Location: index.php");
	}
}
$db->disconnect();
?>