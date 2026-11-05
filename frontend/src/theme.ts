import { createTheme, type MantineColorsTuple } from '@mantine/core'

// Mediterranean deep water, light to dark. Index 7 is the brand blue (#0E4C6E).
const sea: MantineColorsTuple = [
  '#e8f4f8',
  '#cfe5ee',
  '#a0cadc',
  '#6daeca',
  '#4496ba',
  '#2a86b0',
  '#1a6a90',
  '#0e4c6e',
  '#0a3c58',
  '#062b40',
]

export const theme = createTheme({
  primaryColor: 'sea',
  primaryShade: 7,
  colors: { sea },
  fontFamily: 'Figtree, system-ui, sans-serif',
  headings: {
    fontFamily: '"Bricolage Grotesque", Figtree, sans-serif',
    fontWeight: '800',
  },
  defaultRadius: 'md',
})
