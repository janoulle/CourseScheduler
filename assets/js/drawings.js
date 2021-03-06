var selectOptions;
$(function(){
    //toggle popover for the search box
	$('#manualEntry').popover();
    //function to clear local storage and change the semester selection
	$('#semesterSelection').change(function(){
		clearLocalStorage();
        ga('send', 'event', 'Change Semester', 'Dropdown box', $(this).val());
        $('#semesterSelectionForm').submit();
	});	
            
	//Add schedule
	try{
    	displaySchedule();
	}catch(e){
		console.log(e);
	}			
});

//http://stackoverflow.com/questions/5223/length-of-javascript-object-ie-associative-array
Object.size = function(obj) {
	var size = 0, key;
	for (key in obj) {
		if (obj.hasOwnProperty(key)) size++;
	}
	return size;
};


function displaySchedule(){
	//console.log(sched);
	//Gets converted to JSON object
	schedule = JSON.parse(sched);
	var size = Object.size(schedule);
	if (size > 0){
		//var data = "data-content=\"Popup with option trigger\" rel=\"popover\" data-placement=\"right\" data-original-title=\"Title\" data-trigger=\"hover\"";
        //var data = "data-content=\"Click to change semesters. If you change your semester, a new schedule will be created\" rel=\"popover\" data-placement=\"bottom\" data-original-title=\"Change Semester\" data-trigger=\"hover\" data-toggle=\"popover\"";
		$('#userSchedule').empty().append("<span class=\"intro\">Class Schedule</span>");
		Object.keys(schedule).forEach(function(key){
			var section = schedule[key];
            var classDiv = "<div id=\"schedule_" + section.callNumber + "\" class=\"individualSection\">";
			classDiv += "<span title=\"Click to remove " +  section.coursePrefix + "-" + section.courseNumber + " # " + section.callNumber + " from this schedule.\" onclick=\"removeSection(" + section.callNumber + ")\""  + " class=\"glyphicon glyphicon-remove pull-right delete\"></span>";
			classDiv += "<form method=\"post\" action=\"classes/controllers/schedulecontroller.php\" id=\"removeSectionForm_" + section.callNumber + "\" name=\"removeSectionForm_" + section.callNumber + "\">";
			classDiv += "<input type=\"hidden\" name=\"action\" id=\"action\" value=\"removeSection\" />";
			classDiv += "<input type=\"hidden\" id=\"sectionToBeRemoved_" + section.callNumber + "\" name=\"sectionToBeRemoved\" value=\"" + section.callNumber + "\" />";
			classDiv += "</form>";
			classDiv += "<span class=\"heading\">";
			classDiv += section.courseName + "</a></span>";
			classDiv += "<span class=\"row1 right\">" + section.lecturer + "</span><span class=\"row1 left\">";
						
			var campus = $('#infoMessage').text();
            classDiv += "<a href=\"http://bulletin.uga.edu/Link.aspx?cid=" + section.coursePrefix + "" + section.courseNumber;
            classDiv += "\" title=\"UGA Bulletin Listing for " + section.courseName + "\">";
            classDiv += section.coursePrefix + "-" + section.courseNumber + "</a></span><br/>";
			classDiv += "<span class=\"row2\">" +getBuildingName(section.buildingNumber) + " - Room #" +  section.roomNumber+"</span>";
			classDiv += "<span class=\"meetingTimes\">";
			var mtgs = section.meetings;
			Object.keys(mtgs).forEach(function(key){
				classDiv += "<span title=\"" +mtgs[key] + "\" ";
				classDiv += "class=\"day\">" 
				classDiv += key + "</span>";
			});
			classDiv += "</span></div>";						
			$('#userSchedule').append(classDiv);						
		}); //object keys
		var removeAll = "<input title=\"This creates a new schedule.\" class=\"form-control rounded-corners\" onclick=\"removeAll()\" name=\"removeAllButton\" id=\"removeAllButton\" type=\"submit\" value=\"New Schedule\" />";
		$('#userSchedule').append(removeAll);
		$('#userSchedule').show();
	}
}
        
