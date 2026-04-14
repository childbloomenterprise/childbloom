// Joins class names, filtering out falsy values.
// Handles: cn("a", "b"), cn("a", condition ? "b" : "c"), cn("a", false, "b")
export function cn(...inputs) {
  return inputs
    .filter(x => typeof x === 'string' && x.length > 0)
    .join(' ');
}
