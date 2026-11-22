/* =========================================================
   ONE AHMEDABAD - COMPLETE JAVASCRIPT
   Browser-based demonstration platform
   ========================================================= */

"use strict";
// FIREBASE CONFIGURATION
const firebaseConfig = {
    apiKey: "AIzaSyD3LkUeWN0PxFmbmsp_nMPhCJdJoeql3u0",
    authDomain: "one-ahmedabad.firebaseapp.com",
    projectId: "one-ahmedabad",
    storageBucket: "one-ahmedabad.firebasestorage.app",
    messagingSenderId: "134765797049",
    appId: "1:134765797049:web:3c5b0599471e8076ef8568",
    measurementId: "G-TK6GFQ2HTS"
};

// INITIALIZE FIREBASE
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

/* =========================================================
   1. CONFIGURATION AND STORAGE
   ========================================================= */

const STORAGE = {
    users: "oa_users",
    currentUser: "oa_current_user",
    complaints: "oa_complaints",
    applications: "oa_applications",
    feedback: "oa_feedback"
};


function readData(key, fallback = []) {
    try {
        const data = JSON.parse(localStorage.getItem(key));
        return data ?? fallback;
    } catch (error) {
        console.error("Storage read error:", error);
        return fallback;
    }
}

function saveData(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error("Storage save error:", error);
        showMessage("Storage is full or unavailable. Please remove some saved data.", "error");
        return false;
    }
}

function getUsers() {
    return readData(STORAGE.users);
}

function getComplaints() {
    return readData(STORAGE.complaints);
}

function getApplications() {
    return readData(STORAGE.applications);
}

function getFeedback() {
    return readData(STORAGE.feedback);
}

function getCurrentUser() {
    return readData(STORAGE.currentUser, null);
}

function setCurrentUser(user) {
    if (user) {
        saveData(STORAGE.currentUser, user);
    } else {
        localStorage.removeItem(STORAGE.currentUser);
    }
}

/* =========================================================
   2. GENERAL HELPERS
   ========================================================= */

function $(id) {
    return document.getElementById(id);
}

function addListener(id, eventName, callback) {
    const element = $(id);

    if (element) {
        element.addEventListener(eventName, callback);
    }
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function showMessage(message, type = "success") {
    const oldToast = $("appToast");

    if (oldToast) oldToast.remove();

    const toast = document.createElement("div");

    toast.id = "appToast";
    toast.textContent = message;

    Object.assign(toast.style, {
        position: "fixed",
        top: "100px",
        right: "22px",
        zIndex: "99999",
        maxWidth: "min(380px, calc(100vw - 40px))",
        padding: "15px 20px",
        borderRadius: "10px",
        background: type === "error" ? "#b83232" : "#087f83",
        color: "#ffffff",
        boxShadow: "0 8px 25px rgba(0,0,0,.15)",
        fontSize: "13px",
        lineHeight: "1.5"
    });

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3500);
}

function makeId(prefix) {
    const date = new Date();

    const datePart = [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0")
    ].join("");

    const random = Math.floor(10000 + Math.random() * 90000);

    return `${prefix}-${datePart}-${random}`;
}

function formatDate(value) {
    if (!value) return "Not available";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "Not available";

    return date.toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short"
    });
}

function normalizeEmail(email) {
    return String(email || "").trim().toLowerCase();
}

/* =========================================================
   3. FORM VALIDATION
   ========================================================= */

// Standard email format
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

// Indian mobile number: 10 digits starting from 6-9
function isValidPhone(phone) {
    return /^[6-9][0-9]{9}$/.test(phone.trim());
}

// Password: 8 characters, uppercase, lowercase, number,
// and at least one special character
function isStrongPassword(password) {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,}$/.test(password);
}

