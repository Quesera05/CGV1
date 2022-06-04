import {Level0} from './Levels/Level0.js';
import {Level1} from './Levels/Level1.js'; //placeholder for when they are added
import {Level2} from './Levels/Level2.js';
//import {Level3} from './Levels/Level3.js';


document.getElementById("0").addEventListener("click", (event) => {
    removeMenu();
    togglePopup();
    //Level0();
    
}, false);

document.getElementById("closePopup").addEventListener("click", (event) => {
    closePopup();
    Level0();
    
}, false);

document.getElementById("1").addEventListener("click", (event) => {
    removeMenu();
    Level1();
    
}, false);

document.getElementById("2").addEventListener("click", (event) => {
    removeMenu();
    Level2();
    
}, false);

//go straight to certain level without having to go through menu
// removeMenu();
// Level0();

//need to add the menu items back when player exits level
function generateMenu() {

}

function removeMenu() {
    document.getElementById("GameName").remove();
    document.getElementById("Parent").remove();
}


function togglePopup(){
    document.getElementById("popup-1").classList.toggle("active");
}

function closePopup(){
    document.getElementById("popup-1").remove();
   
}
    





