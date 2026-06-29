export default function Navbar() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-5 shadow-sm">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">StudyFlow AI</h1>
        <p className="text-xs text-slate-500">
          Intelligent study-note generation
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-slate-800">Student</p>
          <p className="text-xs text-slate-500">Free account</p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700">
          S
        </div>
      </div>
    </header>
  );
}