// Supports common Indian names with spaces, hyphens and apostrophes
function isValidName(name) {
    return /^[\p{L}][\p{L}\s'.-]{1,49}$/u.test(name.trim());
}

function validateEmailField(id) {
    const field = $(id);

    if (!field) return true;

    if (!isValidEmail(field.value)) {
        showMessage("Please enter a valid email address.", "error");
        field.focus();
        return false;
    }

    return true;
}

function validatePhoneField(id) {
    const field = $(id);

    if (!field) return true;

    if (!isValidPhone(field.value)) {
        showMessage(
            "Enter a valid 10-digit Indian mobile number starting with 6, 7, 8 or 9.",
            "error"
        );
        field.focus();
        return false;
    }

    return true;
}

function requireLogin() {
    const user = getCurrentUser();

    if (!user || user.role !== "citizen") {
        showMessage("Please log in as a citizen first.", "error");
        showPage("login");
        return false;
    }

    return true;
}

/* =========================================================
   4. PAGE NAVIGATION
   ========================================================= */

function showPage(pageId) {
    const user = getCurrentUser();

    const protectedPages = [
        "dashboard",
        "profile",
        "complaints"
    ];

    if (
        protectedPages.includes(pageId) &&
        (!user || user.role !== "citizen")
    ) {
        showMessage("Please log in to continue.", "error");
        pageId = "login";
    }

    if (pageId === "admin" && (!user || user.role !== "admin")) {
        pageId = "adminLogin";
    }

    document.querySelectorAll(".page").forEach(page => {
        page.classList.remove("active");
    });

    const target = $(pageId);

    if (!target) {
        console.error("Page not found:", pageId);
        return;
    }

    target.classList.add("active");

    const nav = document.querySelector(".nav-links");

    if (nav) nav.classList.remove("show");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    if (pageId === "dashboard") renderCitizenDashboard();
    if (pageId === "profile") renderProfile();
    if (pageId === "admin") renderAdminDashboard();

    updateNavigation();
}

function toggleMenu() {
    const nav = document.querySelector(".nav-links");

    if (nav) nav.classList.toggle("show");
}

function updateNavigation() {
    const user = getCurrentUser();
    const actions = $("navActions");

    if (!actions) return;

    if (!user) {
        actions.innerHTML = `
            <button class="btn-outline" onclick="showPage('login')">
                Login
            </button>

            <button class="btn-primary" onclick="showPage('register')">
                Register
            </button>
        `;
        return;
    }

    if (user.role === "admin") {
        actions.innerHTML = `
            <button class="btn-primary" onclick="showPage('admin')">
                Admin Panel
            </button>

            <button class="btn-outline" onclick="logout()">
                Logout
            </button>
        `;
    } else {
        actions.innerHTML = `
            <button class="btn-primary" onclick="showPage('dashboard')">
                My Dashboard
            </button>

            <button class="btn-outline" onclick="logout()">
                Logout
            </button>
        `;
    }
}

/* =========================================================
   5. REGISTRATION
   ========================================================= */

async function handleRegistration(event) {
    event.preventDefault();

    const name = $("registerName").value.trim();
    const email = normalizeEmail($("registerEmail").value);
    const phone = $("registerPhone").value.trim();
    const password = $("registerPassword").value;
    const confirmPassword = $("confirmPassword").value;

    if (!isValidName(name)) {
        showMessage("Enter a valid name using 2-50 letters.", "error");
        $("registerName").focus();
        return;
    }

    if (!isValidEmail(email)) {
        showMessage("Please enter a valid email address.", "error");
        $("registerEmail").focus();
        return;
    }

    if (!isValidPhone(phone)) {
        showMessage("Enter a valid 10-digit Indian mobile number.", "error");
        $("registerPhone").focus();
        return;
    }

    if (!isStrongPassword(password)) {
        showMessage(
            "Password needs 8+ characters, uppercase, lowercase, a number and a special character.",
            "error"
        );
        $("registerPassword").focus();
        return;
    }

    if (password !== confirmPassword) {
        showMessage("Password and confirm password do not match.", "error");
        $("confirmPassword").focus();
        return;
    }

    try {
        const userCredential = await auth.createUserWithEmailAndPassword(
            email,
            password
        );

        const user = userCredential.user;

        const userData = {
            id: user.uid,
            name: name,
            email: email,
            phone: phone,
            role: "citizen",
            createdAt: new Date().toISOString()
        };

        await db.collection("users").doc(user.uid).set(userData);

        setCurrentUser(userData);

        $("registerForm").reset();

        showMessage("Registration successful! Welcome to ONE AHMEDABAD.");

        showPage("dashboard");

    } catch (error) {
        showMessage("Registration failed: " + error.message, "error");
    }
}






/* =========================================================
   6. CITIZEN LOGIN
   ========================================================= */
async function handleLogin(event) {
    event.preventDefault();

    const email = normalizeEmail($("loginEmail").value);
    const password = $("loginPassword").value;

    if (!isValidEmail(email)) {
        showMessage("Please enter a valid email address.", "error");
        $("loginEmail").focus();
        return;
    }

    if (!password) {
        showMessage("Please enter your password.", "error");
        $("loginPassword").focus();
        return;
    }

    try {
        const userCredential = await auth.signInWithEmailAndPassword(
            email,
            password
        );

        const user = userCredential.user;

        const userDoc = await db.collection("users").doc(user.uid).get();

        if (!userDoc.exists || userDoc.data().role !== "citizen") {
            await auth.signOut();
            showMessage("Citizen profile not found.", "error");
            return;
        }

        const userData = userDoc.data();

        setCurrentUser({
            id: user.uid,
            name: userData.name,
            email: user.email,
            phone: userData.phone,
            role: "citizen"
        });

        $("loginForm").reset();

        showMessage("Login successful. Welcome back!");

        showPage("dashboard");

    } catch (error) {
        showMessage("Login failed: " + error.message, "error");
    }
}






/* =========================================================
   7. ADMIN LOGIN
   ========================================================= */

async function handleAdminLogin(event) {
    event.preventDefault();

    const email = normalizeEmail($("adminEmail").value);
    const password = $("adminPassword").value;

    try {
        const userCredential = await auth.signInWithEmailAndPassword(
            email,
            password
        );

        const user = userCredential.user;
        if (user.uid !== "2s7Fo6QyS8dCv2mbtD5SgzBfFi23") {
            await auth.signOut();
            showMessage("Access denied. You are not an administrator.", "error");
            return;
        }

        setCurrentUser({
            id: user.uid,
            name: "System Administrator",
            email: user.email,
            role: "admin"
        });

        $("adminLoginForm").reset();

        showMessage("Administrator login successful.");

        showPage("admin");

    } catch (error) {
        showMessage("Login failed: " + error.message, "error");
    }
}

/* =========================================================
   8. LOGOUT
   ========================================================= */

async function logout() {
    try {
        await auth.signOut();

        setCurrentUser(null);
        updateNavigation();

        showMessage("You have been logged out.");

        showPage("home");

    } catch (error) {
        showMessage("Logout failed: " + error.message, "error");
    }
}

/* =========================================================
   9. CITIZEN DASHBOARD
   ========================================================= */



function statusClass(status) {
    return String(status || "")
        .toLowerCase()
        .replace(/\s+/g, "-");
}

function openTracking(id) {
    if (!$("trackingId") || !$("trackForm")) return;

    $("trackingId").value = id;

    showPage("track");

    $("trackForm").requestSubmit();
}

/* =========================================================
   10. CITIZEN PROFILE
   ========================================================= */

function renderProfile() {
    const user = getCurrentUser();

    if (!user || user.role !== "citizen") return;

    if (!$("profileDetails")) return;

    $("profileDetails").innerHTML = `
        <div class="result-card">
            <h3>Citizen Information</h3>

            <p><strong>Name:</strong> ${escapeHTML(user.name)}</p>

            <p><strong>Email:</strong> ${escapeHTML(user.email)}</p>

            <p><strong>Mobile:</strong> ${escapeHTML(user.phone)}</p>

            <p><strong>Citizen ID:</strong> ${escapeHTML(user.id)}</p>
        </div>
    `;
}

/* =========================================================
   11. AI-ASSISTED COMPLAINT CLASSIFICATION
   ========================================================= */

function classifyComplaint(text) {
    const value = String(text || "").toLowerCase();

    const rules = [
        {
            words: ["garbage", "waste", "rubbish", "dustbin", "trash"],
            category: "Garbage Management",
            department: "Solid Waste Management",
            priority: "Medium"
        },
        {
            words: ["pothole", "road", "broken road", "street damage"],
            category: "Road Damage / Pothole",
            department: "Roads and Engineering",
            priority: "High"
        },
        {
            words: ["water leak", "water leakage", "pipe burst", "water supply"],
            category: "Water Leakage",
            department: "Water Supply Department",
            priority: "High"
        },
        {
            words: ["streetlight", "street light", "lamp", "dark road"],
            category: "Streetlight Issue",
            department: "Electrical Department",
            priority: "Medium"
        },
        {
            words: ["drainage", "sewage", "sewer", "blocked drain"],
            category: "Drainage Problem",
            department: "Drainage Department",
            priority: "High"
        },
        {
            words: ["cleanliness", "sanitation", "public toilet"],
            category: "Public Sanitation",
            department: "Public Health Department",
            priority: "Medium"
        }
    ];

    const match = rules.find(rule =>
        rule.words.some(word => value.includes(word))
    );

    if (match) {
        return {
            ...match,
            explanation: "Suggested from the complaint text."
        };
    }

    return {
        category: "Other",
        department: "Municipal Review Required",
        priority: "Low",
        explanation: "No clear category detected. Please review manually."
    };
}

function updateAISuggestion() {
    const title = $("complaintTitle")?.value || "";
    const description = $("complaintDescription")?.value || "";

    const combined = `${title} ${description}`.trim();

    if (!$("aiSuggestion")) return;

    if (combined.length < 5) {
        $("aiSuggestion").textContent =
            "AI complaint assistance will appear here.";
        return;
    }

    const result = classifyComplaint(combined);

    $("aiSuggestion").innerHTML = `
        <strong>✦ AI-assisted suggestion</strong><br>

        Suggested category: ${escapeHTML(result.category)}<br>

        Suggested department: ${escapeHTML(result.department)}<br>

        Suggested priority: ${escapeHTML(result.priority)}<br>

        <small>
            ${escapeHTML(result.explanation)}
            Human/admin verification is required.
        </small>
    `;

    const category = $("complaintCategory");

    if (
        category &&
        [...category.options].some(option =>
            option.value === result.category ||
            option.textContent.trim() === result.category
        )
    ) {
        category.value = result.category;
    }
}

/* =========================================================
   12. COMPLAINT PHOTO PREVIEW
   ========================================================= */

function handleImagePreview() {
    const file = this.files[0];
    const preview = $("imagePreview");

    if (!preview) return;

    preview.innerHTML = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
        showMessage("Please select an image file.", "error");
        this.value = "";
        return;
    }

    if (file.size > 2 * 1024 * 1024) {
        showMessage("Please choose an image smaller than 2 MB.", "error");
        this.value = "";
        return;
    }

    const image = document.createElement("img");

    image.alt = "Complaint photograph preview";

    const imageURL = URL.createObjectURL(file);

    image.src = imageURL;

    image.onload = () => URL.revokeObjectURL(imageURL);

    preview.appendChild(image);
}

