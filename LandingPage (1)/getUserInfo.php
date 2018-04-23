<?php 
session_start();
if(!isset($_SESSION['user']) || !isset($_SESSION['pin'])){
	header("Location: index.php");
} else{
    include('connectMySQL.php');
    $db = new MySQLDatabase();
    $db->connect("root","","infs3202");
    $query = "select * from client where email = \"useremail\"";
    $query = str_replace("useremail",$_SESSION['user'],$query);
    $result = mysqli_query($db->link,$query);

    if($result){
    	$row = mysqli_fetch_array($result);
    	$fname = $row['FName'];
    	$lname = $row["LName"];
    	$program = $row['program'];
        $picSrc = $row['picSrc'];
        $bio = $row['biography'];
        $gender = $row['gender'];
        $campus = $row['campus'];
        $user_type = $row['user_type'];

        $user = (object)array("fname"=>$fname, "lname"=>$lname,"name"=>$fname." ".$lname, "program"=>$program, "picSrc"=>$picSrc, "bio"=>$bio, "gender"=>$gender, "campus"=>$campus, "user_type"=>$user_type);

        $userJSON = json_encode($user);

        echo $userJSON;
    } else{
    	die(mysqli_error($db->link));
    }
}

$db->disconnect();
?>