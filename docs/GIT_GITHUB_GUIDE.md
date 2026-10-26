# Git and GitHub Version Control Manual (B.Tech CSE Lab CO1)

This comprehensive guide covers version control concepts, repository initialization, branching strategies, merge workflows, and GitHub synchronization for the **Smart Citizen Complaint Management Portal**.

---

## 1. Core Git Architecture

```
+-------------------+        git add        +-------------------+       git commit       +-------------------+
| Working Directory | --------------------> |   Staging Area    | ---------------------> | Local Repository  |
|  (Modified Files) |                       |      (Index)      |                        |      (.git/)      |
+-------------------+                       +-------------------+                        +-------------------+
          |                                                                                        |
          |                                  git push / git pull                                   |
          +----------------------------------------------------------------------------------------+
                                                     |
                                                     v
                                           +-------------------+
                                           | Remote Repository |
                                           |     (GitHub)      |
                                           +-------------------+
```

---

## 2. Essential Git Command Reference

| Command | Action / Explanation |
|---|---|
| `git init` | Initializes a new local Git repository in the current directory (`.git/`). |
| `git status` | Displays working tree status, staged files, unstaged modifications, and untracked files. |
| `git add <file>` | Adds specific file to staging area. |
| `git add .` | Stages all current directory changes honoring `.gitignore`. |
| `git commit -m "feat: message"` | Records staged snapshot into the local commit history. |
| `git log --oneline --graph` | Displays visual graph of commit history and branch topologies. |
| `git branch` | Lists all local branches. |
| `git switch -c <branch-name>` | Creates and switches to a new feature branch (replaces `git checkout -b`). |
| `git switch <branch-name>` | Switches between existing branches. |
| `git merge <feature-branch>` | Joins history of feature branch into active branch. |
| `git remote add origin <url>` | Links local repository to a remote GitHub URL. |
| `git push -u origin master` | Pushes local commits to GitHub and sets upstream tracking. |
| `git pull origin master` | Fetches and integrates remote commits into the current local branch. |
| `git clone <url>` | Clones an entire remote repository into a new local directory. |

---

## 3. Hands-On Branching & Merge Workflow (Lab Demonstration)

Follow these exact commands to demonstrate branch management for your lab evaluator:

### Step 1: Create a Feature Branch
```powershell
# Create and switch to a feature branch for the citizen complaint form
git switch -c feature/complaint-form
git status
```

### Step 2: Make Changes & Commit on the Feature Branch
```powershell
# Verify files in the feature branch
git add frontend/src/components/ComplaintForm.jsx
git commit -m "feat(frontend): enhance citizen complaint form validation and category selector"
```

### Step 3: Switch Back to Master and Merge
```powershell
# Switch back to the master branch
git switch master

# Merge the feature branch into master
git merge feature/complaint-form

# View the merged commit log
git log --oneline -n 5 --graph
```

### Step 4: Tracking Renamed and Deleted Files
```powershell
# Renaming a tracked file cleanly
git mv path/to/oldname.txt path/to/newname.txt
git commit -m "refactor: rename file to adhere to project naming convention"

# Removing a tracked file safely
git rm path/to/deprecated.txt
git commit -m "chore: remove deprecated test file"
```

---

## 4. Connecting Local Repository to Remote GitHub

> **Security Rule:** Never commit GitHub personal access tokens (PAT), passwords, or credentials into source files. Use Git Credential Manager or SSH keys.

### Step-by-Step Instructions:
1. Log in to your personal [GitHub Account](https://github.com).
2. Click the **`+`** icon in the upper right corner -> Select **New repository**.
3. **Repository Name:** `smart-citizen-complaint-portal`
4. **Description:** `Smart Citizen Complaint Management Portal Using DevOps CI/CD`
5. **Visibility:** Select *Public* (or *Private* as preferred).
6. **Important:** Leave *Add a README file*, *.gitignore*, and *license* **UNCHECKED** (we already created them locally).
7. Click **Create repository**.
8. In your local terminal, run:
   ```powershell
   # Add the remote origin URL
   git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/smart-citizen-complaint-portal.git

   # Verify remote URL
   git remote -v

   # Push master branch to GitHub
   git push -u origin master
   ```

---

## 5. Collaboration Workflow (`git pull` & `git clone`)

### Pulling Upstream Changes:
```powershell
git pull origin master
```

### Cloning Repository onto Another Lab Machine:
```powershell
git clone https://github.com/<YOUR_GITHUB_USERNAME>/smart-citizen-complaint-portal.git
cd smart-citizen-complaint-portal
```