/* =========================================================
   13. CURRENT LOCATION
   ========================================================= */

function getLocation() {
    if (!navigator.geolocation) {
        showMessage("Location services are not supported.", "error");
        return;
    }

    showMessage("Requesting your location...");

    navigator.geolocation.getCurrentPosition(
        position => {
            if ($("latitude")) {
                $("latitude").value = position.coords.latitude;
            }

            if ($("longitude")) {
                $("longitude").value = position.coords.longitude;
            }

            showMessage("Location captured successfully.");
        },
        error => {
            console.error("Geolocation error:", error);

            showMessage(
                "Location unavailable. Enter the address manually.",
                "error"
            );
        },
        {
            enableHighAccuracy: true,
            timeout: 10000
        }
    );
}

/* =========================================================
   14. COMPLAINT SUBMISSION
   ========================================================= */


async function handleComplaintSubmission(event) {
    event.preventDefault();

    if (!requireLogin()) return;

    const user = getCurrentUser();
    const firebaseUser = auth.currentUser;

    if (!firebaseUser || firebaseUser.uid !== user.id) {
        showMessage("Please log in again.", "error");
        return;
    }

    const title = $("complaintTitle").value.trim();
    const description = $("complaintDescription").value.trim();
    const category = $("complaintCategory").value;
    const location = $("complaintLocation").value.trim();
    const file = $("complaintImage")?.files[0];

    if (title.length < 5 || title.length > 100) {
        showMessage("Complaint title must contain 5-100 characters.", "error");
        $("complaintTitle").focus();
        return;
    }

    if (description.length < 10 || description.length > 1000) {
        showMessage("Description must contain 10-1000 characters.", "error");
        $("complaintDescription").focus();
        return;
    }

    if (location.length < 3) {
        showMessage("Please enter a valid complaint location.", "error");
        $("complaintLocation").focus();
        return;
    }

    if (file && !file.type.startsWith("image/")) {
        showMessage("Please select a valid image.", "error");
        return;
    }

    if (file && file.size > 2 * 1024 * 1024) {
        showMessage("Image must be smaller than 2 MB.", "error");
        return;
    }

    let imageData = "";

    if (file) {
        imageData = await new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error("Image read failed"));

            reader.readAsDataURL(file);
        }).catch(() => "");

        if (!imageData) {
            showMessage("Unable to read the image. Please try again.", "error");
            return;
        }
    }

    const suggestion = classifyComplaint(`${title} ${description}`);

    const complaint = {
        id: makeId("AMC"),
        userId: firebaseUser.uid,
        citizenName: user.name,
        title,
        category: category || suggestion.category,
        description,
        location,
        latitude: $("latitude")?.value || "",
        longitude: $("longitude")?.value || "",
        image: imageData,
        department: suggestion.department,
        priority: suggestion.priority,
        status: "Submitted",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        adminNote: ""
    };

    try {
        const firebaseComplaint = {
            ...complaint,
            image: ""
        };

        await db.collection("complaints").add(firebaseComplaint);

        const complaints = getComplaints();

        complaints.push(complaint);

        if (!saveData(STORAGE.complaints, complaints)) return;

        $("complaintForm").reset();

        if ($("imagePreview")) {
            $("imagePreview").innerHTML = "";
        }

        if ($("aiSuggestion")) {
            $("aiSuggestion").textContent =
                "AI complaint assistance will appear here.";
        }

        showMessage(`Complaint submitted! Reference ID: ${complaint.id}`);

        showPage("dashboard");

    } catch (error) {
        showMessage("Complaint submission failed: " + error.message, "error");
    }
}


