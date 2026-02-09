/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
    theme: {
        extend: {
            colors: {
                primary: "#f4256a",
            },
            fontFamily: {
                sans: ["System"],
            }
        },
    },
    plugins: [],
}
