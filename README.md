# ComplianceAI Agent

## Overview

ComplianceAI Agent is an intelligent compliance automation tool designed to assist organizations in achieving and maintaining compliance with cybersecurity recommendations, regulations, and security standards. The system automates compliance monitoring, risk assessment, policy enforcement, and reporting with a focus on affordability and accessibility for SaaS startups and SMEs, while remaining scalable for larger organizations.

## Table of Contents

- [Repository Structure](#repository-structure)
- [Submodules Overview](#submodules-overview)
- [Prerequisites](#prerequisites)
- [Usage Instructions](#usage-instructions)
- [Contribution Guidelines](#contribution-guidelines)
- [License](#license)
- [Troubleshooting](#troubleshooting)

## Repository Structure

The repository is organized as follows:

- `/complianceUI/` - Frontend interface for the ComplianceAI Agent
  - Contains HTML, CSS, and JavaScript files for the web interface
  - Implements setup wizard, dashboard, reports, and compliance monitoring screens
- `/app/` - ComplianceAI Agent Core compliance analysis engine
- `/app/tools/` - Tools to be used by ComplianceAI Agent 
- `/norms/` - Compliance frameworks and templates (submodule)

Submodules are separate Git repositories embedded within this project, allowing for modular development and maintenance of specialized components.

## Submodules Overview

### Uncompliant AWS Infrastructure
- **Path**: `/uncompliant_aws_infra`
- **Purpose**: A misconfigured AWS infrastructure used to test our ComplianceAI Agent
- **Repository URL**: `https://github.com/AsriMed/uncompliant_aws_infra.git`
- **Version**: v0.0.1

Note that submodules are initialized as read-only links to specific commits in their respective repositories. They require explicit cloning and initialization as detailed in the Usage Instructions.

## Prerequisites

Before you can run the ComplianceAI Agent, you'll need to install the following dependencies:

### uv - Python Package Installer

`uv` is a required tool for managing the project's Python dependencies. It's a fast, reliable Python package installer and resolver that replaces pip.

#### Installing uv

Install uv globally using pip:

```bash
pip install uv
```

Or using curl (recommended for production environments):

```bash
curl -sSf https://install.python-uv.org | python3
```

Learn more about uv at [https://github.com/astral-sh/uv](https://github.com/astral-sh/uv).

### Other Requirements

- Python 3.9+ 
- Git

## Usage Instructions

### Cloning the Repository with Submodules

To clone the repository along with all submodules:

```bash
git clone --recurse-submodules https://github.com/shetsecure/ComplianceAI-Agent.git
cd ComplianceAI-Agent
```

### Initializing Submodules After Cloning

If you've already cloned the repository without `--recurse-submodules`:

```bash
git submodule init
git submodule update
```

### Installing Dependencies with uv

Before running the application, you need to install the required dependencies using uv:

```bash
# Launch uv init
uv init

# Start uv sync, it will install everything for you (quickly, so quickly)
uv sync
```

### Updating All Submodules to Latest Versions

```bash
git submodule update --remote
```

### Running the Application Locally

1. Start a local server using uvicorn:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

2. Navigate to `http://localhost:8000` in your browser

3. Ta-da! You deployed the app.



## Contribution Guidelines

### Contributing to the Main Repository

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Submit a pull request

### Contributing to Submodules

When you need to modify submodule content:

1. Fork the specific submodule repository
2. Make changes in your fork
3. Submit pull requests to the upstream submodule repository
4. Once accepted, update the submodule reference in the main repository

### Updating Specific Submodule

```bash
cd <submodule-path>
git checkout main
git pull
cd ..
git add <submodule-path>
git commit -m "Updated submodule to latest version"
```

**Important**: Do not commit changes directly to submodules within the main repository. Always contribute to the original submodule repositories.

### Collaboration Tools

- Issue tracking: GitHub Issues
- Documentation: Markdown files in the `/docs` directory
- Communication: Developer discussions in GitHub Discussions

## License

The main repository is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

Each submodule may have its own license.
Please refer to each submodule's license file for specific terms.

## Troubleshooting

### Submodule Updates Not Reflecting

If updated submodules don't reflect in the main repository:

```bash
git submodule update --remote --merge
git add .
git commit -m "Update submodules to latest versions"
```

### Missing Submodule Content

If submodule directories are empty after cloning:

```bash
git submodule update --init --recursive
```

### Conflicts When Updating Submodules

If you encounter conflicts when updating submodules:

1. Navigate to the submodule directory
2. Resolve conflicts manually
3. Commit changes
4. Return to main repository and commit the updated submodule reference

### Common uv Issues

#### Command Not Found

If you encounter a "command not found" error when trying to use uv:

```bash
# Ensure uv is in your PATH
export PATH="$HOME/.cargo/bin:$PATH"

# Or reinstall uv
curl -sSf https://install.python-uv.org | python3
```

#### Dependency Resolution Errors

If uv encounters dependency resolution errors:

```bash
# Try with more verbose output
uv pip install -r requirements.txt --verbose

# Or try installing dependencies one by one
uv pip install <problematic-package>
```

For additional issues, please check the GitHub Issues page or contact the maintainers.