/* =========================================================
   15. COMPLAINT TRACKING
   ========================================================= */



async function handleTracking(event) {
    event.preventDefault();

    const id = $("trackingId").value.trim().toUpperCase();
    const user = getCurrentUser();
    const firebaseUser = auth.currentUser;

    const result = $("trackingResult");

    if (!user || !firebaseUser || firebaseUser.uid !== user.id) {
        showMessage("Please log in again to track your complaint.", "error");
        return;
    }

    try {
        let query = db.collection("complaints")
            .where("id", "==", id);

        if (user.role !== "admin") {
            query = query.where("userId", "==", firebaseUser.uid);
        }

        const snapshot = await query.get();

        if (snapshot.empty) {
            result.innerHTML = `
                <div class="result-card">
                    <h3>Request Not Found</h3>
                    <p>Please check your reference ID.</p>
                </div>
            `;
            return;
        }

        const complaint = snapshot.docs[0].data();

        if (
            user.role !== "admin" &&
            complaint.userId !== firebaseUser.uid
        ) {
            result.innerHTML = `
                <div class="result-card">
                    <h3>Access Restricted</h3>
                    <p>Please log in with the citizen account that submitted this request.</p>
                </div>
            `;
            return;
        }

        result.innerHTML = `
            <div class="result-card">
                <h3>${escapeHTML(complaint.title)}</h3>

                <p><strong>Reference:</strong> ${escapeHTML(complaint.id)}</p>

                <p><strong>Category:</strong> ${escapeHTML(complaint.category)}</p>

                <p><strong>Department:</strong> ${escapeHTML(complaint.department)}</p>

                <p><strong>Priority suggestion:</strong> ${escapeHTML(complaint.priority)}</p>

                <p><strong>Location:</strong> ${escapeHTML(complaint.location)}</p>

                <p><strong>Submitted:</strong> ${formatDate(complaint.createdAt)}</p>

                <p><strong>Last updated:</strong> ${formatDate(complaint.updatedAt)}</p>

                <p><strong>Status:</strong>
                    <span class="status ${statusClass(complaint.status)}">
                        ${escapeHTML(complaint.status)}
                    </span>
                </p>

                <p>
                    <strong>Admin note:</strong>
                    ${escapeHTML(complaint.adminNote || "No update available.")}
                </p>

                ${complaint.status === "Resolved" &&
                user.role === "citizen"
                ? `
                    <button class="btn-primary"
                        onclick="submitFeedback('${escapeHTML(complaint.id)}')">
                        Give Feedback
                    </button>
                `
                : ""
            }
            </div>
        `;

    } catch (error) {
        showMessage("Tracking failed: " + error.message, "error");
    }
}

/* =========================================================
   16. CITIZEN FEEDBACK
   ========================================================= */


async function submitFeedback(complaintId) {
    const user = getCurrentUser();

    if (!user || user.role !== "citizen") {
        showMessage("Please log in as a citizen.", "error");
        return;
    }

    const firebaseUser = auth.currentUser;

    if (!firebaseUser || firebaseUser.uid !== user.id) {
        showMessage("Please log in again.", "error");
        return;
    }

    const rating = prompt("Rate the resolution from 1 to 5:");

    if (rating === null) return;

    const score = Number(rating);

    if (!Number.isInteger(score) || score < 1 || score > 5) {
        showMessage("Enter a rating between 1 and 5.", "error");
        return;
    }

    const comment = prompt("Share your feedback (optional):") || "";

    try {
        const feedback = getFeedback();

        if (feedback.some(item =>
            item.complaintId === complaintId &&
            item.userId === user.id
        )) {
            showMessage("Feedback has already been submitted.", "error");
            return;
        }

        const existingFeedback = await db.collection("feedback")
            .where("complaintId", "==", complaintId)
            .where("userId", "==", firebaseUser.uid)
            .get();

        if (!existingFeedback.empty) {
            showMessage("Feedback has already been submitted.", "error");
            return;
        }

        const newFeedback = {
            id: makeId("FDB"),
            complaintId,
            userId: firebaseUser.uid,
            citizenName: user.name,
            rating: score,
            comment: comment.trim(),
            createdAt: new Date().toISOString()
        };

        await db.collection("feedback").add(newFeedback);

        feedback.push(newFeedback);
        saveData(STORAGE.feedback, feedback);

        showMessage("Thank you for your feedback!");

        renderAdminDashboard();

    } catch (error) {
        showMessage("Feedback submission failed: " + error.message, "error");
    }
}


