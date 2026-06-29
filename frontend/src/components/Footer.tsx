export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white px-6 py-4 text-center text-sm text-slate-500">
      © {new Date().getFullYear()} StudyFlow AI. Built for smarter learning.
    </footer>
  );
}