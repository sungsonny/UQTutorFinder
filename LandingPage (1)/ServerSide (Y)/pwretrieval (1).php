<!DOCTYPE html>
<html>
	<head>
	</head>
	<body>
		<form method="POST" action="sendEmail.php" >
			<input type="email" name="email" placeholder="Email"><br>
			<input type="submit" value="Send">
		</form>
		<form method="POST">
			<input type="text" name="veriCode" placeholder="Verification Code"><br>
			<input type="submit" value='Submit'>
		</form>
	</body>
</html>
<?php
if ($_SERVER["REQUEST_METHOD"] == "POST"){

	$_POST['veriCode'];
	if($_POST['veriCode'] == $veriCode){
		header("Location: pwchange.php");
	}else{
		echo "Wrong verification code";
	}
}

?>