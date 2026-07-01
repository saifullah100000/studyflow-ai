import { NavLink, Outlet } from "react-router";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-100">
      <Sidebar />

      <div className="lg:pl-64">
        <Navbar />

        <nav className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive
                ? "whitespace-nowrap rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white"
                : "whitespace-nowrap rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600"
            }
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/generate"
            className={({ isActive }) =>
              isActive
                ? "whitespace-nowrap rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white"
                : "whitespace-nowrap rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600"
            }
          >
            Generate
          </NavLink>

          <NavLink
            to="/notes"
            className={({ isActive }) =>
              isActive
                ? "whitespace-nowrap rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white"
                : "whitespace-nowrap rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600"
            }
          >
            Notes
          </NavLink>
        </nav>

        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}