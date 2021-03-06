var openElement = "";
var contentContainers = ["datascience", "software", "music", "contact"];

// Set up event listeners
$(document).ready( function() {
	for (i = 0; i < contentContainers.length; i++) {
		var id = contentContainers[i];
		var element = document.getElementById(id);

		$(".quadrants").disableSelection();
		$(".center").disableSelection();
		$(".header").disableSelection();

		element.addEventListener("transitionend", transitionEnd);
	}

	$(window).resize(updateFlickityOrientation);

	$(document).on("keydown", function(event) { // ESC key to close
		if (event.keyCode == 27) {
			closeContent(event);
		}
	});

	$(window).bind('hashchange', function() {
		if (window.location.hash != "#"+openElement) {
			if (openElement == "") {
				openContent(window.location.hash.split("#")[1]);
			} else {
				closeContent();
			}
		}
	});

	// Load contact info (via script to hopefully mask from bots?)
	$('#emaddress').html("alex@cobblers.net");
	$('#tpnumber').html("+1(425)736-6378");

	// $(window).resize();

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

	if (window.location.hash != "") {
		openContent(window.location.hash.split("#")[1]);
	}
	updateFlickityOrientation();
});

function openContent(id) {
	var element = $("#"+id);
	var closebutton = $("#"+id+"X");
	
	if (element.hasClass("closed") && openElement == "") {
		element.removeClass("closed");
		element.addClass("open");
		element.removeClass("border");

		closebutton.css("display", "block");
		closebutton.removeClass("fast rotateOut")
		closebutton.addClass("animated delay-point5s rotateIn");

		openElement = id;
		window.location.hash = $("#"+id+" .quadlabel")[0].textContent.toLowerCase().replace(/\s/g, "");
		
		moveCenter(id, true);
		updateZ();
	} 
}

function closeContent(event) {
	if (event) {
		event.stopPropagation();
	}
	
	$("#center").css("z-index", "101");
	if (openElement != "") {
		var element = document.getElementById(openElement);
		var closebutton = $("#"+openElement+"X");
		var label = $("#"+openElement + "> .quadlabel");
		var content = openElement == "contact" ? $("#contactInfo") : $("#"+ openElement + " .slideshow");

		content.css("transition", "opacity .25s");
		content.css("opacity", 0);
		content.css("z-index", -1);

		element.classList.remove("open");
		element.classList.add("closed");
		element.classList.add("border");

		closebutton.removeClass("delay-point5s rotateIn");
		closebutton.addClass("fast rotateOut");

		moveCenter(openElement, false);
		openElement = "";
		window.location.hash = "";
	}
}

function moveCenter(id, out) {
	var center = document.getElementById("center");
	var square = $("#center");
	var element = document.getElementById(id);

	if (out) {
		square.css("opacity", "0");
		if ( id == "datascience" ) {
			center.style.top = "100%";
			center.style.left = "100%";
			center.style.transform = "translate(-100%, -100%)";
		}

		else if ( id == "software" ) {
			center.style.top = "100%";
			center.style.left = "0%";
			center.style.transform = "translate(0%, -100%)";
		}

		else if ( id == "music" ) {
			center.style.top = "0%"
			center.style.left = "100%";
			center.style.transform = "translate(-100%, 0%)";
		}

		else if ( id == "contact" ) {
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
		var srcElem = event.srcElement.id;
		
		if (srcElem != openElement) { 		// we just finished closing a menu
			var label = $("#" +srcElem+ " > .quadlabel");
			label.fadeIn(500);
		} 
		else {							// a menu just opened, prepare the content
			prepareContent();
		}
	}
}

// deal with borders title text and show the content
function prepareContent() {
	if (openElement != "") {
		var menu = $("#"+openElement);
		var label = $("#"+openElement + "> .quadlabel");
		label.fadeOut(500);

		$(".main-carousel").flickity('resize');
		var content = openElement == "contact" ? $("#contactInfo") : $("#"+ openElement + " .slideshow");

		content.css("transition", "opacity .5s .5s linear");
		content.css("opacity", 1);
		content.css("z-index", "initial");

		if (openElement != "contact") {
			$("#center").css("z-index", 50);
		}	
	}
}

// make sure the selected content is on top until closed
function updateZ() {
	for (i = 0; i < contentContainers.length; i++) {
		var id = contentContainers[i];

		if (id == openElement) {
			document.getElementById(id).style.zIndex = 100;
		} else {
			document.getElementById(id).style.zIndex = "initial";
		}
	}
}

function updateFlickityOrientation() {
	if (window.innerHeight > window.innerWidth) {
		// $(".main-carousel").flickity({cellAlign: 'left'});
	} else {
		$(".main-carousel").flickity({cellAlign: 'center'});
	}
}