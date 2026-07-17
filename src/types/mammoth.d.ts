// Minimal module declaration so TypeScript is happy with the lazy
// `import("mammoth")` used to read Word (.docx) files in the browser.
// mammoth is only loaded on demand when a business uploads a .docx file.
declare module "mammoth";
