   import { signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-dashboard.js";

            signOut(auth).then(() => {
            window.location.href = "login.html";
          });
                
           import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

        onAuthStateChanged(auth, (user) => {
         if (!user) {
         window.location.href = "login.html";
       }
        }); 

    import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const auth = getAuth();

document.getElementById("logoutBtn").addEventListener("click", () => {
  signOut(auth)
    .then(() => {
      console.log("Logout successful");
      window.location.href = "login.html";
    })
    .catch((error) => {
      console.error("Logout error:", error);
    });
});    