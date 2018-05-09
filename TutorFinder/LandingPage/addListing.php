<?php
session_start();
include('connectMySQL.php');
$db = new MySQLDatabase();
$db->connect("root","","infs3202");
if(!isset($_SESSION['user']) || !isset($_SESSION['pin'])){
	header("Location: index.php");
}
if ($_SERVER["REQUEST_METHOD"] == "POST"){
	$courseCode = $_POST['course'];
	$rate = $_POST['maxRate'];
	$gender = $_POST['gender'];
	$type = $_POST['type'];
	$sessionNo = $_POST['sessionNo'];
	$campus = $_POST['campus'];
	//echo $campus;
	$length = $_POST['length'];
	$notes = $_POST['notes'];

	$query = "insert into listing values('email','courseID','rate','gender','campus', 'type', 'sessionNo', 'length','notes')";

	$query = str_replace('email', $_SESSION['user'], $query);
	$query = str_replace('courseID',$courseCode, $query);
	$query = str_replace('rate', $rate, $query);
	$query = str_replace('gender', $gender, $query);
	$query = str_replace('type', $type, $query);
	$query = str_replace('sessionNo', $sessionNo, $query);
	$query = str_replace('campus', $campus, $query);
	$query = str_replace('length', $length, $query);
	$query = str_replace('notes', $notes, $query);
	$result = mysqli_query($db->link, $query);
	

if(!$result){
        	//header("Location: index.php");
        	//die(sqli_error($db->link));
		    //echo "failed";
} else{
    
}
header("Location: listing.php?q=".$_SESSION['user']);
$db->disconnect();

}
?>