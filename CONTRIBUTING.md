# Contributing to Seiri

First off, thank you for considering contributing to Seiri! It's people like you that make open source such a great community to learn, inspire, and create.

## Where to Start?

If you are looking for a good issue to start with, please check the following:
- Issues labeled `good first issue` or `help wanted` are a great place to start.
- If you find a bug, please create a new issue using the **Bug Report** template.
- If you have an idea for a new feature, please create a new issue using the **Feature Request** template.

## Local Development Setup

To get your local environment set up, please follow the instructions in the [README.md](README.md#for-developers).

1. Clone the repository.
2. Run `npm install` to install dependencies.
3. Run `npm run dev` to start the Vite dev server for local UI development.
4. Run `npm run build` to build the compiled extension into the `seiri-extension` folder.

## How to Submit a Pull Request

1. **Fork the repository** to your own GitHub account and clone it to your local machine.
2. **Create a new branch** for your feature or bugfix:
   ```bash
   git checkout -b feature/my-awesome-feature
   ```
   *or*
   ```bash
   git checkout -b fix/my-bugfix
   ```
3. **Make your changes** and commit them with clear, descriptive commit messages.
4. **Push your branch** to your fork:
   ```bash
   git push origin feature/my-awesome-feature
   ```
5. **Open a Pull Request** against the `main` branch of the original repository. Please fill out the Pull Request template completely so that your changes are easy to review.

## Code Style & Conventions

- We use **React** and **Tailwind CSS**. Try to follow the established conventions in the existing codebase.
- Avoid introducing unnecessary external dependencies unless discussed in an issue first.
- Ensure your code doesn't introduce console errors.

## Code of Conduct

Please note that this project is released with a [Contributor Code of Conduct](CODE_OF_CONDUCT.md). By participating in this project you agree to abide by its terms.

Thank you for contributing!
