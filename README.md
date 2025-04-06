# ComplianceAI Agent

## Overview

ComplianceAI Agent is an intelligent compliance automation tool designed to assist organizations in achieving and maintaining compliance with cybersecurity recommendations, regulations, and security standards. The system automates compliance monitoring, risk assessment, policy enforcement, and reporting with a focus on affordability and accessibility for SaaS startups and SMEs, while remaining scalable for larger organizations.

## Table of Contents

- [Repository Structure](#repository-structure)
- [Submodules Overview](#submodules-overview)
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

### Core Engine (core)
- **Path**: `/core`
- **Purpose**: Provides the AI-powered compliance analysis engine
- **Repository URL**: `https://github.com/shetsecure/core-engine.git`
- **Version**: v2.1.0

### Connectors (connectors)
- **Path**: `/connectors`
- **Purpose**: Contains integration adapters for AWS, Jira, and other services
- **Repository URL**: `https://github.com/shetsecure/connectors.git`
- **Version**: v1.3.2

### Compliance Templates (compliance-templates)
- **Path**: `/compliance-templates`
- **Purpose**: Contains template definitions for various compliance frameworks (GDPR, NIS2, ISO27001, etc.)
- **Repository URL**: `https://github.com/shetsecure/compliance-templates.git`
- **Version**: v1.5.0

Note that submodules are initialized as read-only links to specific commits in their respective repositories. They require explicit cloning and initialization as detailed in the Usage Instructions.

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

### Updating All Submodules to Latest Versions

```bash
git submodule update --remote
```

### Updating Specific Submodule

```bash
cd <submodule-path>
git checkout main
git pull
cd ..
git add <submodule-path>
git commit -m "Updated submodule to latest version"
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

**Important**: Do not commit changes directly to submodules within the main repository. Always contribute to the original submodule repositories.

### Collaboration Tools

- Issue tracking: GitHub Issues
- Documentation: Markdown files in the `/docs` directory
- Communication: Developer discussions in GitHub Discussions

## License

The main repository is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

Each submodule may have its own license:

- Core Engine: MIT License
- Connectors: Apache 2.0 License
- Compliance Templates: Creative Commons BY-SA 4.0

Please refer to each submodule's license file for specific terms.

## Troubleshooting

### Detached HEAD State in Submodules

Submodules typically checkout a specific commit, resulting in a "detached HEAD" state. This is expected behavior. If you need to make changes:

```bash
cd <submodule-path>
git checkout -b my-feature-branch
# Make changes, commit, and push to your fork
# Then follow contribution guidelines
```

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

For additional issues, please check the GitHub Issues page or contact the maintainers.
