window.onload = (function() {
  var shSkillPill = (function() {
      
    var scoreElems = Sizzle("object[data-score]");

    for (var x = 0; x < scoreElems.length; x++) {
      var y = scoreElems[x].contentDocument;

      switch (Number(scoreElems[x].getAttribute("data-score"))) {
        case 0:
          Sizzle('rect', y)[1].style.fill = "#cccccc";
          Sizzle('rect', y)[2].style.fill = "#cccccc";
          Sizzle('rect', y)[3].style.fill = "#cccccc";
          break;
        case 1:
          Sizzle('rect', y)[1].style.fill = "#cccccc";
          Sizzle('rect', y)[2].style.fill = "#cccccc";
          break;
        case 2:
          Sizzle('rect', y)[1].style.fill = "#cccccc";
          break;
        case 3:
          break;
      }
    }

  })();

  var toggleBlink = function(event) {
    element = event.target;
    if (element.className.indexOf('blink') === -1) {
      element.className = element.className + " blink";
    } else {
      element.className = "click2blnk";
    }      
  }

  var blinkers = Sizzle(".click2blnk");
  if (Array.isArray(blinkers)) {
    for (var x = 0; x < blinkers.length; x++) {
      blinkers[x].addEventListener("click", toggleBlink);
    }
  }
  


}); // end onload

