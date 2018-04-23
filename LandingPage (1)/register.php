<?php 
include('connectMySQL.php');
$db = new MySQLDatabase();
$db->connect("root","","infs3202");
session_start();

$lnameErr = $fnameErr = $emailErr = $passwordErr = $passwordmatchErr = $usertypeErr = "";

$fname = $lname = $email = $gender = $password = $user_type = $program = $campus ="";

if ($_SERVER["REQUEST_METHOD"] == "POST"){

  
	if(empty($_POST["FName"])){
		$fnameErr = "First Name is required";
	} else{
		$fname = $_POST["FName"];
	}

	if(empty($_POST["LName"])){
		$lnameErr = "Last Name is required";
	} else{
		$lname = $_POST["LName"];
	}

	if(empty($_POST["email"])){
		$emailErr = "Email is required";
	} else{
		$email = $_POST["email"];
	}

	if(empty($_POST["password"])){
		$passwordErr = "Password is required";
	} else{
		$password = $_POST["password"];
	}
     
    if(empty($_POST['cpassword'])){
    	$passwordmatchErr = "Please re-enter your password.";
    }else{
    	if($_POST['password'] != $_POST['cpassword']){
		$passwordmatchErr = "Password not matched.";
	    } else{
		$password = $_POST['password'];
	    }
    }

	if($_POST["user_type"] == ""){
		$usertypeErr = "User type is required";
	} else{
		$user_type = $_POST["user_type"];
	}

	if(!isset($_POST['gender'])){
	    	$gender = "N/A";
	} else{
	    	$gender = $_POST['gender'];
	}
		
	if($_POST['program'] == null){
	    	$program = "N/A";
	} else{
	    	$program = $_POST['program'];
	}

	if($_POST['campus'] == ""){
	    	$campus = "N/A";
	} else{
	    	$campus = $_POST['campus'];
	}

	if($lnameErr == "" && $fnameErr == ""&& $emailErr == "" && $passwordErr == "" && $passwordmatchErr == "" && $usertypeErr == ""){

	    $query = "insert into CLIENT values('email', 'FName', 'LName', 'gender', 'password', 'campus', 'program', 'user_type', 'images/defaultprofile.PNG','No biography available')";
        $query = str_replace("FName", $fname, $query);
        $query = str_replace("LName", $lname, $query);
        $query = str_replace("email", $email, $query);
        $query = str_replace("gender", $gender, $query);
        $query = str_replace("password", $password, $query);
        $query = str_replace("program", $program, $query);
        $query = str_replace("campus", $campus, $query);
        $query = str_replace("user_type", $user_type, $query);

        $result = mysqli_query($db->link, $query);
        

        if(!$result){
        	header("Location: index.php");
        	die(sqli_error($db->link));
        } else{
        	$_SESSION['user'] = $email;
        	$_SESSION['pin'] = $password;
        	setcookie("user_email",$email, time()+86400*30);
			setcookie("user_pin",$password, time()+86400*30);
        	header("Location: dashboard.php");
        }
	}
}
$db->disconnect();
?>