import type { Config } from "tailwindcss";

const config: Config = {
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			background: "#0F172A",
  			primary: {
  				DEFAULT: "#3B82F6",
  				hover: "#2563EB",
  			},
  			secondary: {
  				DEFAULT: "#64748B",
  				hover: "#475569",
  			},
  			success: {
  				DEFAULT: "#22C55E",
  				hover: "#16A34A",
  			},
  			error: {
  				DEFAULT: "#EF4444",
  				hover: "#DC2626",
  			},
  			card: "#1E293B",
  			foreground: 'hsl(var(--foreground))',
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		typography: {
  			DEFAULT: {
  				css: {
  					color: "#D1D5DB",
  					a: {
  						color: "#3B82F6",
  						"&:hover": {
  							color: "#2563EB",
  						},
  					},
  					h1: {
  						color: "#F9FAFB",
  					},
  					h2: {
  						color: "#F3F4F6",
  					},
  					h3: {
  						color: "#E5E7EB",
  					},
  					strong: {
  						color: "#F9FAFB",
  					},
  					code: {
  						color: "#E5E7EB",
  					},
  					blockquote: {
  						color: "#9CA3AF",
  					},
  				}
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [
    require("@tailwindcss/typography"),
    require("tailwindcss-animate")
  ],
};

export default config;
