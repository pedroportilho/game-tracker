/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
      },
    },
  },
  plugins: [],
  safelist: [
    'bg-emerald-900/40', 'text-emerald-400', 'border-emerald-700/30',
    'bg-red-900/40',     'text-red-400',     'border-red-700/30',
    'bg-blue-900/40',    'text-blue-400',    'border-blue-700/30',
    'bg-red-900/30',     'text-red-300',     'border-red-700/20',
    'bg-zinc-800',       'text-zinc-400',    'border-zinc-700/30',
    'bg-amber-900/40',   'text-amber-400',   'border-amber-700/30',
  ],
}
