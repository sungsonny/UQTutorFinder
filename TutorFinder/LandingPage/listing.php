<!DOCTYPE html>
<?php
session_start();
if(!isset($_SESSION['user']) || !isset($_SESSION['pin'])){
	header("Location: index.php");
}
?>
<html>
	<head>
		<title>My Listings</title>
		<script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.6.4/angular.min.js"></script>
		<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
		<script type="text/javascript">
		$(document).ready(function(){
			var user = <?php echo "'".$_SESSION['user']."'";?>;
			var user = user.toString();
			$("#toDashboard").attr("href","dashboard.php");
			function showInfo(){
				var xmlhttp;
				if (window.XMLHttpRequest){
					xmlhttp = new XMLHttpRequest();
				} else{
					xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
				}
				xmlhttp.onreadystatechange=function(){
					if(xmlhttp.readyState==4 && xmlhttp.status == 200){
						document.getElementById("listingdisplay").innerHTML = this.responseText;
						$("#listingdisplay option").remove();	
						document.getElementById("courseselection").innerHTML = this.responseText;	
					}
				};
				xmlhttp.open("GET","getListing.php",true);
				xmlhttp.send();
			}
			showInfo();


            var letterArray = ["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","","R","S","T","U","V","W","X","Y","Z"];
			var numArray = ["0","1","2","3","4","5","6","7","8","9"];
	        var letters = $("#codevalue").text().slice(0,3);
		    var nums = $("#codevalue").text().slice(4,7);
		    var capLetters = letters.toUpperCase();
		    var letterValid = true;
		    var numValid = true;
			
			$("#courseinput").keyup(function(){
				
			    for (var i=0; i < capLetters.length; i++) {
				    if (!letterArray.includes(capLetters[i])) {
						letterValid = false;
				    }
			    }

			    for (var i=0; i<nums.length; i++) {
				    if (!numArray.includes(nums[i])) {
					numValid = false;
				   }
			    }


				if($("#codevalue").text().length!=8 || !numValid || !letterValid) {
					$(".error").html("*Please enter a valid course code!");
				} else{
					$(".error").html("*");

				}
			});

			$("#displaylisting").css("display","none");

			$("#showEdit").click(function(){
				$("#myModal").css("display", "block");
				$(".close").click(function(){
					$("#myModal").css("display","none");
				});
			});

			$("form:first-of-type input[type=submit]").click(function(){
				var courseExists = false;
                $('.course').each(function(i){
                	if($(this).html() == $("#codevalue").html()) {
                		courseExists = true;
                	}
                });
        	   if($("#codevalue").text().length!=8 || !numValid || !letterValid || courseExists){
        	   	    $(".error").html("*This course already exists in your listings!");
        		    return false;
        		//preventDefault;
        	    }        	    
			});

			/*$("button:last-of-type").click(function(){
				$.ajax({
				    type: "POST",
				    url: "updateListing.php",
				    data: {
					    action: 'delete'
				    },
				    success: function(data) {
					     alert(data);
				    }
			    });
			});*/


        });

        function showListing(str){
			var xmlhttp;
			if (str=="") {
				document.getElementById("displaylisting").innerHTML = "";
				return;
			} 
			if (window.XMLHttpRequest) {
				xmlhttp = new XMLHttpRequest();
			} else {
				xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
			}

			$("#displaylisting input:first-of-type").attr("value",str);

			$("#displaylisting").css("display","block");

			xmlhttp.onreadystatechange=function(){
				if (xmlhttp.readyState==4 && xmlhttp.status == 200) {
					var listingJSON = JSON.parse(xmlhttp.responseText);
					var rate = listingJSON.rate;
					var gender = listingJSON.gender;
					var campus = listingJSON.campus;
					var type = listingJSON.type;
					var noSession = listingJSON.noSession;
					var duration = listingJSON.length;
					var notes = listingJSON.notes;

					if (rate == "25") {
						$("#displaylisting select[name*=maxRate] ").val("25");
					} else if (rate == "50") {
						$("#displaylisting select[name*=maxRate] ").val("50");
					} else if (rate == "75") {
						$("#displaylisting select[name*=maxRate]").val("75");
					} else if (rate == "100") {
						$("#displaylisting select[name*=maxRate] ").val("100");
					} else if(rate = "Any") {
						$("#displaylisting select[name*=maxRate] ").val("Any");
					} else {
						$("#displaylisting select[name*=maxRate] ").val("N/A");
					}

					if(gender == "Male") {
						$("#displaylisting select[name*=gender]").val("Male");
					} else if (gender == "Female") {
						$("#displaylisting select[name*=gender]").val("Female");
					} else if (gender == "Any") {
						$("#displaylisting select[name*=gender]").val("Any");
					} else {
						$("#displaylisting select[name*=gender]").val("N/A");
					}

					switch (campus) {
						case "St Lucia":
						    $("#displaylisting select[name*=campus]").val("St Lucia");
						    break;

						case "Gatton":
						    $("#displaylisting select[name*=campus]").val("Gatton");
						    break;

						case "Herston":
						    $("#displaylisting select[name*=campus]").val("Herston");
						    break;

						case "Any":
						    $("#displaylisting select[name*=campus]").val("Any");
						    break;


						default:
						    $("#displaylisting select[name*=campus]").val("N/A");    
					}

					switch (noSession) {
						case "1":
						    $("#displaylisting select[name*=sessionNo]").val("1");
						    break;

						case "2":
						    $("#displaylisting select[name*=sessionNo]").val("2");
						    break;

						case "3":
						    $("#displaylisting select[name*=sessionNo]").val("3");
						    break;

						case "More than 3":
						    $("#displaylisting select[name*=sessionNo]").val("More than 3");
						    break;

						case "Any":
						    $("#displaylisting select[name*=sessionNo]").val("Any");
						    break;

						default:
						    $("#displaylisting select[name*=sessionNo]").val("N/A");
					}

					switch (duration) {
						case "1h":
						    $("#displaylisting select[name*=length]").val("1h");
						    break;

						case "2h":
						    $("#displaylisting select[name*=length]").val("2h");
						    break;

						case ">2h":
						    $("#displaylisting select[name*=length]").val(">2h");
						    break;

						case "Any":
						    $("#displaylisting select[name*=length]").val("Any");
						    break;

						default:
						    $("#displaylisting select[name*=length]").val("N/A");
					}

					$("#displaylisting textarea").val(notes);

				}
				
			}
			xmlhttp.open("GET","getCourseListing.php?q="+str,true);
			xmlhttp.send();
		}
		
		</script>
		<style>
			.error{
				color: red;
			}

			#codevalue{
				display: none;
			}

			#myImg {
				border-radius: 50%;
				cursor: pointer;
				transition: 0.3s;
			}

			#myImg:hover {
				opacity: 0.6;
			}

			.modal {
				display: none;
				position: fixed;
				z-index: 1;
				padding-top: 15px;
				left: 0;
				top: 0;
				width: 100%;
				height: 100%;
				overflow: auto;
				background-color: rgb(0,0,0);
				background-color: rgba(0,0,0,0.7);
			}

			.modal-content {
				margin: auto;
				padding-top: 10vh;
				display: block;
				width: 30%;
				max-width: 700px;
			}

			#img01{
				width: 70vw;
			}

			.modal-content { 
                animation-name: zoom;
                animation-duration: 0.6s;
            }

            @keyframes zoom {
            	from{transform: scale(0)}
            	to {transform: scale(1)}
            }

            .close {
            	position: absolute;
            	top: 15px;
            	right: 35px;
            	color: #f1f1f1;
            	font-size: 40px;
            	font-weight: bold;
            	transition: 0.3s;
            }

            .close:hover, .close:focus {
            	color: #bbb;
            	text-decoration: none;
            	cursor: pointer;
            }
		</style>
		
	</head>
	<body>
	    <button id="showEdit">Edit My Listings!</button>
	    <div id="listingdisplay"></div>
		<form method="POST" action="addListing.php">
		    <div ng-app="">
		    	<label>Course Code: </label>
			    <input type="text" name="course" id="courseinput" ng-model="code"><span class="error">*</span><br>
			    <p ng-bind="code" id="codevalue"></p>
		    </div>
			<label>Rate</label>
			<select name="maxRate">
			    <option value="N/A" selected>Maximum Hourly Rate</option>
				<option value="25">25$</option>
				<option value="50">50$</option>
				<option value="75">75$</option>
				<option value="100">100$</option>
				<option value="Any">Any</option>
			</select><br>
			<select name="gender">
				<option value="N/A" selected>Preferred Gender</option>
				<option value="Male">Male</option>
				<option value="Female">Female</option>
				<option value="Any">Any</option>
			</select><br>
			<select name="campus">
				<option value="N/A" selected>Campus</option>
				<option value="St Lucia">St Lucia</option>
				<option value="Gatton">Gatton</option>
				<option value="Herston">Herston</option>
				<option value="Any">Any</option>
			</select><br>
			<select name="type">
				<option value="N/A" selected>Session Type</option>
				<option></option>
			</select><br>
			<select name="sessionNo">
				<option value="N/A" selected>No. Weekly Seesions</option>
				<option value="1">1</option>
				<option value="2">2</option>
				<option value="3">3</option>
				<option value="More than 3">More Than 3</option>
				<option value="Any">Any</option>
			</select><br>
			<select name="length">
				<option value="N/A" selected>Session Duration</option>
				<option value="1h">1 Hour</option>
				<option value="2h">2 Hours</option>
				<option value=">2h">More than 2 hours</option>
				<option value="Any">Any</option>
			</select><br>
			<textarea rows="4" cols="50" name="notes" placeholder="Leave your notes here"></textarea><br>
			<input type="submit" value="Add Listing">
		</form>
		<a id="toDashboard">Back to Dashboard</a>
		<div id="myModal" class="modal">
			<div class="modal-content">
			    <span class="close">&times;</span>
				<label>Choose the course in your listing:</label>
				
				    <select id="courseselection" onchange="showListing(this.value)">
				</select>
					
				</select>
				<div id="displaylisting">
				    <form method="POST"  action="updateListing.php">
		    	        <label>Course Code: </label>
			            <input type="text" name="course" disabled><br>
			            <label>Rate</label>
			            <select name="maxRate">
			                <option value="N/A" selected>Maximum Hourly Rate</option>
				            <option value="25">25$</option>
				            <option value="50">50$</option>
				            <option value="75">75$</option>
				            <option value="100">100$</option>
				            <option value="Any">Any</option>
			            </select><br>
			            <select name="gender">
				            <option value="N/A" selected>Preferred Gender</option>
				            <option value="Male">Male</option>
				            <option value="Female">Female</option>
				            <option value="Any">Any</option>
			            </select><br>
			            <select name="campus">
				            <option value="N/A" selected>Campus</option>
				            <option value="St Lucia">St Lucia</option>
				            <option value="Gatton">Gatton</option>
				            <option value="Herston">Herston</option>
				            <option value="Any">Any</option>
			            </select><br>
			            <select name="type">
				            <option value="N/A" selected>Session Type</option>
				            <option></option>
			            </select><br>
			            <select name="sessionNo">
				             <option value="N/A" selected>No. Weekly Seesions</option>
				             <option value="1">1</option>
				             <option value="2">2</option>
				             <option value="3">3</option>
				             <option value="More than 3">More Than 3</option>
				            <option value="Any">Any</option>
			            </select><br>
			            <select name="length">
				            <option value="N/A" selected>Session Duration</option>
				            <option value="1h">1 Hour</option>
				            <option value="2h">2 Hours</option>
				            <option value=">2h">More than 2 hours</option>
				            <option value="Any">Any</option>
			            </select><br>
			            <textarea rows="4" cols="50" name="notes" placeholder="Leave your notes here"></textarea><br>
			            <input type="submit" value="Save Changes">
			            <button onclick="deleteListing()">Detele this listing</button>
		            </form>
				</div>
			</div>
		</div>
	</body>
</html>