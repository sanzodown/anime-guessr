export function Logo() {
    return (
        <div className="flex items-center gap-4">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-16 h-16">
                <path d="M16 2L4 9V23L16 30L28 23V9L16 2Z" fill="#9333EA" stroke="#9333EA" strokeWidth="2" strokeLinejoin="round" />
                <path d="M16 2L28 9L16 16L4 9L16 2Z" fill="#A855F7" stroke="#A855F7" strokeWidth="2" strokeLinejoin="round" />
            </svg>
            <span className="text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-purple-400">
                aniclip.in
            </span>
        </div>
    );
}
