
var modal = document.getElementById('settings');


var btn = document.getElementById("settingsButton");


btn.onclick = function() 
{
    modal.style.display = "block";
}


window.onclick = function(event) 
{
    if (event.target == modal) 
	{
        modal.style.display = "none";
    }
}
