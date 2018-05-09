<!DOCTYPE html>
<?php
    include('register.php');
    if(isset($_SESSION['user']) && isset($_SESSION['pin'])){
        header("Location: dashboard.php");
    }
    
?>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,
			initial-scale=1, shrink-to-fit=no">
    <meta http-equiv="x-ua-compatible" content="ie=edge">
    <title>Welcome to MyTutor</title>
    <link rel="stylesheet" href="node_modules/bootstrap/dist/css/bootstrap.min.css">
    <link rel="stylesheet" href="styles/mtstyle.css">
    <link rel="stylesheet" href="node_modules/font-awesome/css/font-awesome.min.css"/>
    <link href="https://fonts.googleapis.com/css?family=Montserrat" rel="stylesheet" type="text/css">
    <style>
        .error{
            color: red;
        }

        .autofill{
            background-color: #faffbd;
        }
    </style>
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
</head>
<body class="container-fluid">
    <nav class="navbar navbar-expland-lg navbar-mytutor ">
        <a class="navbar-brand navbar-logo" href="#">MyTutor</a>
        <div class="container">
            <div class="row login_form">
                <div class="col-sm-6 offset-sm-6">
                    <form id="login_form" action="login.php" method="post">
                        <input type="hidden" name="lsd" value="#" autocomplete="off">
                        <table cellspacing="1" role="presentation">
                            <tbody>
                                <tr>
                                    <td>
                                        <input type="email" class="inputtext" name="user" id="email"
                                               tableindex="1" data-testid="royal-email" placeholder="Email Address">
                                    </td>
                                    <td>
                                        <input type="password" class="inputtext" name="pin" id="pass"
                                               tableindex="2" data-testid="royal_pass" placeholder="Password">
                                    </td>
                                    <td>
                                    
                                        <input type="submit" value="Log In">
                                    </td>
                                    
                                </tr>
                                <tr>
                                    <td>
                                        <div class="custom-control custom-checkbox" id="remember">
                                            <input type="checkbox" class="custom-control-input" id="customCheck1" name="rememberme">
                                            <label class="custom-control-label" for="customCheck1">Remember me</label>
                                        </div>
                                    </td>
                                    <td>
                                        <div id="forget">
                                            <a href="pwretrieval.php">Forget password?</a>
                                        </div>
                                    </td>
                                </tr>

                            </tbody>

                        </table>
                    </form>
                </div>
            </div>
        </div>
    </nav>
    <div class="container-fluid mytutor-section bg-mytutor-light">
        <div class="row">
            <div class="col-md-5">
                <img src="images/welcome.png" class="img-fluid" alt="Responsive Image">
            </div>
            <div class="col-md-7 mytutor-reg">
                <div>
                    <h2>Create a new account</h2>
                </div>
                <div class="reg_box">
                    <form method="POST" action="<?php echo htmlspecialchars($_SERVER["PHP_SELF"]);?>">
                        <div class="form-row">
                            <div class="form-group col-md-6">
                                <label for="inputlname">Last Name</label><span class="error">* <?php echo $lnameErr?></span><br>
                                <input type="text" class="form-control" id="inputlname" placeholder="Last Name" name="LName" value="<?php echo $lname;?>">
                            </div>
                            <div class="form-group col-md-6">
                                <label for="inputfname">First Name</label><span class="error">* <?php echo $fnameErr?></span><br>
                                <input type="text" class="form-control" id="inputfname" placeholder="First Name" name="FName" value="<?php echo $fname; ?>">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group col-md-6">
                                <label for="inputemail">Email Address</label><span class="error">* <?php echo $emailErr?></span><br>
                                <input type="email" class="form-control" id="inputemail" placeholder="yourname@uq.net.au" name="email" value="<?php echo $email; ?>">
                            </div>
                            <div class="form-group col-md-6">
                                <label for="inputgender">Gender</label><br>
                                <select class="form-control" id="inputgender" name="gender">
                                    <option value="N/A" selected>Your gender</option>
                                    <option value="Male" <?php echo (isset($_POST["gender"])&&$_POST["gender"]=="Male")?'selected="selected"':''; ?>>Male</option>
                                    <option value="Female" <?php echo (isset($_POST["gender"])&&$_POST["gender"]=="Female")?'selected="selected"':''; ?>>Female</option>
                                    <option value="Other" <?php echo (isset($_POST["gender"])&&$_POST["gender"]=="Other")?'selected="selected"':''; ?>>Other</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group col-md-6">
                                <label for="inputprogram">Program</label>
                                <input type="text" class="form-control" id="inputprogram" placeholder="eg. Bachelor of IT" name="program" value="<?php if(!empty($_POST['program'])) echo $program;?>">
                            </div>
                            <div class="form-group col-md-6">
                                <label for="inputcampus">Campus</label>
                                <select class="form-control" id="inputcampus" name="campus">
                                    <option selected value="N/A">Choose your campus</option>
                                    <option value="St Lucia" <?php echo (isset($_POST["campus"])&&$_POST["campus"]=="St Lucia")?'selected="selected"':''; ?>> St Lucia</option>
                                    <option value="Gatton" <?php echo (isset($_POST["campus"])&&$_POST["campus"]=="Gatton")?'selected="selected"':''; ?>> Gatton</option>
                                    <option value="Herston" <?php echo (isset($_POST["campus"])&&$_POST["campus"]=="Herston")?'selected="selected"':''; ?>> Herston</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group col-md-6">
                                <label for="inputpass">Password</label><span class="error">* <?php echo $passwordErr?></span><br>
                                <input type="password" class="form-control" id="inputpass" placeholder="Password" name="password">
                            </div>

                            <div class="form-group col-md-6">
                                <label for="inputpass">Confirm Password</label><span class="error">* <?php echo $passwordmatchErr?></span><br>
                                <input type="password" class="form-control" id="inputcpass" placeholder="Comfirm Password" name="cpassword">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group col-md-4">
                                <label for="inputrole">Register As</label><span class="error" name="campus">* <?php echo $usertypeErr?></span><br>
                                <select id="inputrole" class="form-control" name="user_type">
                                    <option selected value="">Register as a</option>
                                    <option value="t" <?php echo (isset($_POST["user_type"])&&$_POST["user_type"]=="t")?'selected="selected"':''; ?>>Tutor</option>
                                    <option value="s" <?php echo (isset($_POST["user_type"])&&$_POST["user_type"]=="s")?'selected="selected"':''; ?>>Student</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-group">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="gridCheck" name="policyagreed">
                                <label class="form-check-label" for="gridCheck">
                                    Agree our policy
                                </label>
                            </div>
                        </div>
                        <button type="submit" class="btn btn-success">Register</button>
                    </form>
                </div>
            </div>
        </div>
    </div>


    <footer class="footer mytutor-footer text-center">
        <div class="container">
            <p class="text-muted"><small>&copy; MyTutor.com</small></p>
            <p class="text-muted"><small>Terms &amp; Conditions</small></p>
            <p class="text-muted"><small>About Us</small></p>
        </div>
    </footer>
</body>
</html>
<?php
echo "<script type=\"text/javascript\">console.log('hii');</script>";
if(isset($_COOKIE['user_email']) && isset($_COOKIE['user_pin'])){
        echo "yes";
        $useremail = $_COOKIE['user_email'];
        $userpin = $_COOKIE['user_pin'];

        echo "<script type=\"text/javascript\">
            document.getElementById('email').value = '$useremail';
            document.getElementById('pass').value = $userpin;
            document.getElementById('customCheck1').checked = true;
            $(document).ready(function(){
                $('#email, #pass').addClass('autofill');

                $('#email').keydown(function(){
                    $('#email').removeClass('autofill');
                })

                $('#pass').keydown(function(){
                    $('#pass').removeClass('autofill');
                })
            })
        </script>";
} else{
        echo "no";
}
?>
