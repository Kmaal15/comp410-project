// Simple mobile nav toggle for all pages

const navToggle = document.getElementById("nav-toggle");

const mainNav = document.getElementById("main-nav");



if (navToggle && mainNav) {

 navToggle.addEventListener("click", () => {

 mainNav.classList.toggle("open");

 });

}



// Sign-in & sign-up logic for auth pages

document.addEventListener("DOMContentLoaded", () => {

 /* ---------- SIGN IN LOGIC (signin_senior project.html) ---------- */

 const signInButton = document.getElementById("signin-button");

 const viewSelect = document.getElementById("signin-view");

 const emailInput = document.getElementById("signin-email");

 const passwordInput = document.getElementById("signin-password");



 if (signInButton && viewSelect && emailInput && passwordInput) {

 signInButton.addEventListener("click", () => {

 const selectedView = viewSelect.value;

 const email = emailInput.value.trim();

 const password = passwordInput.value.trim();



 if (!selectedView) {

 alert("Please choose which view you want to enter (Admin, Student, or Volunteer).");

 return;

 }



 if (!email || !password) {

 alert("For this , please enter an email and password before signing in.");

 return;

 }



 let targetPage = "";



 if (selectedView === "admin") {

 targetPage = "admin_senior project.html";

 } else if (selectedView === "student") {

 targetPage = "student_senior project.html";

 } else if (selectedView === "volunteer") {

 targetPage = "volunteer_senior project.html";

 }



 if (targetPage) {

 window.location.href = targetPage;

 }

 });

 }



 /* ---------- SIGN UP LOGIC (signup_senior project.html) ---------- */

 const signupButton = document.getElementById("signup-button");

 const signupRole = document.getElementById("signup-role");

 const signupEmailInput = document.getElementById("signup-email");

 const signupPasswordInput = document.getElementById("signup-password");



 if (signupButton && signupRole && signupEmailInput && signupPasswordInput) {

 signupButton.addEventListener("click", () => {

 const email = signupEmailInput.value.trim();

 const password = signupPasswordInput.value.trim();

 const role = signupRole.value;



 if (!email || !password || !role) {

 alert("Please enter an email, password, and choose your role to sign up.");

 return;

 }



 let targetPage = "";

 if (role === "admin") {

 targetPage = "admin_senior project.html";

 } else if (role === "student") {

 targetPage = "student_senior project.html";

 } else if (role === "volunteer") {

 targetPage = "volunteer_senior project.html";

 }



 alert(

 `Sign-up successful! ( only)\nYou are registered as a ${role}. Redirecting you to your view.`

 );



 if (targetPage) {

 window.location.href = targetPage;

 }

 });

 }

});