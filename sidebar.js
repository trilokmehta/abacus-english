document.addEventListener("DOMContentLoaded", function () {
  // 1. INJECT CSS STYLES
  const style = document.createElement("style");
  style.innerHTML = `
        :root {
            --brand-orange: #ff6b00;
            --brand-dark: #e65100;
            --sidebar-width: 250px;
            --bg-color: #f4f6f8;
        }

        /* RESET & LAYOUT */
        body {
            background-color: var(--bg-color);
            margin: 0;
            padding-left: var(--sidebar-width); /* Push content for desktop */
            font-family: 'Segoe UI', sans-serif;
            transition: padding-left 0.3s;
        }

        /* SIDEBAR CONTAINER */
        .sidebar {
            height: 100vh;
            width: var(--sidebar-width);
            position: fixed;
            top: 0;
            left: 0;
            background-color: white;
            box-shadow: 2px 0 10px rgba(0,0,0,0.05);
            display: flex;
            flex-direction: column;
            z-index: 1000;
            transition: transform 0.3s ease-in-out;
        }

        /* LOGO AREA */
        .sidebar-header {
            padding: 20px;
            border-bottom: 1px solid #eee;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .brand {
            color: var(--brand-orange);
            font-size: 1.4rem;
            font-weight: 800;
            text-transform: uppercase;
            text-decoration: none;
        }

        /* NAVIGATION LINKS */
        .nav-links {
            list-style: none;
            padding: 20px 0;
            margin: 0;
            flex-grow: 1;
        }
        
        .nav-item {
            display: block;
            padding: 12px 25px;
            color: #555;
            text-decoration: none;
            font-weight: 600;
            font-size: 1rem;
            transition: 0.2s;
            border-left: 4px solid transparent;
            cursor: pointer;
        }

        .nav-item:hover {
            background-color: #fff0e0;
            color: var(--brand-orange);
        }

        .nav-item.active {
            background-color: #fff0e0;
            color: var(--brand-orange);
            border-left-color: var(--brand-orange);
        }

        /* LOGOUT BUTTON */
        .logout-container {
            padding: 20px;
            border-top: 1px solid #eee;
        }
        .btn-logout {
            width: 100%;
            padding: 10px;
            background: transparent;
            border: 1px solid #ddd;
            color: #666;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
            transition: 0.2s;
        }
        .btn-logout:hover {
            background: #ffebee;
            color: #d32f2f;
            border-color: #d32f2f;
        }

        /* MOBILE HEADER (Visible only on small screens) */
        .mobile-header {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 60px;
            background: white;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            align-items: center;
            justify-content: space-between;
            padding: 0 20px;
            z-index: 1001;
        }
        .hamburger {
            font-size: 1.8rem;
            cursor: pointer;
            color: #333;
        }

        /* RESPONSIVE LOGIC */
        @media (max-width: 768px) {
            body {
                padding-left: 0;
                padding-top: 60px; /* Space for mobile header */
            }
            .sidebar {
                transform: translateX(-100%); /* Hide sidebar by default */
            }
            .sidebar.open {
                transform: translateX(0); /* Slide in */
            }
            .mobile-header {
                display: flex;
            }
            /* Overlay when sidebar is open */
            .overlay {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                z-index: 999;
            }
            .overlay.active {
                display: block;
            }
        }
    `;
  document.head.appendChild(style);

  // 2. DEFINE THE HTML
  const sidebarHTML = `
        <div class="mobile-header">
            <a href="#" class="brand">Brainiac</a>
            <div class="hamburger" onclick="toggleSidebar()">☰</div>
        </div>

        <div class="overlay" id="sidebar-overlay" onclick="toggleSidebar()"></div>

        <div class="sidebar" id="main-sidebar">
            <div class="sidebar-header">
                <a href="admin-dashboard.html" class="brand">Brainiac Gym</a>
                <span class="hamburger" style="font-size:1.2rem; display:none;" onclick="toggleSidebar()">✕</span>
            </div>

            <nav class="nav-links">
                <a href="admin-dashboard.html" class="nav-item" id="link-dashboard">Report</a>
                <a href="admin-students.html" class="nav-item" id="link-students"> Students List</a>
                <a href="admin-operations.html" class="nav-item" id="link-operations"> Operations</a>
                <a href="admin-settings.html" class="nav-item" id="link-settings">Settings</a>
            </nav>

            <div class="logout-container">
                <button class="btn-logout" onclick="globalLogout()"> Logout</button>
            </div>
        </div>
    `;

  // 3. INJECT HTML INTO BODY
  document.body.insertAdjacentHTML("afterbegin", sidebarHTML);

  // 4. HIGHLIGHT ACTIVE LINK
  const currentPage = window.location.pathname.split("/").pop();
  if (currentPage.includes("dashboard"))
    document.getElementById("link-dashboard").classList.add("active");
  else if (currentPage.includes("students") || currentPage.includes("detail"))
    document.getElementById("link-students").classList.add("active");
  else if (currentPage.includes("operations"))
    document.getElementById("link-operations").classList.add("active");
  else if (currentPage.includes("settings"))
    document.getElementById("link-settings").classList.add("active");
});

// 5. GLOBAL FUNCTIONS (Accessible by HTML)
function toggleSidebar() {
  const sidebar = document.getElementById("main-sidebar");
  const overlay = document.getElementById("sidebar-overlay");
  sidebar.classList.toggle("open");
  overlay.classList.toggle("active");
}

async function globalLogout() {
  // Assumes supabaseClient is defined in the main page script
  if (typeof supabaseClient !== "undefined") {
    await supabaseClient.auth.signOut();
    window.location.href = "index.html";
  } else {
    // Fallback if client variable name is different
    window.location.href = "index.html";
  }
}
