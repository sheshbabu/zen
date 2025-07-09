General:
* Don't add unnecessary comments
* Keep the code as simple as possible
* Use the tools already present in the repo
* Use descriptive variable names
* Use consistent formatting
* Avoid using complex language features unless necessary
* Write code that is easy to read and understand
* Use standard libraries and functions when available
* Avoid using external libraries unless necessary

Preact/React:
* Don't add logic inside components. Extract them to separate if-else conditions.
* Don't add loops using map inside components. Extract them to separate variables outside JSX.
* Don't use ternary operators inside JSX. Use if-else conditions instead.
* For boolean props, use `is` prefix (e.g., `isActive`, `isLoading`) or `has`, `can`, `should` prefixes for other boolean checks
* Refer to index.css for styling