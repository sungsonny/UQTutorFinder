<!DOCTYPE html>
<html>
	<head>
		<title>UQ Tutor Finder</title>
		<style>
			.error{
				color: red;
			}
		</style>
		<?php 
		include('register.php');
		session_start();
		?>
	</head>
	<body>
		<section>
			<h1>UQ TUTOR FINDER</h1>
			<form  method="POST" action="login.php">
				Username: <input type="text" name="user"><br>
				Password: <input type="password" name="pin"><br>
				<a href="pwretrieval.php">Forgotten Password?</a><br>
				<input type="submit" value="Log In">
			</form>
		</section>
		<section>
			<p></p>
		</section>
		<section>
			<h2>Create an account</h2>
			<form method="POST" action="<?php echo htmlspecialchars($_SERVER["PHP_SELF"]);?>">
			
				<input type="text" name="FName" placeholder="First Name" value="<?php echo $fname; ?>">
				<input type="text" name="LName" placeholder="Surname" value="<?php echo $lname;?>"><span class="error">* <?php echo $nameErr?></span><br>
				<input type="email" name="email" placeholder="Email Address" value="<?php echo $email; ?>"><span class="error">* <?php echo $emailErr?></span><br>
			
				Gender:
				<input type="radio" name="gender" <?php if(isset($gender) && $gender == "m") echo "checked"; ?> value="m">Male
				<input type="radio" name="gender" <?php if(isset($gender) && $gender == "f") echo "checked"; ?> value="f">Female
				<input type="radio" name="gender" <?php if(isset($gender) && $gender == "o") echo "checked"; ?> value="o">Other<br>
				<input type="password" name="password" placeholder="Password"><span class="error" value="<?php echo $password; ?>">* <?php echo $passwordErr?></span><br>
				<input type="password" name="cpassword" placeholder="Confirm Password"><span class="error">* <?php echo $passwordmatchErr?></span><br>
				I am a: 
				<input type="radio" name="user_type" <?php if(isset($user_type) && $user_type == "t") echo "checked"; ?> value="t">Tutor
				<input type="radio" name="user_type" <?php if(isset($user_type) && $user_type == "s") echo "checked"; ?> value="s">Student<span class="error">* <?php echo $usertypeErr?></span><br>
				<input type="submit" value="Create Account">
			</form>
		</section>
	</body>
</html>