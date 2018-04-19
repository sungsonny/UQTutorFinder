<!DOCTYPE html>
<?php 
session_start();
if(!isset($_SESSION['user']) || !isset($_SESSION['pin'])){
	header("Location: index.php");
}

?>
<html>
	<head>
		<title>Dashboard</title>
	</head>
	<body>
		<p>This is the dashbaord!</p>
		<form action="logout.php" method="POST">
			<input type="submit" value="Log Out">
		</form>
		<form action="deleteaccount.php" method="POST">
			<input type="submit" value="Delete Account">
		</form>
		<a href="listing.php">Make my lists!</a>

		
	</body>
</html>