/* Function called when user clicks the Remove All Button*/
function removeAll(){
	$('#removeAllSectionInfo').show();
    ga('send', 'event', 'Create New User Schedule', 'Remove All Button Clicked');
    $('body').css('cursor', 'wait');
	$.ajax({
		type: "POST",
		url: 'classes/controllers/schedulecontroller.php',
		data: { action : "removeAllSections"},
		dataType: "json"
	}) 
	.done(function(msg){
		$('body').css('cursor', 'auto');
		console.log(msg);
		if (msg.errorMessage.length == 0){
			$('#errorMessage').empty().hide();
			setTimeout(function(){
				location.reload();
			},1000);
		}else{
			$('#errorMessage').show().append(msg.errorMessage);
		}
	})
	.fail(function(msg){
		$('body').css('cursor', 'auto');
		console.log("Error: " + msg.responseTextvalue);				
	});
}


/* 
* force localStorage removal of cached JSON object
* when user changes campuses
* */
function clearLocalStorage() {
	localStorage.clear();
    return false;
}
    	
/* Add listener to checkboxes and return an array of currently selected items*/
function filterListings(){             
    var av = $('#Available').is(":checked");
    var full = $('#Full').is(":checked");
   	var can = $('#Cancelled').is(":checked");
    $('body').css('cursor', 'wait');
    $.ajax({
    	type: "POST",
        url: 'http://apps.janeullah.com/coursepicker/classes/controllers/coursecontroller.php',
        data: { action : "filterSections", available: av, full : full, cancelled : can},
        dataType: "json"
    })
    .done(function(msg){
        $('body').css('cursor', 'auto');
        $('#errorMessage').empty().hide();
        $('#message').empty().append("Filtered sections.").show();
        sListings = msg;
        populateSections(msg);
    })
    .fail(function(msg){
        $('body').css('cursor', 'auto');
        $('#errorMessage').empty().append(msg.responseText).show();
        $('#message').empty().hide();
        console.log(msg.responseText);
    });
}


/*
* Called after submission of user's course-number selection
* 
**/
function populateSections(data){
	var size = Object.keys(data).length;
	//console.log(size);
	if (size != 0){
		$('#controlCheckboxes').show();
        $('.checkedElement').popover();
		$('#sectionsFound').empty().show();
		$('#sectionFoundHeader').remove();
		var title = $('#collapseColumn').attr("title");
		if (title == "Collapse this column"){
			expandDiv();
		}
		var counter = 0;
		var sectionDiv;
		var allSections = "";
		sListings = data;
		var heading = "<span id=\"sectionFoundHeader\" class=\"intro\"><span id=\"collapseColumn\" ";
        heading +=  "title=\"Collapse this column\" class=\"glyphicon glyphicon-arrow-up pull-left\"></span>";
        heading += $('#courseEntry').val() + " sections:";
        heading += "<span class=\"badge pull-right notification\">" + size + "</span><br/></span>";
		/*Insert the head before the according div*/ 
		$('#sectionsFound').before(heading);
		//console.log(data);
		Object.keys(data).forEach(function(key){
			var section = data[key];
			sectionDiv = insertDiv(counter,section);//generateDiv(counter,section);
			allSections += sectionDiv;
			counter++;
		});
		/* Add the created divs to the main body of the accordion*/
		$('#sectionsFound').append(allSections);

		/* Add listener to the up/down sign for collapsing the column*/
		$('#collapseColumn').on('click',function(){
			title = $('#collapseColumn').attr("title");
			if (title == "Collapse this column"){
				expandDiv();
			}else{
				collapseDiv();
			}
		});			
		//addCheckboxListener();
        $('#filterListings').on('click',function(){
      		filterListings();
        });
	}else{				
		//$('#controlCheckboxes').hide();
		$('#sectionsFound').empty().show();
		$('#sectionFoundHeader').remove();
		$('#sectionsFound').append("<p class=\"alert-info\">No sections found.</p>");
	}
}
		
//Hide the column of listings when clicked
function collapseDiv(){
	$('#collapseColumn').removeClass("glyphicon glyphicon-arrow-down pull-left").addClass("glyphicon glyphicon-arrow-up pull-left");
	$('#collapseColumn').attr("title","Collapse this column");
	$('#sectionsFound').show("slow",function(){});
}
		
//Expand the column of listings when clicked
function expandDiv(){
	$('#collapseColumn').removeClass("glyphicon glyphicon-arrow-up pull-left").addClass("glyphicon glyphicon-arrow-down pull-left");
	$('#collapseColumn').attr("title","Expand this column");
	$('#sectionsFound').hide("slow",function(){});
}
        
