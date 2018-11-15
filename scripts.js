var openElement = "";
var conentContainers = ["topleft", "topright", "bottomleft", "bottomright"];

// Set up event listeners
$(document).ready( function() {
	for (i = 0; i < conentContainers.length; i++) {
		var id = conentContainers[i];
		var element = document.getElementById(id);

		$(".quadrants").disableSelection();
		$(".center").disableSelection();
		$(".header").disableSelection();
		element.addEventListener("transitionend", transitionEnd);
	}

	$(document).on("keydown", function(event) { // ESC key to close
		if (event.keyCode == 27) {
			closeContent(event);
		}
	})

	$('.main-carousel').flickity({
 		 // options
  		cellAlign: 'center',
  		freeScroll: true,
  		accessability: true,
  		setGallerySize: false,
  		arrowShape: { 
 			x0: 10,
  			x1: 60, y1: 50,
  			x2: 65, y2: 45,
  			x3: 20 },

  		dragThreshold: 10,
  		selectedAttraction: 0.01,
		friction: 0.2
	});
});

function openContent(id) {
	var element = document.getElementById(id);
	var closebutton = $("#"+id+"X");
	
	if (element.classList.contains("closed") && openElement == "" ) {
		element.classList.remove("closed");
		element.classList.add("open");
		element.classList.remove("border");

		closebutton.css("display", "block");
		closebutton.removeClass("fast rotateOut")
		closebutton.addClass("animated delay-point5s rotateIn");

		openElement = id;
		moveCenter(id, true);
		updateZ();
	} 
}

function closeContent(event) {
	event.stopPropagation();
	
	if (openElement != "") {
		var element = document.getElementById(openElement);
		var closebutton = $("#"+openElement+"X");
		var label = $("#"+openElement + "> .quadlabel");
		var content = $("#"+ openElement + " .slideshow");

		content.css("transition", "opacity .25s")
		content.css("opacity", 0)
		
		element.classList.remove("open");
		element.classList.add("closed");
		element.classList.add("border");

		closebutton.removeClass("delay-point5s rotateIn");
		closebutton.addClass("fast rotateOut");

		moveCenter(openElement, false);
		openElement = "";
	}
}

function moveCenter(id, out) {
	var center = document.getElementById("center");
	var square = $("#center");
	var element = document.getElementById(id);

	if (out) {
		square.css("opacity", "0");
		if ( id == "topleft" ) {
			center.style.top = "100%";
			center.style.left = "100%";
			center.style.transform = "translate(-100%, -100%)";
		}

		else if ( id == "topright" ) {
			center.style.top = "100%";
			center.style.left = "0%";
			center.style.transform = "translate(0%, -100%)";
		}

		else if ( id == "bottomleft" ) {
			center.style.top = "0%"
			center.style.left = "100%";
			center.style.transform = "translate(-100%, 0%)";
		}

		else if ( id == "bottomright" ) {
			square.css("opacity", "1");
			center.style.top = "0%"
			center.style.left = "50%";
			center.style.transform = "translate(-50%, 10%)";
		}

	} else {
		square.css("opacity", "1");
		center.style.top = "50%";
		center.style.left = "50%";
		center.style.transform = "translate(-50%, -50%)";
	}
}

function transitionEnd(event) {
	if (event.propertyName == "width") { // something has moved, regardless we run these
		updateZ();
		
		if (openElement == "") { 		// we just finished closing a menu
			var label = $("#"+event.path[0].id + " > .quadlabel");
			label.fadeIn(500);
		} 
		else {							// a menu just opened, prepare the conent
			var menu = $("#"+openElement);
			var label = $("#"+openElement + "> .quadlabel");

			prepareConent();
		}

	}
}

// deal with borders title text and show the conent
function prepareConent() {
	if (openElement != "") {
		var menu = $("#"+openElement);
		var label = $("#"+openElement + "> .quadlabel");
		label.fadeOut(500);

		$(".main-carousel").flickity('resize');
		var content = $("#"+ openElement + " .slideshow");
		content.css("transition", "opacity .5s .5s linear")
		content.css("opacity", 1)
	}
}

// make sure the selected content is on top until closed
function updateZ() {
	for (i = 0; i < conentContainers.length; i++) {
		var id = conentContainers[i];

		if (id == openElement) {
			document.getElementById(id).style.zIndex = 100;
		} else {
			document.getElementById(id).style.zIndex = "initial";
		}
	}
}