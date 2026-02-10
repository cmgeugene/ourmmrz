/** @type {import('tailwindcss').Config} */
module.exports = {
    // NOTE: NativeWind uses `content` to specify which files to watch for utility classes.
    content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {},
    },
    plugins: [],
}