/* Add a single section*/
function addSection(callNumber){
	console.log("call number: " + callNumber);
    ga('send', 'event', 'Add Section', 'User clicked', 'addSection', callNumber);
	$.ajax({
		type: "POST",
        url: 'http://apps.janeullah.com/coursepicker/classes/controllers/schedulecontroller.php',
        data: { action : "addSection", addSectionCallNumber : callNumber},
        dataType: "json"
    })
    .done(function(msg){
        $('body').css('cursor', 'auto');
        //errorMessage will be empty if no problems
        if (msg.errorMessage.length > 0){
        	console.log(msg.errorMessage);
            $('#errorMessage').html("").append(msg.errorMessage).show();
            $('#message').html("").hide();
        }else{
            console.log("Added section");
            $('#errorMessage').html("").hide();
            $('#message').html("").append(msg.infoMessage).show();
            sched = msg.userschedule; 
            redrawSchedule(sched); 
            displaySchedule();              
            ctx.renderAll();
        }
	})
    .fail(function(msg){
        $('body').css('cursor', 'auto');
        $('#errorMessage').html("").append(msg.responseText).show();
        $('#message').html("").hide();
        console.log(msg.responseText);
    });
}

/*
* Remove a single section
*/ 
function removeSection(callNumber){
	var formName = "#removeSectionForm_" + callNumber;
	//console.log(formName);
    ga('send', 'event', 'Remove Section', 'user clicked','removeSection', callNumber);
	$('body').css('cursor', 'wait');
	$.ajax({
		type: "POST",
  		url: 'classes/controllers/schedulecontroller.php',
  		data: { action : "removeSection", sectionToBeRemoved : callNumber},
		dataType: "json"
	})
	.done(function(msg){
		$('body').css('cursor', 'auto');
        if (msg.errorMessage.length == 0){
        	$('#errorMessage').html("").hide();
            $('#message').html("").append(msg.infoMessage).show();
            var schedSectionID = "#schedule_" + callNumber;
            $(schedSectionID).hide('slow', function(){ 
            	$(schedSectionID).remove(); 
            });
            if (msg.userschedule === '[]'){                       
                console.log("empty schedule");
                //remove all objects from canvas
                sched = "{}"; 
                ctx.clear();
                drawTable();
                drawSchedule();
            }else{
                sched = msg.userschedule;
                ctx.clear();
                drawTable();
                redrawSchedule(sched);
            }
            $('#userSchedule .intro').html("");       
        }else{                    
            $('#errorMessage').html("").append(msg.errorMessage).show();
            $('#message').html("").hide();
            console.log(msg.errorMessage);
        }
	})
  	.fail(function(msg){
  		$('#errorMessage').html("").append(msg.responseText).show();
  		$('#message').html("").hide();
		console.log("Error: " + msg.responseText);
	});
}
		

function getBuildingName(buildingNumber){
	var result = buildingNumber;
	try{
		Object.keys(uga_buildings).forEach(function(key){
			if (buildingNumber == key){
				result =  uga_buildings[key];
				//console.log("Found: " + result);
				throw true;
			}
		});
	}catch(e){
		if (e !== true){
			console.log("Error enumerating through list of buildings");
            console.log(e);
		}
	}
	return result;
}

/**
 * Generates divs for displaying the found sections
 * 
 * @param {int} index
 * @param {Object} section
 */
function insertDiv(index,section){
	var msg = "";
    msg += "<div class=\"draggable " + section.status + "\">";
    msg += "<span class=\"row1 right\">" + section.lecturer + "</span>";
    msg += "<span class=\"row1 left\">" + section.casTaken + "/" + section.casRequired + "</span><br/>";
    msg += "<span class=\"row2 left\">";
    var mtgs = section.meetings;
    Object.keys(mtgs).forEach(function(key){
    	msg += "<span title=\"" +mtgs[key] + "\" class=\"sectionDay\">";
        msg += key + "</span>";
    });
    msg += "</span>";
    if (section.status === 'Available'){
		msg += "<span title=\"Add " + section.coursePrefix + "-" + section.courseNumber + " to your schedule!\" onclick=\"addSection(" + section.callNumber + ")\" class=\"glyphicon glyphicon-plus pull-right plus-sign\"></span>";
	}else{
		msg += "<span class=\"status\">"+ section.status + "</span>";
	}
    msg += "</div>";
        return msg;
}
