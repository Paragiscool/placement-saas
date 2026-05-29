import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="w-full bg-[#0B0F19] border-b border-gray-800 p-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Brand Logo / Name */}
        <Link href="/dashboard" className="text-white font-bold text-xl tracking-wide">
          Placement<span className="text-blue-500">IQ</span>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-6">
          <Link 
            href="/dashboard" 
            className="text-gray-400 hover:text-white transition-colors text-sm font-medium"
          >
            Dashboard
          </Link>
          <Link 
            href="/profile" 
            className="text-gray-400 hover:text-white transition-colors text-sm font-medium"
          >
            Profile
          </Link>
          
          {/* Example of a highlighted action button */}
          <Link 
            href="/interview" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Start Mock Interview
          </Link>
        </div>
      </div>
    </nav>
  );
}