/* =========================================================
   17. SERVICE APPLICATIONS
   ========================================================= */

async function submitApplication(event, type, data) {
    event.preventDefault();

    if (!requireLogin()) return;

    const user = getCurrentUser();
    const firebaseUser = auth.currentUser;

    if (!firebaseUser || firebaseUser.uid !== user.id) {
        showMessage("Please log in again.", "error");
        return;
    }

    for (const value of Object.values(data)) {
        if (!String(value ?? "").trim()) {
            showMessage("Please complete all required application fields.", "error");
            return;
        }
    }

    if (data.email && !isValidEmail(data.email)) {
        showMessage("Please enter a valid email address.", "error");
        return;
    }

    const application = {
        id: makeId("APP"),
        userId: firebaseUser.uid,
        citizenName: user.name,
        type,
        data,
        status: "Submitted",
        department: "Awaiting Assignment",
        adminNote: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    try {
        await db.collection("applications").add(application);

        const applications = getApplications();
        applications.push(application);
        saveData(STORAGE.applications, applications);

        event.target.reset();

        showMessage(`Application submitted. ID: ${application.id}`);

    } catch (error) {
        showMessage("Application submission failed: " + error.message, "error");
    }
}



function handleCertificateApplication(event) {
    submitApplication(event, "Certificate", {
        certificateType: $("certificateType").value,
        applicant: $("certificateApplicant").value.trim(),
        email: $("certificateEmail").value.trim(),
        details: $("certificateDetails").value.trim()
    });
}

function handleBuildingApplication(event) {
    submitApplication(event, "Building Permission", {
        applicant: $("buildingApplicant").value.trim(),
        address: $("buildingAddress").value.trim(),
        projectType: $("buildingType").value
    });
}

function handleTradeApplication(event) {
    submitApplication(event, "Trade Licence", {
        businessName: $("businessName").value.trim(),
        applicant: $("tradeApplicant").value.trim(),
        address: $("tradeAddress").value.trim()
    });
}

/* =========================================================
   18. PROPERTY TAX DEMONSTRATION
   ========================================================= */

function handlePropertyLookup(event) {
    event.preventDefault();

    if (!requireLogin()) return;

    const id = $("propertyId").value.trim();

    if (!id) {
        showMessage("Please enter your Property ID.", "error");
        $("propertyId").focus();
        return;
    }

    $("propertyResult").innerHTML = `
        <div class="result-card">
            <h3>Property Lookup Demonstration</h3>

            <p>Property ID: ${escapeHTML(id)}</p>

            <p>This demo does not connect to AMC property records.</p>

            <p>No actual tax amount or payment status is retrieved.</p>

            <span class="status pending">Demo only</span>
        </div>
    `;
}

/* =========================================================
   19. WATER BILL DEMONSTRATION
   ========================================================= */

function handleWaterLookup(event) {
    event.preventDefault();

    if (!requireLogin()) return;

    const id = $("consumerId").value.trim();

    if (!id) {
        showMessage("Please enter your Consumer Number.", "error");
        $("consumerId").focus();
        return;
    }

    $("waterResult").innerHTML = `
        <div class="result-card">
            <h3>Water Bill Lookup Demonstration</h3>

            <p>Consumer Number: ${escapeHTML(id)}</p>

            <p>Live AMC water billing data is not connected.</p>

            <p>No actual payment has been made.</p>

            <span class="status pending">Demo only</span>
        </div>
    `;
}

/* =========================================================
   20. ADMIN DASHBOARD
   ========================================================= */


async function renderAdminDashboard() {
    const user = getCurrentUser();

    if (!user || user.role !== "admin") return;

    const firebaseUser = auth.currentUser;

    if (!firebaseUser || firebaseUser.uid !== "2s7Fo6QyS8dCv2mbtD5SgzBfFi23") {
        showMessage("Admin authentication required.", "error");
        return;
    }

    try {
        const [complaintsSnapshot, applicationsSnapshot, feedbackSnapshot] =
            await Promise.all([
                db.collection("complaints").get(),
                db.collection("applications").get(),
                db.collection("feedback").get()
            ]);

        const complaints = complaintsSnapshot.docs.map(doc => ({
            ...doc.data(),
            firestoreId: doc.id
        }));

        const applications = applicationsSnapshot.docs.map(doc => ({
            ...doc.data(),
            firestoreId: doc.id
        }));

        const feedback = feedbackSnapshot.docs.map(doc => ({
            ...doc.data(),
            firestoreId: doc.id
        }));

        if ($("adminTotal")) {
            $("adminTotal").textContent = complaints.length;
        }

        if ($("adminPending")) {
            $("adminPending").textContent =
                complaints.filter(item => item.status !== "Resolved").length;
        }

        if ($("adminResolved")) {
            $("adminResolved").textContent =
                complaints.filter(item => item.status === "Resolved").length;
        }

        renderAdminComplaints(complaints);
        renderAdminApplications(applications);
        renderAdminFeedback(feedback);

    } catch (error) {
        showMessage("Unable to load admin data: " + error.message, "error");
    }
}

/* =========================================================
   21. ADMIN COMPLAINT MANAGEMENT
   ========================================================= */

function renderAdminComplaints(complaints) {
    const container = $("adminComplaints");

    if (!container) return;

    if (!complaints.length) {
        container.innerHTML = "<p>No complaints submitted yet.</p>";
        return;
    }

    const departments = [
        "Solid Waste Management",
        "Roads and Engineering",
        "Water Supply Department",
        "Electrical Department",
        "Drainage Department",
        "Public Health Department",
        "Municipal Review Required"
    ];

    container.innerHTML = complaints.slice().reverse().map(item => `
        <div class="admin-item">

            <h3>${escapeHTML(item.title)}</h3>

            <p><strong>ID:</strong> ${escapeHTML(item.id)}</p>

            <p><strong>Citizen:</strong> ${escapeHTML(item.citizenName)}</p>

            <p><strong>Category:</strong> ${escapeHTML(item.category)}</p>

            <p><strong>Description:</strong> ${escapeHTML(item.description)}</p>

            <p><strong>Location:</strong> ${escapeHTML(item.location)}</p>

            <p><strong>AI priority suggestion:</strong> ${escapeHTML(item.priority)}</p>

            <p><strong>Current department:</strong> ${escapeHTML(item.department)}</p>

            <p><strong>Status:</strong> ${escapeHTML(item.status)}</p>

            ${item.image
            ? `
                        <img src="${item.image}"
                            alt="Complaint evidence"
                            style="max-width:150px;max-height:110px;object-fit:cover;border-radius:8px">
                    `
            : ""
        }

            <label>Assign Department</label>

            <select id="dept-${escapeHTML(item.id)}">
                ${departments.map(department => `
                    <option value="${escapeHTML(department)}"
                        ${item.department === department ? "selected" : ""}>
                        ${escapeHTML(department)}
                    </option>
                `).join("")}
            </select>

            <label>Update Status</label>

            <select id="status-${escapeHTML(item.id)}">
                ${[
            "Submitted",
            "Assigned",
            "In Progress",
            "Resolved"
        ].map(status => `
                    <option value="${status}"
                        ${item.status === status ? "selected" : ""}>
                        ${status}
                    </option>
                `).join("")}
            </select>

            <label>Admin Note</label>

            <input id="note-${escapeHTML(item.id)}"
                value="${escapeHTML(item.adminNote)}"
                placeholder="Enter update for citizen">

            <button class="btn-primary"
                onclick="updateComplaint('${escapeHTML(item.id)}')">
                Save Changes
            </button>

        </div>
    `).join("");
}


async function updateComplaint(id) {
    const user = getCurrentUser();

    if (!user || user.role !== "admin") {
        showMessage("Administrator access required.", "error");
        return;
    }

    const firebaseUser = auth.currentUser;

    if (!firebaseUser || firebaseUser.uid !== "2s7Fo6QyS8dCv2mbtD5SgzBfFi23") {
        showMessage("Admin authentication required.", "error");
        return;
    }

    const departmentField = $("dept-" + id);
    const statusField = $("status-" + id);
    const noteField = $("note-" + id);

    if (!departmentField || !statusField || !noteField) return;

    const updatedData = {
        department: departmentField.value,
        status: statusField.value,
        adminNote: noteField.value.trim(),
        updatedAt: new Date().toISOString()
    };

    try {
        const snapshot = await db.collection("complaints")
            .where("id", "==", id)
            .get();

        if (snapshot.empty) {
            showMessage("Complaint not found in Firestore.", "error");
            return;
        }

        const batch = db.batch();

        snapshot.docs.forEach(doc => {
            batch.update(doc.ref, updatedData);
        });

        await batch.commit();

        const complaints = getComplaints();
        const index = complaints.findIndex(item => item.id === id);

        if (index >= 0) {
            Object.assign(complaints[index], updatedData);
            saveData(STORAGE.complaints, complaints);
        }

        showMessage("Complaint successfully updated.");

        await renderAdminDashboard();

    } catch (error) {
        showMessage("Complaint update failed: " + error.message, "error");
    }
}




/* =========================================================
   22. ADMIN APPLICATION MANAGEMENT
   ========================================================= */





async function renderCitizenDashboard() {
    const user = getCurrentUser();

    if (!user || user.role !== "citizen") return;

    const firebaseUser = auth.currentUser;

    if (!firebaseUser || firebaseUser.uid !== user.id) {
        showMessage("Please log in again.", "error");
        return;
    }

    if ($("citizenName")) {
        $("citizenName").textContent = user.name;
    }

    try {
        const snapshot = await db.collection("complaints")
            .where("userId", "==", firebaseUser.uid)
            .get();

        const complaints = snapshot.docs.map(doc => doc.data());

        const pending = complaints.filter(item =>
            item.status !== "Resolved"
        );

        const resolved = complaints.filter(item =>
            item.status === "Resolved"
        );

        if ($("myComplaintCount")) {
            $("myComplaintCount").textContent = complaints.length;
        }

        if ($("pendingCount")) {
            $("pendingCount").textContent = pending.length;
        }

        if ($("resolvedCount")) {
            $("resolvedCount").textContent = resolved.length;
        }

        if (!$("citizenRequests")) return;

        $("citizenRequests").innerHTML = complaints.length
            ? complaints.slice().reverse().map(item => `
                <div class="request-card">
                    <h3>${escapeHTML(item.title)}</h3>

                    <p>Reference: ${escapeHTML(item.id)}</p>

                    <p>Category: ${escapeHTML(item.category)}</p>

                    <p>
                        Status:
                        <span class="status ${statusClass(item.status)}">
                            ${escapeHTML(item.status)}
                        </span>
                    </p>

                    <button class="btn-outline"
                        onclick="openTracking('${escapeHTML(item.id)}')">
                        View Details
                    </button>
                </div>
            `).join("")
            : "<p>No complaints submitted yet.</p>";

    } catch (error) {
        showMessage("Unable to load your complaints: " + error.message, "error");
    }
}


async function updateApplication(id) {
    const user = getCurrentUser();

    if (!user || user.role !== "admin") {
        showMessage("Administrator access required.", "error");
        return;
    }

    const firebaseUser = auth.currentUser;

    if (!firebaseUser || firebaseUser.uid !== "2s7Fo6QyS8dCv2mbtD5SgzBfFi23") {
        showMessage("Admin authentication required.", "error");
        return;
    }

    const statusField = $("app-status-" + id);
    const departmentField = $("app-dept-" + id);
    const noteField = $("app-note-" + id);

    if (!statusField || !departmentField || !noteField) return;

    const updatedData = {
        status: statusField.value,
        department: departmentField.value.trim(),
        adminNote: noteField.value.trim(),
        updatedAt: new Date().toISOString()
    };

    try {
        const snapshot = await db.collection("applications")
            .where("id", "==", id)
            .get();

        if (snapshot.empty) {
            showMessage("Application not found in Firestore.", "error");
            return;
        }

        const batch = db.batch();

        snapshot.docs.forEach(doc => {
            batch.update(doc.ref, updatedData);
        });

        await batch.commit();

        const applications = getApplications();
        const index = applications.findIndex(item => item.id === id);

        if (index >= 0) {
            Object.assign(applications[index], updatedData);
            saveData(STORAGE.applications, applications);
        }

        showMessage("Application updated successfully.");

        await renderAdminDashboard();

    } catch (error) {
        showMessage("Application update failed: " + error.message, "error");
    }
}

/* =========================================================
   23. ADMIN FEEDBACK MANAGEMENT
   ========================================================= */

function renderAdminApplications(applications) {
    const container = $("adminApplications");

    if (!container) return;

    if (!applications.length) {
        container.innerHTML = "<p>No applications submitted yet.</p>";
        return;
    }

    const statuses = [
        "Submitted",
        "Under Review",
        "In Progress",
        "Approved",
        "Rejected",
        "Resolved"
    ];

    container.innerHTML = applications.slice().reverse().map(item => {
        const applicationData = Object.entries(item.data || {})
            .map(([key, value]) => {
                const label = key
                    .replace(/([A-Z])/g, " $1")
                    .replace(/^./, char => char.toUpperCase());

                const displayValue = typeof value === "object"
                    ? JSON.stringify(value)
                    : value;

                return `
                    <p>
                        <strong>${escapeHTML(label)}:</strong>
                        ${escapeHTML(displayValue)}
                    </p>
                `;
            }).join("");

        const availableStatuses = [...new Set([
            ...statuses,
            item.status
        ])];

        return `
            <div class="admin-item">

                <h3>${escapeHTML(item.type)}</h3>

                <p><strong>Application ID:</strong> ${escapeHTML(item.id)}</p>

                <p><strong>Citizen:</strong> ${escapeHTML(item.citizenName)}</p>

                <p><strong>Submitted:</strong> ${formatDate(item.createdAt)}</p>

                <h4>Application Details</h4>

                ${applicationData}

                <p><strong>Current Status:</strong> ${escapeHTML(item.status)}</p>

                <label>Update Status</label>

                <select id="app-status-${escapeHTML(item.id)}">
                    ${availableStatuses.map(status => `
                        <option value="${escapeHTML(status)}"
                            ${item.status === status ? "selected" : ""}>
                            ${escapeHTML(status)}
                        </option>
                    `).join("")}
                </select>

                <label>Assign Department</label>

                <input
                    id="app-dept-${escapeHTML(item.id)}"
                    value="${escapeHTML(item.department || "Awaiting Assignment")}"
                    placeholder="Enter department">

                <label>Admin Note</label>

                <input
                    id="app-note-${escapeHTML(item.id)}"
                    value="${escapeHTML(item.adminNote || "")}"
                    placeholder="Enter update for citizen">

                <button class="btn-primary"
                    onclick="updateApplication('${escapeHTML(item.id)}')">
                    Save Changes
                </button>

            </div>
        `;
    }).join("");
}



function renderAdminFeedback(feedback) {
    const container = $("adminFeedback");

    if (!container) return;

    if (!feedback.length) {
        container.innerHTML = "<p>No feedback received yet.</p>";
        return;
    }

    container.innerHTML = feedback.slice().reverse().map(item => `
        <div class="admin-item">

            <h3>${escapeHTML(item.citizenName)}</h3>

            <p><strong>Complaint:</strong> ${escapeHTML(item.complaintId)}</p>

            <p>
                <strong>Rating:</strong>
                ${"★".repeat(item.rating)}${"☆".repeat(5 - item.rating)}
            </p>

            <p>
                <strong>Feedback:</strong>
                ${escapeHTML(item.comment || "No comment")}
            </p>

            <p><strong>Date:</strong> ${formatDate(item.createdAt)}</p>

        </div>
    `).join("");
}

/* =========================================================
   24. APPLICATION LOOKUP HELPER
   ========================================================= */

function findApplication(id, user) {
    return getApplications().find(item =>
        String(item.id).toUpperCase() === String(id).toUpperCase() &&
        (user?.role === "admin" || item.userId === user?.id)
    );
}

/* =========================================================
   25. CHATBOT
   ========================================================= */

function toggleChat() {
    const panel = $("chatbotPanel");

    if (!panel) return;

    panel.classList.toggle("open");

    if ($("chatInput")) {
        $("chatInput").focus();
    }
}

function addChatMessage(message, type) {
    const container = $("chatMessages");

    if (!container) return;

    const div = document.createElement("div");

    div.className = type === "user"
        ? "user-message"
        : "bot-message";

    div.textContent = message;

    container.appendChild(div);

    container.scrollTop = container.scrollHeight;
}

function getBotResponse(message) {
    const text = message.toLowerCase();

    if (/hello|hi|hey|namaste/.test(text)) {
        return "Hello! Welcome to ONE AHMEDABAD. I can help with municipal services, complaints, tracking and applications.";
    }

    if (/complaint|report|garbage|pothole|road|leak|streetlight|drainage/.test(text)) {
        return "To report a civic issue, open Civic Complaints, enter the issue details, choose a category and submit your request. You will receive a unique reference ID.";
    }

    if (/track|status|reference|request/.test(text)) {
        return "Open Track Request and enter your complaint reference ID. You can view the latest status and any administrator update.";
    }

    if (/property|tax/.test(text)) {
        return "Open Property Tax Services and enter your property identification number. This demonstration does not retrieve live AMC property or tax records.";
    }

    if (/water|bill|consumer/.test(text)) {
        return "Open Water Services and enter your consumer number. Live billing and payment services are not connected in this demo.";
    }

    if (/birth|death|certificate/.test(text)) {
        return "Open Birth & Death Certificates, select your application type and enter the applicant details to submit a demonstration application.";
    }

    if (/building|permission/.test(text)) {
        return "Open Building Permission and complete the application form with your name, property address and project type.";
    }

    if (/trade|licence|license|business/.test(text)) {
        return "Open Trade Licence and enter your business name, applicant name and business address.";
    }

    if (/register|registration|account/.test(text)) {
        return "Select Register in the navigation bar, enter your name, email, mobile number and password, then create your citizen account.";
    }

    if (/login|sign in/.test(text)) {
        return "Select Login and use your registered email and password to access your citizen dashboard.";
    }

    if (/admin|administrator/.test(text)) {
        return "The demonstration administrator can use the Admin link in the footer to open the admin login page.";
    }

    if (/gujarati|ગુજરાતી/.test(text)) {
        return "નમસ્તે! ONE AHMEDABAD માં આપનું સ્વાગત છે. તમે નાગરિક ફરિયાદ નોંધાવી શકો છો અને તમારી અરજીની સ્થિતિ તપાસી શકો છો. આ ડેમો સહાયક છે.";
    }

    if (/hindi|हिंदी/.test(text)) {
        return "नमस्ते! ONE AHMEDABAD में आपका स्वागत है। आप नागरिक शिकायत दर्ज कर सकते हैं और अपने अनुरोध की स्थिति देख सकते हैं। यह एक डेमो सहायक है।";
    }

    if (/thank/.test(text)) {
        return "You're welcome! Thank you for helping make Ahmedabad smarter.";
    }

    return "I can help you with complaints, property tax, water bills, certificates, building permission, trade licences, registration and request tracking. What would you like to know?";
}

function sendQuickMessage(message) {
    if (!$("chatInput") || !$("chatForm")) return;

    $("chatInput").value = message;

    $("chatForm").requestSubmit();
}

function handleChatSubmit(event) {
    event.preventDefault();

    const input = $("chatInput");

    const message = input.value.trim();

    if (!message) return;

    addChatMessage(message, "user");

    input.value = "";

    setTimeout(() => {
        addChatMessage(getBotResponse(message), "bot");
    }, 350);
}

/* =========================================================
   26. EVENT LISTENERS
   ========================================================= */

function setupEventListeners() {

    // Registration
    addListener("registerForm", "submit", handleRegistration);

    // Citizen login
    addListener("loginForm", "submit", handleLogin);

    // Admin login
    addListener("adminLoginForm", "submit", handleAdminLogin);

    // Complaint form
    addListener("complaintForm", "submit", handleComplaintSubmission);

    // Complaint tracking
    addListener("trackForm", "submit", handleTracking);

    // Service application forms
    addListener("certificateForm", "submit", handleCertificateApplication);

    addListener("buildingForm", "submit", handleBuildingApplication);

    addListener("tradeForm", "submit", handleTradeApplication);

    // Property and water forms
    addListener("propertyForm", "submit", handlePropertyLookup);

    addListener("waterForm", "submit", handleWaterLookup);

    // AI complaint suggestions
    addListener("complaintTitle", "input", updateAISuggestion);

    addListener("complaintDescription", "input", updateAISuggestion);

    // Complaint photo preview
    addListener("complaintImage", "change", handleImagePreview);

    // Chatbot
    addListener("chatForm", "submit", handleChatSubmit);
}

/* =========================================================
   27. INITIALIZATION
   ========================================================= */

function initializeApp() {
    setupEventListeners();

    auth.onAuthStateChanged(async firebaseUser => {
        if (!firebaseUser) {
            setCurrentUser(null);
            updateNavigation();
            showPage("home");
            return;
        }

        try {
            // Check whether this is the administrator.
            if (firebaseUser.uid === "2s7Fo6QyS8dCv2mbtD5SgzBfFi23") {
                setCurrentUser({
                    id: firebaseUser.uid,
                    name: "System Administrator",
                    email: firebaseUser.email,
                    role: "admin"
                });

                updateNavigation();
                showPage("admin");
                return;
            }

            // Restore the citizen's profile from Firestore.
            const userDoc = await db.collection("users")
                .doc(firebaseUser.uid)
                .get();

            if (!userDoc.exists || userDoc.data().role !== "citizen") {
                await auth.signOut();
                return;
            }

            const userData = userDoc.data();

            setCurrentUser({
                id: firebaseUser.uid,
                name: userData.name,
                email: firebaseUser.email,
                phone: userData.phone,
                role: "citizen"
            });

            updateNavigation();
            showPage("dashboard");

        } catch (error) {
            console.error("Session restoration failed:", error);

            showMessage(
                "Unable to restore your session: " + error.message,
                "error"
            );

            await auth.signOut();
        }
    });

    console.log("ONE AHMEDABAD initialized successfully.");
}

// Make functions available to HTML onclick attributes
window.showPage = showPage;
window.toggleMenu = toggleMenu;
window.logout = logout;
window.getLocation = getLocation;
window.toggleChat = toggleChat;
window.sendQuickMessage = sendQuickMessage;
window.openTracking = openTracking;
window.submitFeedback = submitFeedback;
window.updateComplaint = updateComplaint;
window.updateApplication = updateApplication;

// Initialize safely whether the script loads before or after DOM parsing
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeApp);
} else {
    initializeApp();
}