<!DOCTYPE html>
<?php 
session_start();

?>
<html>
	<head>
		<title>Search</title>
		<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
		<script>



		    function showResults(){
				
				if (window.XMLHttpRequest){
					xmlhttp = new XMLHttpRequest();
				} else{
					xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
				}

				xmlhttp.onreadystatechange=function(){
					if(xmlhttp.readyState==4 && xmlhttp.status == 200){
						var srchJSON = JSON.parse(this.responseText);
						var name_list = srchJSON.name;
						var srchTxt = srchJSON.srchTxt;
						$("#displayResults").html(name);
					}
				};
				var srchTxt = $("#searchInput").val();
				xmlhttp.open("GET","getSearchResults.php?q="+srchTxt,true);
				xmlhttp.send();
			}


			$(document).ready(function(){
				var user = <?php echo "'".$_SESSION['user']."'"; ?>;
				$("#toDashboard").attr("href", "dashboard.php");
				$("#displayResults").html();
			});
		</script>
		<style>
			input {
				width: 100px;
				transition: width 0.4s ease-in-out;
				-webkit-transition: width 0.4s ease-in-out;
			}

			input:focus {
				width: 100%;
			}
		</style>
	</head>
	<body>
		
		<input type="text" name="search" placeholder="Search by name or course..." id="searchInput">
		<button onclick="showResults()">Search</button><br>
        <p>Search by conditions</p>
        <fieldset>
            <legend>Filters</legend>
            <p>Maximum Rate: </p>
            <label for="Any">Any</label>
            <input type="checkbox" name="price" value="Any" checked>
            <label for="25">$25</label>
            <input type="checkbox" name="price" value="25">
            <label for="50">50</label>
            <input type="checkbox" name="price" value="50">
            <label for="75">75</label>
            <input type="checkbox" name="price" value="75">
            <label for="100">100</label>
            <input type="checkbox" name="price" value="100"><br>

            <p>Preferred Gender</p>
            <label for="Any">Any</label>
            <input type="checkbox" name="gender" value="Any" checked>
            <label for="Male">Male</label>
            <input type="checkbox" name="gender" value="Male">
            <label for="Female">Female</label>
            <input type="checkbox" name="gender" value="Female"><br>

            <p>Campus</p>
            <label for="Any">Any</label>
            <input type="checkbox" name="campus" value="Any" checked>
            <label for="St Lucia">St Lucia</label>
            <input type="checkbox" name="campus" value="St Lucia">
            <label for="Herston">Herston</label>
            <input type="checkbox" name="campus" value="Herston">
            <label for="Gatton">Gatton</label>
            <input type="checkbox" name="campus" value="Gatton"><br>

            <p>Weekly Sessions</p>
            <label for="Any">Any</label>
            <input type="checkbox" name="NoSessions" value="Any" checked>
            <label for="1">1</label>
            <input type="checkbox" name="NoSessions" value="1">
            <label for="2">2</label>
            <input type="checkbox" name="NoSessions" value="2">
            <label for="3">3</label>
            <input type="checkbox" name="NoSessions" value="3">
            <label for="More than 3">More than 3</label>
            <input type="checkbox" name="NoSessions" value="More than 3">

            <p>Duration</p>
            <label for="Any">Any</label>
            <input type="checkbox" name="duration" value="Any" checked>
            <label for="1">1 hour</label>
            <input type="checkbox" name="duration" value="1h">
            <label for=">2h">2 hours</label>
            <input type="checkbox" name="duration" value="2h">
            <label for=">2h">More than 2 hours</label>
            <input type="checkbox" name="duration" value=">2h">
        </fieldset>
		<a id="toDashboard">Back to Dashboard</a>
		<section id="displayResults"></section>
        <a class="result" href="userView.php?q=justindong@gmail.com">Justin Dong</a>
	</body>
</html>
