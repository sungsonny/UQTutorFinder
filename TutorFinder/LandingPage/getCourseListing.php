<?php
session_start();
if(!isset($_SESSION['user']) || !isset($_SESSION['pin'])){
	header("Location: index.php");
}
include('connectMySQL.php');
$db = new MySQLDatabase();
$db->connect("root","","infs3202");
//echo $_SESSION['user'];
$course = $_GET['q'];
$_SESSION['q'] = $course;



$query = "select * from listing where email = 'user' and courseID = 'xx'";
$query=str_replace('user', $_SESSION['user'], $query);
$query=str_replace('xx', $course, $query);
$result = mysqli_query($db->link, $query);

if($result) {
	$row = mysqli_fetch_array($result);
	$rate = $row['rate'];
	$gender = $row['gender'];
	$campus = $row['campus'];
	$type = $row['type'];
	$noSession = $row['NoSessons'];
	$length = $row['length'];
	$notes = $row['notes'];

	$listing = (object)array("rate"=>$rate, "gender"=>$gender,"campus"=>$campus, "type"=>$type, "noSession"=>$noSession, "length"=>$length, "notes"=>$notes);

    $listingJSON = json_encode($listing);

    echo $listingJSON;
} else {
	die(sqli_error($db->link));
}
$db->disconnect();
?>