<?php
session_start();
include('connectMySQL.php');
$db = new MySQLDatabase();
$db->connect("root","","infs3202");
if ($_SERVER["REQUEST_METHOD"] == "POST"){
	$rate = $_POST['maxRate'];
	$gender = $_POST['gender'];
	$type = $_POST['type'];
	$sessionNo = $_POST['sessionNo'];
	$campus = $_POST['campus'];
	$length = $_POST['length'];
	$notes = $_POST['notes'];

	$query = "update listing set rate = '".$rate."', gender = '".$gender."', campus = '".$campus."', type = '".$type."', NoSessons = '".$sessionNo."', length = '".$length."', notes='".$notes."' where email = '".$_SESSION['user']."' and courseID = '".$_SESSION['q']."'";
	echo $query;

	$result = mysqli_query($db->link, $query);
	if(!$result){
        	//header("Location: index.php");
        	//die(sqli_error($db->link));
		    //echo "failed";
    } else{
        echo "Successful!";
    }
}
if($_POST['action'] == 'delete') {
	$query = 'delete from listing where email="'.$_SESSION['user'].'" and courseID = "'.$_SESSION['q'].'"';
	$result = mysqli_query($db->link, $query);
}
$db->disconnect();
header("Location:listing.php".$_SESSION['user']);

?>