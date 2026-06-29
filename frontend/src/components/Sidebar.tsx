import { NavLink } from "react-router";

const navigationItems = [
  {
    name: "Dashboard",
    path: "/",
    icon: "⌂",
  },
  {
    name: "Generate Notes",
    path: "/generate",
    icon: "✦",
  },
  {
    name: "My Notes",
    path: "/notes",
    icon: "▤",
  },
];

export default function Sidebar() {
  return (
    <aside className="w-full border-b border-slate-800 bg-slate-950 px-4 py-4 text-white md:min-h-screen md:w-64 md:border-r md:border-b-0">
      <div className="mb-7 px-3">
        <p className="text-xl font-bold">StudyFlow</p>
        <p className="text-xs text-slate-400">AI Learning Platform</p>
      </div>

      <nav className="flex gap-2 overflow-x-auto md:flex-col">
        {navigationItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }) =>
              [
                "flex min-w-max items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition",
                isActive
                  ? "bg-indigo-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white",
              ].join(" ")
            }
          >
            <span aria-hidden="true">{item.icon}</span>
            {item.name}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}