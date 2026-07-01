import { NavLink } from "react-router";

const navigationItems = [
  {
    path: "/",
    label: "Dashboard",
    end: true,
  },
  {
    path: "/generate",
    label: "Generate Notes",
    end: false,
  },
  {
    path: "/notes",
    label: "My Notes",
    end: false,
  },
];

export default function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
      <div className="border-b border-slate-200 px-6 py-6">
        <p className="text-xl font-bold text-indigo-700">
          StudyFlow AI
        </p>

        <p className="mt-1 text-xs text-slate-500">
          Intelligent study assistant
        </p>
      </div>

      <nav className="flex-1 space-y-2 p-4">
        {navigationItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) =>
              [
                "block rounded-lg px-4 py-3 text-sm font-medium transition",
                isActive
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              ].join(" ")
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-200 p-5">
        <p className="text-xs text-slate-400">
          StudyFlow AI student workspace
        </p>
      </div>
    </aside>
  );
}