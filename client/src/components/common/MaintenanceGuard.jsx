import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getUser } from "../../utils/auth";

export default function MaintenanceGuard({ children }) {
    const location = useLocation();
    const navigate = useNavigate();
    const [maintenanceInfo, setMaintenanceInfo] = useState(null);

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const res = await fetch("/api/maintenance/status");
                const json = await res.json();

                if (json.success && json.data?.enabled) {
                    setMaintenanceInfo(json.data);
                    const user = getUser();
                    const isAdmin = user && user.role === "admin";
                    const isLoginPage = location.pathname === "/login";
                    const isMaintenancePage = location.pathname === "/maintenance";

                    // 1. Logged in Admin: ALLOW COMPLETELY across all pages!
                    if (isAdmin) {
                        return;
                    }

                    // 2. Allow access to /login page so users can attempt admin login
                    if (isLoginPage) {
                        return;
                    }

                    // 3. For any non-admin user or visitor, redirect to /maintenance page
                    if (!isMaintenancePage) {
                        navigate("/maintenance", { state: { maintenanceInfo: json.data }, replace: true });
                    }
                }
            } catch (err) {
                console.error("Failed to check maintenance status:", err);
            }
        };

        checkStatus();
        const interval = setInterval(checkStatus, 15000); // Poll every 15s
        return () => clearInterval(interval);
    }, [location.pathname, navigate]);

    return children;
}
